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
  serverPort.postMessage({ topic: "hi!" })

  // send the parent port to the child, if there is one
  // NOTE: This gives the only port we have access to to the child.
  // So in this case, "prime" can only have 1 child, then we lose the handle to the prime port.
  // Irl we should ask for another port from the parent before giving our only one away.
  const parent = parents.get(sender.id)
  if (parent) {
    console.log("giving away parent port")
    serverPort.postMessage({
      topic: "set-parent",
      body: { name: Math.random()}}, [parent])
      parents.delete(sender.id)
  }
})

const createWindow = (options: WindowOptions = {}) => {
  const { url = MAIN_WINDOW_WEBPACK_ENTRY, parentPort } = options
  const window = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  })
  if (parentPort) {
    parents.set(window.webContents.id, parentPort)
  }
  window.loadURL(url)
  window.webContents.once("did-finish-load", () => {
    window.webContents.openDevTools()
  })
}


const handleMessage = (client: MessagePortMain) => {
  console.log("setting up message handler")
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
    const response = { ...body, topic: `echo-${topic}` }
    client.postMessage(response)
  }
}
app.on("ready", () => { createWindow() })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
