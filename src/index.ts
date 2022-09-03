import { app, BrowserWindow, MessageEvent, MessagePortMain, ipcMain, WebContents } from "electron"

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

interface WindowOptions {
  url?: string
  preload?: string
  parentPort?: MessagePortMain
}

const parents = new Map<number, MessagePortMain>()
const createWindow = (options: WindowOptions = {}) => {
  console.log({MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: `${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}, __dirname: ${__dirname}`})
  const {url = MAIN_WINDOW_WEBPACK_ENTRY, preload= MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, } = options
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload,
      enablePreferredSizeMode: true,
    },
  })
  window.loadURL(url)
  window.webContents.on("did-finish-load", () => {
    window.webContents.openDevTools({ mode: "bottom" })
  })
  return window.webContents.id
}

const handleMessage = (port: MessagePortMain, sender:WebContents)=>{
  sender.on("preferred-size-changed", (event, size) => {
    port.postMessage({ topic: "prefered-size-changed", body: size })
  })
  return (message: MessageEvent) => {
  const { data: {body: {url,preload} }, ports: [port] } = message
    const windowId = createWindow({ url, preload})
    parents.set(windowId, port)
    return windowId
  }
}

ipcMain.on("setup-comms", ({ ports: [port], sender }) => {
  const parent = parents.get(sender.id)
  parents.delete(sender.id)
  const ports = parent ? [parent] : []
  console.log("setting up comms", {port, ports})
  port.on("message", handleMessage(port,sender))
  port.postMessage({ topic: "set-parent" }, ports)
  port.start()
})

app.on("ready", () => { createWindow() })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
