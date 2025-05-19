import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.tsx'

// Render without StrictMode to prevent double mounting behavior in development
createRoot(document.getElementById('root')!).render(
  <App />
)
