//ignore electron require statement
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")

const { port1: windowPort, port2: server } = new MessageChannel()

let dad: MessagePort | undefined

server.addEventListener("message", ({ data: {topic,body}, ports: [port] }) => {
  console.log("server received message", { topic, body, port })
  switch(topic){
    case "set-parent":
      if(!port) return
      dad = port
      port.addEventListener("message", (event) => processMessage(event, port))
      port.start()
    return

    case "prefered-size-changed":
      if(!dad) {
        console.log("no parent to send prefered size to")
        return
      }
      dad.postMessage({topic: "size-changed", body})
      return
  }
})
server.start()

ipcRenderer.postMessage("setup-comms", null, [windowPort])


const children: {port: MessagePort, element: HTMLElement}[] = []
const processMessage = (event, sender: MessagePort) => {
  const { data: { topic, body } } = event
  console.log("recieved message from child", { topic, body })
  switch (topic) {
    case "echo":
      sender.postMessage({ topic: "echo-response", body: { message: body } })
      break
    case "echo-response":
      console.log("received echo response", { topic, body })
      break
    default:
      console.log(`I have no idea what "${topic}" means, but I refuse to respond to it`)
      break
  }
}

const addChild = (port: MessagePort) => {
  console.log("adding child", port)
  const parentElement = document.getElementById("children")
  if(!parentElement) return

  const element = document.createElement("div")
  element.innerText = "I am a child"
  parentElement.appendChild(element)

  children.push({port, element})
  port.addEventListener("message", (event) => processMessage(event, port))
}

const communicator = {
  // This actually just asks the server to create a MessagePort to the browser view.
  createChild: ({ url, name }) => {
    const { port1, port2 } = new MessageChannel()
    addChild(port1)
    server.postMessage({
      topic: "create-child",
      body: {
        childName: name,
        url
      }
    }, [port2])
    port1.start()
  },
  sendToChild: (message: any) => {
    console.log(`sending message to ${children.length} children`)
    children.forEach(({port}) => {
      port.postMessage({ topic: "echo", body: message })
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
