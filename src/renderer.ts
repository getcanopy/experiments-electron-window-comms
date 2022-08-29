import "./index.css"
import { h, render } from "preact"
import htm from "htm"
import { OurMessage } from "./OurMessage"
import {Communicator} from "./Communicator"

const html = htm.bind(h)
declare const comms: Communicator

const createChildView = () => {
  return comms.createChild({name:"child", url:window.location.href})
}

const destroyBrowserView = () => {
  console.log("DESTROYING BROWSERVIEW. Not really. Just pretending.")
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
render(html`<${App}/>`, document.body)
