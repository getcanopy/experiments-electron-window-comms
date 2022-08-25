import './index.css';
import { h, Component, render } from 'preact';
import htm from 'htm';

const html = htm.bind(h);
function App (props) {
  return html`<h1>Hello ${props.name}!</h1>`;
}

render(html`<${App} name="Everyone" />`, document.body);
