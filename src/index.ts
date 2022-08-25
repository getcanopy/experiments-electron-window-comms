import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, MessagePortMain } from 'electron';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
const PRELOAD_PATH = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;

const ports: MessagePortMain[] = []

type OurMessage = {
  topic: 'message' | 'create-child' | 'destroy-child'
  body: any
}

ipcMain.on('setup-comms', (event: IpcMainEvent) => {
  const client = event.ports[0]
  client.postMessage({ topic: 'init', body: "INITIATING COMMUNICATIONS PROTOCOL" })

  client.on('message', ({ data }) => {
    const { topic, body } = data as OurMessage
    console.log('received:', topic, body)
    client.postMessage(`Echo topic: ${topic} body: ${JSON.stringify(body, null, 2)}`)

  }).start()

  ports.push(client)
})


const createMainWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 1080,
    width: 1920,
    webPreferences: {
      preload: PRELOAD_PATH,
    },
    show: false,
  });
  // mainWindow.show()
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // and load the index.html of the app.
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  })
}

const createChildWindow = (mainWindow): void => {
  // Create the browser window.
  console.log('POPUP');
  // we should create a new BrowserWindow for the popup
  // and then, once the popup can be shown, move the BrowserView to the main window
  const childView = new BrowserView({
    webPreferences: {
      preload: PRELOAD_PATH,
    },
  });
  mainWindow.addBrowserView(childView);
  childView.setBounds({ x: 200, y: 200, width: 300, height: 300 })
  // popupWindow.setBackgroundColor('#00FF00');
  // popupWindow.show()
  childView.webContents.loadURL("https://www.google.com");
  // popupWindow.once('ready-to-show', popupWindow.show)
  childView.webContents.openDevTools();
  console.log("POPUP 1");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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
