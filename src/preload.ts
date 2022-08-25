// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer} = require('electron')
const setupComms = () => {
  console.log('setting up communications')
  const {port1:server, port2:client} = new MessageChannel()
  ipcRenderer.postMessage('setup-comms', null, [server])
  contextBridge.exposeInMainWorld('comms', {
    message: (msg) => {
      client.postMessage('message', msg)
    },
    onMessage: (callback) => {
      client.addEventListener('message', callback)
    },
  })
}
setupComms()
