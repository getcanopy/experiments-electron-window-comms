import path from 'path'
import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, MessageEvent, MessagePortMain, MessageChannelMain } from 'electron';
import { OurMessage } from './OurMessage';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
const PRELOAD_PATH = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;

const createMainWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 1080,
    width: 1920,
    webPreferences: {
      preload: PRELOAD_PATH,
    },
    show: false,
  });
  mainWindow.webContents.on('paint', (event, dirty, image) => {
    console.log('paint', dirty, image);
  })
  mainWindow.once('ready-to-show', () => {
    const { port1: serverPort, port2: windowPort } = new MessageChannelMain()
    serverPort.on('message', handleMessage(serverPort)).start()
    mainWindow.show();
    mainWindow.webContents.openDevTools();
    // this is temporary to fix a race condition.
    setTimeout(() => {
    mainWindow.webContents.postMessage('setup-comms', null, [windowPort])
    }, 1000)
  })


  const handleMessage = (client: MessagePortMain) => {
    return (message: MessageEvent) => {
      console.log(message);
      const { data } = message;
      const { topic, body } = data as OurMessage
      const response = { ...body, topic: `${topic}-response` }
      console.log('received:', topic, body)
      createChildView().then(childChannel => {
        // this is temporary to fix a race condition.
        setTimeout(() => {
        client.postMessage(response, [childChannel])
        }, 1000)
      })
    }
  }

  const createChildView = async ():Promise<MessagePortMain> =>  {
    // Create the browser window.
    return new Promise((resolve, reject) => {
      const childView = new BrowserView(
        {
          webPreferences: {
            preload: PRELOAD_PATH,
          },
        }
      )
      childView.webContents.once('dom-ready', () => {
        const { port1: childPort, port2: parentPort } = new MessageChannelMain()
        mainWindow.addBrowserView(childView)
        childView.webContents.openDevTools()
        childView.setBounds({ x: 0, y: 0, width: 500, height: 500 })
        childView.webContents.postMessage('setup-comms', null, [parentPort])
        console.log('child view ready')
        resolve(childPort)
      })

      childView.webContents.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    })
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
