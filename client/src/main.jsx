import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { API_BASE_URL } from './config/api'
import './index.css'
import App from './App.jsx'

// Set global axios baseURL and credentials so all /api requests target the live backend
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
