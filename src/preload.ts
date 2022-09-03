//ignore electron require statement
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require("electron")
console.log("starting up")
const { port1: windowPort, port2: server } = new MessageChannel()

let dad: MessagePort | undefined

server.addEventListener("message", ({ data: { topic, body }, ports: [port] }) => {
  // console.log("server received message", { topic, body, port })
  switch (topic) {
    case "set-parent":
      if (!port) return
      dad = port
      port.addEventListener("message", (event) => processMessage(event, port))
      port.start()
      return

    case "prefered-size-changed":
      if (!dad) {
        // console.log("no parent to send prefered size to")
        return
      }
      dad.postMessage({ topic: "size-changed", body })
      return
  }
})
server.start()

ipcRenderer.postMessage("setup-comms", null, [windowPort])


const children: { port: MessagePort, element: HTMLElement, id?: number }[] = []
const processMessage = (event, sender: MessagePort) => {
  const { data: { topic, body } } = event
  // console.log("recieved message from child", { topic, body })
  switch (topic) {
    case "echo": {
      sender.postMessage({ topic: "echo-response", body: { message: body } })
      return
    }
    case "echo-response": {
      console.log("received echo response", { topic, body })
      return
    }
    case "size-changed": {
      const child = children.find(c => c.port === sender)
      if (!child) return
      const { element } = child
      element.style.width = `${body.width}px`
      element.style.height = `${body.height}px`
      return
    }
    case "set-child-id": {
      console.log("setting child id", { body })
      const child = children.find(c => c.port === sender)
      if (!child) return
      console.log("found child", child)
      child.id = body
      return
    }
    default: {
      console.log(`I have no idea what "${topic}" means, and I refuse to respond to it`)
      break
    }
  }
}

const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const { target } = entry
    const child = children.find(c => c.element === target)
    if (!child) return
    const { id } = child
    console.log({id})
    const { intersectionRect } = entry
    const { x, y, width, height } = intersectionRect
    const msg = {
      topic: "position-changed", body: {
        id: child.id,
        bounds: {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height)
        }
      }
    }
    console.log("sending message to child", { msg })
    server.postMessage(msg)
    // port.postMessage({ topic: "intersection-changed", body: { intersectionRect, boundingClientRect } })
  })
})

const addChild = (port: MessagePort) => {
  console.log("adding child", port)
  const parentElement = document.getElementById("children")
  if (!parentElement) return
  const element = document.createElement("div")
  element.innerText = "I am a child"
  element.classList.add("child")
  parentElement.appendChild(element)
  intersectionObserver.observe(element)
  children.push({ port, element })
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
    children.forEach(({ port }) => {
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
