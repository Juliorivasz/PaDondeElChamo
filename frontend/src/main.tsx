import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import { registerLocale } from "react-datepicker"
import { es } from "date-fns/locale/es"
import { routes } from "./routes"

registerLocale("es", es)

const router = createBrowserRouter(routes)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
