// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron')

const setupComms = () => {
  console.log('setting up communications')
  const id = Math.random() * 1000
  const portPromise = new Promise<MessagePort>((resolve, reject) => {

    ipcRenderer.on('setup-comms', (event) => {
      console.log(id, 'setup-comms')
      const server = event.ports[0]
      resolve(server)
    })
  })

  const communicator = {
    message: async (msg) => {
      console.log(id, 'send message: wait for port', msg)
      const server = await portPromise
      console.log(id, 'sending message', msg)
      server.postMessage({ topic: 'message', body: msg, from: id })
    },
    onMessage: async (callback) => {
      console.log(id, 'receiving: wait for port')
      const server = await portPromise
      console.log(id, 'onMessage: got port')
      server.addEventListener('message', (event) => {
        console.log(id, 'onMessage: got message', event)
        if (event.ports.length > 0) {
          console.log(id, 'onMessage: got child port!')
          const port = event.ports[0]
          port.start()
          const {port1, port2} = new MessageChannel()
          port2.addEventListener('message', console.log)
          port2.start()
          port.postMessage({ topic: 'talk-to-child', body: {originalMessage: event.data}, from: id },[port1])
        }
        callback(event.data)
      })
      server.start()
    },
  }

  contextBridge.exposeInMainWorld('comms', communicator)
}
setupComms()
