import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { IconContext } from "@phosphor-icons/react";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

// Mount the React tree to the DOM. One IconContext sets the Phosphor defaults.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <IconContext.Provider value={{ weight: "regular", size: 20 }}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </IconContext.Provider>
  </React.StrictMode>
);
