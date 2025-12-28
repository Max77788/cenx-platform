import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { checkServerRunning, showServerError } from "./serverCheck";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Check if server is running before rendering the app
checkServerRunning().then((isRunning) => {
  if (isRunning) {
    root.render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  } else {
    showServerError();
  }
});
