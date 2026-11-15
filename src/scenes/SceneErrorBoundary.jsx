import { Component } from 'react'

class SceneErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.error) return this.props.fallback
    return this.props.children
  }
}

export default SceneErrorBoundary
