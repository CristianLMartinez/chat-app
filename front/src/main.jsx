import { StrictMode } from 'react'
import { RouterProvider } from "react-router-dom";
import { createRoot } from 'react-dom/client'
import { routes } from './routes/Routes.jsx';
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={routes} />
  </StrictMode>,
)
