import { app, BrowserWindow, MessageEvent, MessagePortMain, ipcMain, WebContents } from "electron"

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

interface WindowOptions {
  url?: string
  preload?: string
  parentPort?: MessagePortMain
}

const parents = new Map<number, MessagePortMain>()
const windowsById = new Map<number, BrowserWindow>()
const createWindow = (options: WindowOptions = {}) => {
  const { url = MAIN_WINDOW_WEBPACK_ENTRY, preload = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, } = options
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload,
      enablePreferredSizeMode: true,
    },
  })
  windowsById.set(window.webContents.id, window)
  window.loadURL(url)
  window.webContents.on("did-finish-load", () => {
    window.webContents.openDevTools({ mode: "bottom" })
  })
  return window.webContents.id
}

const handleMessage = (port: MessagePortMain, sender: WebContents) => {
  sender.on("preferred-size-changed", (event, size) => {
    port.postMessage({ topic: "prefered-size-changed", body: size })
  })

  return (message: MessageEvent) => {
    const { data: { topic, body } } = message
    switch (topic) {
      case "set-parent": {
        parents.set(sender.id, port)
        return
      }
      case "position-changed": {
        console.log("position changed", { body })
        const { id, bounds } = body
        const window = windowsById.get(id)
        if (!window) {
          console.error("no window found for id", id)
          return
        }
        console.log(`setting bounds for ${window.webContents.id} to`, bounds)
        window.setBounds(bounds)
        return
      }
    }
    const { data: { body: { url, preload } }, ports: [wPort] } = message
    const windowId = createWindow({ url, preload })
    parents.set(windowId, wPort)
    return windowId
  }
}

ipcMain.on("setup-comms", ({ ports: [port], sender }) => {
  const parent = parents.get(sender.id)
  parents.delete(sender.id)
  if (parent) {
    parent.postMessage({ topic: "set-child-id", body: sender.id })
    port.postMessage({ topic: "set-parent" }, [parent])
  }

  port.on("message", handleMessage(port, sender))
  port.start()
})

app.on("ready", () => { createWindow() })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
