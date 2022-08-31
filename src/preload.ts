//ignore electron require statement
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")

const children: MessagePort[] = []

const processMessage = (event, sender) => {
  const { data,  } = event
  const { topic } = data
  const port = event.ports[0]
  switch (topic) {
    case "add-child":
      console.log("adding child")
      addChild(port)
      break
    case "set-parent":
      // Listen for parent messages
      port.addEventListener("message", (event) => {
        console.log("got message from parent", event.data)
      })
      port.start()
      port.postMessage({ topic: "echo", body: {message: "hello, dad"}})
      break
    case "echo":
      console.log("echoing message")
      if(!sender) {
        console.log("I don't know how this happened, but I have no one to echo to")
        return
      }
      port.postMessage({ topic: "echo-response", body: {message: "hello, son"}})
      break
    case "echo-response":
      console.log("received echo response", data)
      break
    default:
      console.log("go unknown message", event.data)
      break
  }
}

const portPromise = new Promise<MessagePort>((resolve) => {
  // listen to ONE ipc message that gives us a MessagePort to the server :)
  ipcRenderer.on("setup-comms", (event) => {
    console.log("got setup-comms message", event)
    const [server] = event.ports
    server.addEventListener("message", (event) => processMessage(event, server))
    server.start()
    resolve(server)
  })
})

ipcRenderer.send("setup-comms")

const addChild = (childPort: MessagePort) => {
  console.log("adding child")
  children.push(childPort)
  childPort.addEventListener("message", (event) => processMessage(event, childPort))
  childPort.start()
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
  sendToChild: (message: any) => {
    console.log("sending to child", message)
    children.forEach((child) => {
      child.postMessage({topic: "echo", body: message})
    }
    )
  }
}
contextBridge.exposeInMainWorld("comms", communicator)
