// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")

const setupComms = () => {
  console.log("setting up communications")
  const portPromise = new Promise<MessagePort>((resolve, reject) => {
    // listen to an ipc message that gives us a MessagePort to the server
    ipcRenderer.once("setup-comms", (event) => {
      const server = event.ports[0]
      resolve(server)
    })
  })

  const children = new Map<string, MessagePort>()
  const addChild = (childName: string, childPort: MessagePort) => {
    children.set(childName, childPort)
  }
  const communicator = {

    // This actually just asks the server to create a MessagePort to the browser view.
    createChild: async ({ url, name }) => {
      const server = await portPromise
      server.postMessage({
        topic: "create-child",
        body: {
          childName: name,
          url
        }
      })
    },
    onMessage: async (callback) => {
      const server = await portPromise
      // Listen to the server port for a message containing the MessagePort to the browser view.
      // Yes, this adds a listener for every message. Which is bad.
      server.addEventListener("message", (event) => {
        console.log("got message", event)
        const { data } = event
        const { topic, body } = data
        if (topic === "add-child") {
          if (event.ports.length > 0) {
            console.log("onMessage: got child port!")
            const childPort = event.ports[0]
            childPort.addEventListener("message", console.log)
            childPort.start()
            return callback(event.data)
          }
        }
      })
      server.start()
    },
  }

  contextBridge.exposeInMainWorld("comms", communicator)
}
setupComms()
