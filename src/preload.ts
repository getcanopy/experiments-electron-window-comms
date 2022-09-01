//ignore electron require statement
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")

const children: MessagePort[] = []
let dad
const processMessage = (event, sender:MessagePort) => {
  const { data: { topic, body }, ports: [port] } = event
  console.log({topic, body})
  switch (topic) {
    case "add-child":
      console.log("adding child")
      addChild(port)
      port.postMessage({ topic: "added-child", body: { status: "ok" } })
      break
    case "set-parent":
      dad = port
      port.addEventListener("message", (event) => {
        console.log("got message from parent", event.data)
      })
      port.start()
      port.postMessage({ topic: "echo", body: { message: "hello, dad" } })
      break
    case "echo":
      sender.postMessage({ topic: "echo-response", body: { message: "hello, son" } })
      break
    case "echo-response":
      console.log("received echo response", {topic, body})
      break
    default:
      console.log(`I have no idea what "${topic}" means, but I refuse to respond to it`)
      break
  }
}

const portPromise = new Promise<MessagePort>((resolve) => {
  // listen to ONE ipc message that gives us a MessagePort to the server :)
  ipcRenderer.once("setup-comms", (event) => {
    console.log("got setup-comms message", event)
    const [server] = event.ports
    server.addEventListener("message", (event) => processMessage(event, server))
    server.start()
    resolve(server)
  })
})

ipcRenderer.send("setup-comms")

const addChild = (childPort: MessagePort) => {
  console.log("adding child", childPort)
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
    console.log(`sending message to ${children.length} children`)
    children.forEach((child) => {
      child.postMessage({ topic: "echo", body: message })
    })
  },
  sendToParent: (message: any) => {
    console.log("sending message to dad")
    if (!dad) {
      console.log("I don't have a dad")
      return
    }
    dad.postMessage({ topic: "echo", body: message })
  }
}
contextBridge.exposeInMainWorld("comms", communicator)
// Expose the communicator in the console so we can use it in the devtools.
setTimeout(() => {
  console.log(new Array(100).fill("~").join(""))
  console.log("hello there, fellow developer. below is ur communications device.")
  console.log({ comms: communicator })
  console.log(new Array(100).fill("~").join(""))
}, 1000)
