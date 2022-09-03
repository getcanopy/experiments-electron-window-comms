import "./index.css"

import * as React from "react"
import { createRoot } from "react-dom/client"

import {Communicator} from "./Communicator"
declare const comms: Communicator

const createChildView = () => {
  // use Reddit because its preferred size changes
  return comms.createChild({name:"child", url:"https://reddit.com"})
}

const App =  () => {

  return (
    <div className="App">
      <h1>Create a "child" BrowserWindow and link em together</h1>
      <p>Now isn't that exciting.</p>
      <div id="control-browser-views">
      <button onClick={createChildView}>Create And Link</button>
    </div>
  <div id="children"></div>
</div>
  )
}
const container = document.getElementById("root")
const root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<App tab="home" />)
