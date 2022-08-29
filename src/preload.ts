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
    childPort.addEventListener("message", (event) => {
      const {data} = event
      console.log(`child ${childName} sent message`, data)
    })
    children.set(childName, childPort)
  }
  const processMessage = (event) => {
    console.log("got message", event)
    const { data } = event
    const { topic, body } = data
    const { name } = body
    const port = event.ports[0]
    console.log(`recieved message with topic: ${topic}`)
    switch (topic) {
      case "add-child":
        console.log("adding child", name)
        if (!port) {
          throw new Error("no port in add-child message")
        }
        addChild(name, port)
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
      const server = await portPromise
      server.postMessage({
        topic: "create-child",
        body: {
          childName: name,
          url
        }
      })
    },
    onMessage: async () => {
      const server = await portPromise
      // Listen to the server port for a message containing the MessagePort to the browser view.
      // Yes, this adds a listener for every message. Which is bad.
      server.addEventListener("message", processMessage)
      server.start()
    },
  }

  contextBridge.exposeInMainWorld("comms", communicator)
}
setupComms()
