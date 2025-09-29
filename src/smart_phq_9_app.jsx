import React, { useEffect, useState } from "react";
import "./style.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import FHIR from "fhirclient";

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly or being fidgety/restless",
  "Thoughts that you would be better off dead or of hurting yourself",
];

const options = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

function getSeverity(score) {
  if (score <= 4) return "Minimal";
  if (score <= 9) return "Mild";
  if (score <= 14) return "Moderate";
  if (score <= 19) return "Moderately Severe";
  return "Severe";
}

function getSeverityClass(severity) {
  switch (severity) {
    case "Minimal":
      return "row-minimal";
    case "Mild":
      return "row-mild";
    case "Moderate":
      return "row-moderate";
    case "Moderately Severe":
      return "row-moderately-severe";
    case "Severe":
      return "row-severe";
    default:
      return "";
  }
}

const SmartPHQ9App = () => {
  const [client, setClient] = useState(null);
  const [patient, setPatient] = useState(null);
  const [responses, setResponses] = useState({});
  const [submittedResponses, setSubmittedResponses] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const client = await FHIR.oauth2.ready();
        setClient(client);
        const patient = await client.patient.read();
        setPatient(patient);
      } catch (error) {
        console.error("Error initializing SMART on FHIR:", error);
      }
    };
    fetchPatient();
  }, []);

  const handleChange = (qIndex, value) => {
    setResponses((prev) => ({ ...prev, [qIndex]: value }));
    if (errors[qIndex]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[qIndex];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    const unanswered = [];
    for (let i = 0; i < questions.length; i++) {
      if (responses[i] === undefined) {
        newErrors[i] = true;
        unanswered.push(i + 1);
      }
    }
    if (unanswered.length > 0) {
      setErrors(newErrors);
      const firstUnanswered = document.getElementById(`question-${unanswered[0] - 1}`);
      if (firstUnanswered) {
        firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      alert(
        `Please answer all questions before submitting.\nUnanswered question(s): ${unanswered.join(", ")}`
      );
      return;
    }

    setErrors({});

    const score = Object.values(responses).reduce((a, b) => a + b, 0);
    const severity = getSeverity(score);

    const newEntry = {
      date: new Date().toLocaleString(),
      score,
      severity,
    };
    setSubmittedResponses([...submittedResponses, newEntry]);

    const qr = {
      resourceType: "QuestionnaireResponse",
      status: "completed",
      questionnaire: "Questionnaire/phq9", // Update if you upload a Questionnaire resource
      subject: {
        reference: `Patient/${patient.id}`,
      },
      authored: new Date().toISOString(),
      item: questions.map((qText, idx) => ({
        linkId: `${idx + 1}`,
        text: qText,
        answer: [
          {
            valueInteger: responses[idx],
          },
        ],
      })),
    };

    try {
      // ✅ Save QuestionnaireResponse
      const qrResponse = await client.request({
        method: "POST",
        url: "QuestionnaireResponse",
        body: qr,
        headers: {
          "Content-Type": "application/fhir+json",
        },
      });

      // ✅ Create Observation based on QR result
      const observation = {
        resourceType: "Observation",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "survey",
                display: "Survey",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "44249-1",
              display: "PHQ-9 total score",
            },
          ],
          text: "PHQ-9 total score",
        },
        subject: {
          reference: `Patient/${patient.id}`,
        },
        effectiveDateTime: new Date().toISOString(),
        valueInteger: score,
        derivedFrom: [
          {
            reference: `QuestionnaireResponse/${qrResponse.id}`,
          },
        ],
      };

      // ✅ Save Observation
      const obsResponse = await client.request({
        method: "POST",
        url: "Observation",
        body: observation,
        headers: {
          "Content-Type": "application/fhir+json",
        },
      });

      console.log("Saved QuestionnaireResponse:", qrResponse);
      console.log("Saved Observation:", obsResponse);
      alert(`Saved to server!\nScore: ${score}\nSeverity: ${severity}`);
    } catch (err) {
      console.error("There was a problem saving your response:", err);
      alert("Failed to save response to server: " + err.message);
    }

    setResponses({});
  };

  return (
    <div className="app-container">
      <div className="header">PHQ-9 Depression Questionnaire</div>

      <div className="patient-info">
        Patient:{" "}
        {patient
          ? `${patient.name?.[0]?.given?.join(" ")} ${patient.name?.[0]?.family}`
          : "Loading..."}{" "}
        &nbsp; Gender: {patient ? patient.gender : "..."} &nbsp; Age:{" "}
        {patient
          ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear()
          : "..."}{" "}
        &nbsp; Date: {new Date().toLocaleString()}
      </div>

      <div className="instruction">
        Over the last 2 weeks, how often have you been bothered by the following problems?
      </div>

      {questions.map((q, idx) => (
        <div key={idx} id={`question-${idx}`} className="question-card">
          <div className="question-text">
            {idx + 1}. {q}
          </div>
          <div className="options-row">
            {options.map((opt) => (
              <label key={opt.value} className="option-label">
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value={opt.value}
                  checked={responses[idx] === opt.value}
                  onChange={() => handleChange(idx, opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {errors[idx] && (
            <div className="error-message">⚠️ Please answer this question.</div>
          )}
        </div>
      ))}

      <div className="button-row">
        <button className="no-wrap" onClick={handleSubmit}>
          Submit Response
        </button>
      </div>

      {submittedResponses.length > 0 && (
        <div className="past-responses">
          <h3>Past Responses</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {submittedResponses.map((res, idx) => (
                <tr key={idx} className={getSeverityClass(res.severity)}>
                  <td>{res.date}</td>
                  <td>{res.score}</td>
                  <td>{res.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {submittedResponses.length > 0 && (
        <div className="chart-container">
          <h3>PHQ-9 Scores Over Time</h3>
