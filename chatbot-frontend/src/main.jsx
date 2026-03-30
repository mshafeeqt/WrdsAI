// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { GrokProvider } from "./context/GrokContext";
// import { Provider } from "react-redux";
// import { store } from "./store/index.js";
// import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <>
  //   <App />
  // </>

    <GrokProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GrokProvider>

);
