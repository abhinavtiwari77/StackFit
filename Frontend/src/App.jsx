import {RouterProvider} from "react-router"
import {router} from "./app.routes.jsx"

function app(){
  return(
    <RouterProvider router = {router} />
  )
}

export default app;