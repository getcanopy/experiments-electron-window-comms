import "./index.css"
import { h, render } from "preact"

import htm from "htm"
import {Communicator} from "./Communicator"

const html = htm.bind(h)
declare const comms: Communicator

const createChildView = () => {
  // use Reddit because its preferred size changes
  return comms.createChild({name:"child", url:"https://reddit.com"})
}

const App =  () => {
  // const [children, setChildren] = useState<MessagePort[]>([])
  return html`
  <h1>Create a "child" BrowserWindow and link em together</h1>
  <p>Now isn't that exciting.</p>
  <div id="control-browser-views">
    <button onClick=${createChildView}>Create And Link</button>
  </div>
  <div id="children"></div>
  `
}
render(html`<${App}/>`, document.body)
