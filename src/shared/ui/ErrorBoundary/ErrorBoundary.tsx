import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** Rendered in place of the subtree once it has thrown. */
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Keeps one broken screen from taking the rest of the app with it. React still
 * has no hook for this, hence the class.
 *
 * Reporting is not done here: `createRoot` is given `onCaughtError`, which
 * sees every error any boundary catches, with the component stack attached.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
