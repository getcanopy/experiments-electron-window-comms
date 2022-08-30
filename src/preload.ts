//ignore electron require statement
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")
console.log("setting up communications")
const portPromise = new Promise<MessagePort>((resolve) => {
  // listen to ONE ipc message that gives us a MessagePort to the server :)
  ipcRenderer.once("setup-comms", (event) => {
    console.log("got setup-comms message", event)
    const server = event.ports[0]
    server.onmessage = processMessage
    resolve(server)
  })
})

const addChild = (childPort: MessagePort) => {
  childPort.onmessage =  (event) => {
    const { data } = event
    console.log("got message from child", data)
  }
}
const processMessage = (event) => {
  console.log("got message", event)
  const { data } = event
  const { topic } = data
  const port = event.ports[0]
  console.log(`recieved message with topic: ${topic}`)
  switch (topic) {
    case "add-child":
      console.log("adding child", name)
      if (!port) {
        throw new Error("no port in add-child message")
      }
      addChild(port)
      break
    case "set-parent":
      port.addEventListener("message", (event) => {
        console.log("got message from parent", event.data)
      })
      break
    default:
      console.log("got message", event.data)
      break
  }
}
const communicator = {

  // This actually just asks the server to create a MessagePort to the browser view.
  createChild: async ({ url, name }) => {
    console.log("creating child", { url, name })
    const server = await portPromise
    server.postMessage({
      topic: "create-child",
      body: {
        childName: name,
        url
      }
    })
  },
}
contextBridge.exposeInMainWorld("comms", communicator)
