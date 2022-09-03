import { app, BrowserWindow, MessageEvent, MessagePortMain, ipcMain } from "electron"

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

interface WindowOptions {
  url?: string
  preload?: string
  parentPort?: MessagePortMain
}

const parents = new Map<number, MessagePortMain>()

const createWindow = (options: WindowOptions = {}) => {
  const {url = MAIN_WINDOW_WEBPACK_ENTRY, preload= MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, } = options
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {preload},
  })
  window.loadURL(url)
  window.webContents.openDevTools({ mode: "bottom" })
  return window.webContents.id
}

const handleMessage = (message: MessageEvent) => {
  const { data: {body: {url,preload} }, ports: [port] } = message
    const windowId = createWindow({ url, preload})
    parents.set(windowId, port)
    return windowId
  }

ipcMain.on("setup-comms", ({ ports: [port], sender }) => {
  const parent = parents.get(sender.id)
  parents.delete(sender.id)
  port.on("message", handleMessage)
  if(parent){
    port.postMessage({ topic: "set-parent" }, [parent])
  }
  port.start()
})

app.on("ready", () => { createWindow() })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
