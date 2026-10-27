import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { reportError } from './shared/lib/reportError'

createRoot(document.getElementById('root')!, {
  // Every error React sees, caught by a boundary or not, leaves through one door.
  onCaughtError: (error, info) => reportError(error, { componentStack: info.componentStack }),
  onUncaughtError: (error, info) => reportError(error, { componentStack: info.componentStack }),
  onRecoverableError: (error, info) => reportError(error, { componentStack: info.componentStack }),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
