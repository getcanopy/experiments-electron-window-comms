// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron')

const setupComms = () => {

  console.log('setting up communications')
  const { port1: server, port2: client } = new MessageChannel()

  ipcRenderer.postMessage('setup-comms', null, [server])

  const communicator = {
    message: (msg) => {
      client.postMessage({ topic: 'message', body: msg })
    },
    onMessage: (callback) => {
      client.start()
      client.addEventListener('message', (event) => {
        callback(event.data, event.ports[0])
      })
    },
  }

  contextBridge.exposeInMainWorld('comms', communicator)
}
setupComms()
