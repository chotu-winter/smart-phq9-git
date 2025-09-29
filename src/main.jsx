// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import FHIR from "fhirclient";
import SmartPHQ9App from "./smart-phq9-git";
import "./index.css"; // or your global styles

// 🔹 Kick off SMART on FHIR OAuth2
FHIR.oauth2.authorize({
  clientId: "smart-phq9-app", // must match what you register in SMART Launcher
  scope:
    "launch/patient patient/QuestionnaireResponse.write patient/Observation.write openid fhirUser offline_access",
  redirectUri: ""https://chotu-winter.github.io/smart-phq9-git/index.html", // must EXACTLY match SMART Launcher config
});

// 🔹 Once authorized, hand off the client to your app
FHIR.oauth2
  .ready()
  .then((client) => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<SmartPHQ9App fhirClient={client} />);
  })
  .catch((err) => {
    console.error("SMART on FHIR auth failed:", err);
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <div style={{ padding: "2rem", color: "red" }}>
        ❌ Failed to launch SMART on FHIR: {err.message}
      </div>
    );
  });
