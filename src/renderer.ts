import './index.css';
import { h, render } from 'preact';
import htm from 'htm';
import {v4 as uuidv4} from 'uuid'
import { OurMessage } from './OurMessage';
import {Communicator} from './Communicator'

const html = htm.bind(h);
declare const comms: Communicator;

const createBrowserView = () => {
  comms.message({topic:'create-child',body:{
    id: uuidv4(),
  }})
}

const destroyBrowserView = () => {
  console.log("DESTROYING BROWSERVIEW. Not really. Just pretending.");
}

const handleMessage = ({topic, body}:OurMessage) => {
  console.log(topic, body)
}

comms.onMessage(handleMessage)

const App =  () => {
  return html`
  <h1>This thing can probably control BrowserViews</h1>
  <p>Now isn't that exciting.</p>
  <div id="control-browser-views">
    <button onClick=${createBrowserView}>Create BrowserView</button>
    <button onClick=${destroyBrowserView}>Destroy BrowserViews</button>
  </div>`
}

render(html`<${App}/>`, document.body);
