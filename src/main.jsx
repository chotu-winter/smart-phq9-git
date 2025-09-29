// main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import FHIR from "fhirclient";
import SmartPHQ9App from "./smart_phq_9_app.jsx";
import "./style.css";

FHIR.oauth2
  .ready()
  .then((client) => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<SmartPHQ9App client={client} />);
  })
  .catch((err) => {
    console.error("FHIR client failed to load:", err);
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <div>
        <h1>Failed to connect to FHIR server</h1>
        <pre>{err.message}</pre>
      </div>
    );
  });

