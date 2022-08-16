import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NylasProvider } from "@nylas/nylas-react";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <NylasProvider serverBaseUrl="http://localhost:9000">
      <App />
    </NylasProvider>
  </React.StrictMode>
);
