import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { RiderHubProvider } from './store/RiderHubProvider'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RiderHubProvider>
      <App />
    </RiderHubProvider>
  </StrictMode>
)
