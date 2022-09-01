import { app, BrowserWindow, MessageChannelMain, MessageEvent, MessagePortMain, ipcMain } from "electron"

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

interface WindowOptions {
  url?: string
  parentPort?: MessagePortMain
}
const parents = new Map<number, MessagePortMain>()

// The preload tells the main process it's ready to upgrade to a MessagePort.
ipcMain.on("setup-comms", (event) => {
  const { sender } = event
  const { port1: serverPort, port2: windowPort } = new MessageChannelMain()

  serverPort.on("message", handleMessage(serverPort))
  sender.postMessage("setup-comms", null, [windowPort])

  const parent = parents.get(sender.id)
  if (parent) {
    createMessagePortTo(parent).then((port) => {
      console.log("created message port to parent")
      serverPort.postMessage({ topic: "set-parent" }, [port])
    })
  }
})

const createWindow = (options: WindowOptions = {}) => {
  const { url = MAIN_WINDOW_WEBPACK_ENTRY, parentPort } = options
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  })
  if (parentPort) {
    parents.set(window.webContents.id, parentPort)
  }
  window.loadURL(url)
  window.webContents.once("did-finish-load", () => {
  window.webContents.openDevTools({mode:"bottom"})
  })
}


const handleMessage = (client: MessagePortMain) => {
  client.start()
  return (message: MessageEvent) => {

    console.log({ recieved: message.data })
    const { data } = message
    const { topic, body } = data
    if (topic === "create-child") {
      const { url } = body
      createWindow({ url, parentPort: client })
      return
    }
    const response = { ...body, topic: "echo" }
    client.postMessage(response)
  }
}
app.on("ready", () => { createWindow() })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
const createMessagePortTo = (parent: MessagePortMain): Promise<MessagePortMain> => {
  return new Promise((resolve) => {
    const { port1, port2 } = new MessageChannelMain()
    port2.once("message", () => {
      resolve(port2)
    })
    port2.start()
    parent.postMessage({ topic: "add-child" }, [port1])
  })
}

