import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from '@heroui/react'
import './styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider placement="top end" />
    <App />
  </StrictMode>
)
