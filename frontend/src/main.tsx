import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { resolveTheme, applyTheme } from './utils/themeManager'

// Initialize the theme immediately before React renders
applyTheme(resolveTheme())

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
