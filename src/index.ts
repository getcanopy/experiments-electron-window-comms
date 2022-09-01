import { app, BrowserWindow, MessageEvent, MessagePortMain, ipcMain } from "electron"

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

interface WindowOptions {
  url?: string
  parentPort?: MessagePortMain
}

const parents = new Map<number, MessagePortMain>()

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
  window.webContents.openDevTools({ mode: "bottom" })
}


const handleMessage = (client: MessagePortMain) => {
  client.start()
  return (message: MessageEvent) => {
    const { data: { topic, body }, ports: [port] } = message
    console.log({ topic, body, port })
    if (topic === "create-child") {
      const { url } = body
      createWindow({ url, parentPort: port })
      return
    }
  }
}

ipcMain.on("setup-comms", ({ ports: [port], sender }) => {
  console.log("got port", port)
  port.on("message", handleMessage(port))
  const parent = parents.get(sender.id)
  parents.delete(sender.id)
  const ports = parent ? [parent] : []
  port.postMessage({ topic: "set-parent" }, ports)
})

app.on("ready", () => { createWindow() })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

