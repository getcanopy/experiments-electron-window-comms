import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, MessageEvent, MessagePortMain } from 'electron';
import { OurMessage } from './OurMessage';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
const PRELOAD_PATH = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;

const createMainWindow = () => {

  ipcMain.on('setup-comms', (event: IpcMainEvent) => {
    const client = event.ports[0]
    client.postMessage({ topic: 'init', body: "INITIATING COMMUNICATIONS PROTOCOL" })

    client.on('message', handleMessage(client)).start()
  })

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 1080,
    width: 1920,
    webPreferences: {
      preload: PRELOAD_PATH,
    },
    show: false,
  });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  })


  const handleMessage = (client: MessagePortMain) => {
    return (message: MessageEvent) => {
      console.log(message);
      const { data } = message;
      const { topic, body } = data as OurMessage
      const response = { ...body, topic: `${topic}-response` }
      console.log('received:', topic, body)
      createChildView()

      client.postMessage(response)

    }
  }

  const createChildView = (): void => {
    // Create the browser window.
    const childView = new BrowserView()
    childView.setBounds({ x: 1920 / 2 - 250, y: 1080 / 2 - 250, width: 250, height: 250 })
    childView.webContents.loadURL("https://www.google.com");
    mainWindow.addBrowserView(childView)
    // mainWindow.setBrowserView(childView)

  }


  const createChildWindow = (): void => {
    // Create the browser window.
    const childWindow = new BrowserWindow({
      height: 108,
      width: 192,
      movable: false,
      resizable: false,
      show: false,
      parent: mainWindow,
      webPreferences: {
        preload: PRELOAD_PATH,
      },
    });
    // mainWindow.show()
    childWindow.loadURL("https://www.google.com");
    childWindow.once('ready-to-show', () => {
      console.log('shown')
      const view = childWindow.getBrowserView()!
      mainWindow.addBrowserView(view)
    })
    console.log({ childWindow })
  }
}
app.on('ready', createMainWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
