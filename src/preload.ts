//ignore electron require statement
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")

console.log("the preload exists")
const processMessage = (event) => {
  const { data,  } = event
  console.log("got message",data)

  // const port = event.ports[0]

  // const { topic } = data
  // console.log(`recieved message with topic: ${topic}`, data)
  // switch (topic) {
  //   case "add-child":
  //     console.log("adding child")
  //     addChild(port)
  //     break
  //   case "set-parent":
  //     port.addEventListener("message", (event) => {
  //       console.log("got message from parent", event.data)
  //     })
  //     break
  //   default:
  //     console.log("got message", event.data)
  //     break
  // }
}

const portPromise = new Promise<MessagePort>((resolve) => {
  // listen to ONE ipc message that gives us a MessagePort to the server :)
  ipcRenderer.on("setup-comms", (event) => {
    console.log("got setup-comms message", event)
    const [server] = event.ports
    server.addEventListener("message", (event) => {
      console.log("got message from server", event.data)
      const { topic, body } = event.data
    })
    server.start()
    resolve(server)
  })
})

ipcRenderer.send("setup-comms")

const addChild = (childPort: MessagePort) => {
  childPort.onmessage =  (event) => {
    const { data } = event
    console.log("got message from child", data)
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
