import './index.css';
import { h, render } from 'preact';
import htm from 'htm';
const html = htm.bind(h);

function App (props) {
  return html`
  <h1>This thing can probably control BrowserViews</h1>
  <p>Now isn't that exciting.</p>
  <div id="control-browser-views">
    <button id="create-browser-view">Create BrowserView</button>
    <button id="destroy-browser-view">Destroy BrowserViews</button>
  </div>`
}

render(html`<${App}/>`, document.body);
