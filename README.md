# SMART PHQ-9 App

This is a React-based SMART on FHIR application to administer the PHQ-9 Depression Questionnaire. It supports:
Description

- SMART on FHIR launch & OAuth2 authentication
- Fetching patient demographics
- Submitting `QuestionnaireResponse` to FHIR server

## Prerequisites

- Node.js (v18+) and npm installed
- Access to a SMART on FHIR server

## Installation

1. Clone or download this project.
2. Install dependencies:

```bash
npm install


A SMART-on-FHIR app that allows patients to complete the PHQ-9 questionnaire and stores their responses 
in Epic using QuestionnaireResponse.create. Compatible with R4 FHIR servers.
Features

Patient-facing PHQ-9 form

SMART launch via EHR or standalone

FHIR R4 support

Stores data as QuestionnaireResponse

Optional read access to existing Observation resources

FHIR Resources Used

Patient.read

Condition.read, Condition.search

Observation.read (Assessments)

Questionnaire.read (Patient-Entered)

QuestionnaireResponse.read, QuestionnaireResponse.create (Patient-Entered)

PractitionerRole.read, PractitionerRole.search

SMART Scopes

launch openid fhirUser profile
patient/Patient.read
patient/Observation.read
patient/Condition.read
patient/Questionnaire.read
patient/QuestionnaireResponse.read
patient/QuestionnaireResponse.write



Launch URL (e.g. https://yourdomain.com/launch.html)