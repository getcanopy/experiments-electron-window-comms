// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")

const setupComms = () => {
  console.log("setting up communications")
  // the id is just for  debugging purposes.
  const id = Math.random() * 1000
  const portPromise = new Promise<MessagePort>((resolve, reject) => {

    // listen to an ipc message that gives us a MessagePort to the server
    ipcRenderer.once("setup-comms", (event) => {
      console.log(id, "setup-comms")
      const server = event.ports[0]
      resolve(server)
    })
  })
  const communicator = {
    // This actually just asks the server to create a MessagePort to the browser view.
    askServerForNewBrowserView: async (msg) => {
      console.log(id, "send message: wait for port", msg)
      const server = await portPromise
      console.log(id, "sending message", msg)
      // it doesn't matter what message we put here
      server.postMessage({from: id })
    },
    onMessage: async (callback) => {
      console.log(id, "receiving: wait for port")
      const server = await portPromise
      console.log(id, "onMessage: got port")

      // Listen to the server port for a message containing the MessagePort to the browser view.
      // Yes, this adds a listener for every message. Which is bad.
      server.addEventListener("message", (event) => {
        console.log(id, "onMessage: got message", event)
        if (event.ports.length > 0) {
          // if we get a message with a port, then we assume that it's a child port.
          // This is given to us by the server as a result of asking the server to create a new BrowserView.
          console.log(id, "onMessage: got child port!")
          const port = event.ports[0]
          port.start()
          const {port1:toChildPort, port2:fromChildPort} = new MessageChannel()

          fromChildPort.addEventListener("message", (event) => {
            console.log(id, "onMessage: got child message", event)
          })

          fromChildPort.start()
          port.postMessage({ topic: "talk-to-child", body: {originalMessage: event.data}, from: id },[toChildPort])
        }
        callback(event.data)
      })
      server.start()
    },
  }

  contextBridge.exposeInMainWorld("comms", communicator)
  contextBridge.exposeInMainWorld("communicator", communicator)
}
setupComms()
