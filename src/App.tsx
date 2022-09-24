import React from 'react'
import './App.css'
import { PortPortal, usePortPortal } from './PortPortalFunctional'

const HappyGreeting = () => {
  const { greeting, emoji } = usePortPortal()

  return <div>
    <span>{emoji}</span>
    <span>{greeting}</span>
    <span>{emoji}</span>
  </div>
}

const SomethingElse = ({ bgColor, onClick }) => {
  return <div style={{ backgroundColor: bgColor }}>
    <button onClick={onClick}>Click me!</button>
  </div>
}
const { port1, port2 } = new MessageChannel()

setInterval(() => {
  port2.postMessage({ greeting: `hello from time: ${Date.now()}` })
}, 100)

setInterval(() => {
  port2.postMessage({ bgColor: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` })
}, 1000)

function App() {
  return (
    <PortPortal port={port1}>
      <div className="App">
        <HappyGreeting />
        <SomethingElse bgColor='blue' onClick={() => console.log('clicked')} />
      </div>
    </PortPortal>
  )
}

export default App
