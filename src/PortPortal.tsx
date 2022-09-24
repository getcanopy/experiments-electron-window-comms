import React, { ReactElement } from "react"

// put state on context instead of local component state
// create a hook with useContext to access the state

// export const usePortPortal = useContext(PortPortalContext)

class PortPortal extends React.Component<{ port: MessagePort, children: ReactElement | ReactElement[] }> {
  port: MessagePort
  state: { props: any }
  constructor(props) {
    super(props)
    const { port } = props
    this.port = port
    this.state = { props: {} }
  }
  componentDidMount = () => {
    this.props.port.addEventListener("message", this.handleChange)
    this.props.port.start()
  }
  componentWillUnmount = () => {
    this.props.port.removeEventListener("message", this.handleChange)
  }
  handleChange = ({ data: props }) => {
    this.setState({ props: { ...props } })
  }
  render = () => {
    const { children } = this.props
    return React.Children.map(children, (child) => React.cloneElement(child, this.state.props))
  }
}
export { PortPortal }
