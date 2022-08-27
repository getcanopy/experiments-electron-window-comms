import './index.css'
import { h, render } from 'preact'
import htm from 'htm'
import { OurMessage } from './OurMessage'
import {Communicator} from './Communicator'

const html = htm.bind(h)
declare const comms: Communicator

const createChildView = () => {
  return comms.message({topic: 'create-child'})
}

const destroyBrowserView = () => {
  console.log("DESTROYING BROWSERVIEW. Not really. Just pretending.")
}

const handleMessage = (message:OurMessage) => {
  console.log('renderer got', message)
}

comms.onMessage(handleMessage)

const randomBackgroundColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

const addRandomBackgroundStyle = () => {
  const style = document.createElement('style');
  style.innerHTML = `body { background-color: ${randomBackgroundColor()} }`;
  document.head.appendChild(style);
}
const App =  () => {
  return html`
  <h1>This thing can probably control BrowserViews</h1>
  <p>Now isn't that exciting.</p>
  <div id="control-browser-views">
    <button onClick=${createChildView}>Create BrowserView</button>
    <button onClick=${destroyBrowserView}>Destroy BrowserViews</button>
  </div>`
}
setInterval(() => {
  addRandomBackgroundStyle()
} , 1000)

render(html`<${App}/>`, document.body)
