import "./index.css"
import { h, render } from "preact"

import htm from "htm"
import {Communicator} from "./Communicator"

const html = htm.bind(h)
declare const comms: Communicator

const createChildView = () => {
  return comms.createChild({url:"https://reddit.com"})
}

const App =  () => {
  // const [children, setChildren] = useState<MessagePort[]>([])
  return html`
  <h1>Create a "child" BrowserWindow and link em together</h1>
  <p>Now isn't that exciting.</p>
  <div id="control-browser-views">
    <button onClick=${createChildView}>Create And Link</button>
  </div>`
}
render(html`<${App}/>`, document.body)
