
# Project: TNG VoiceTrust — Core Prototype (AWS + Graph Trust Lending)

Build a mobile-first full-stack prototype based on the provided frontend HTML prototype (`trust-flows-v5.html`).

Goal:
Convert the static prototype into a working deployable application focused ONLY on:

1. Trust Link Module
2. Loan Module
3. Trust Graph Visualization
4. Trust-Based Loan Decisioning

Deployable on AWS EC2.

Prioritize working demo over production completeness.

---

## Scope

Keep only the main user flow:

User A → create trust link → User B accepts → trust network forms → User A applies loan → Guarantor approves → Loan becomes active → Repayment simulation → Trust score updates

No real payment gateway required.
Repayment can be mocked.

No full KYC.
No notification system.
No file upload system.

---

## Tech Stack

Frontend:

- React + Vite
- TailwindCSS
- React Router
- Zustand
- D3.js

Backend:

- Node.js
- Express

Database:

- Amazon RDS (PostgreSQL)

Graph Database:

- Amazon Neptune

Hosting:

- AWS EC2

Optional:

- API Gateway
- S3 (static assets)

---

## Core Architecture

Frontend (React)
↓
Express API (EC2)
↓
RDS (loan + user records)
↓
Neptune (trust relationships)

---

## Mock Authentication

Use simple mock login.

No Cognito.

Mock users:

- borrower_01
- guarantor_01
- guarantor_02

Store mock profiles in PostgreSQL.

---

## Core Module 1: Trust Link Module

Purpose:
Create and manage trust relationships.

Core flow:

- send trust request
- accept trust request
- visualize trust graph
- calculate trust strength

Neptune graph:

Vertices:
User

Edges:
TRUSTS
GUARANTEES
REPAID
DEFAULTED

Required APIs:

POST /trust/request
POST /trust/accept
GET /trust/network/:userId
GET /trust/strength/:userId

Functions:

createTrustLink()
acceptTrustLink()
getTrustNetwork()
calculateTrustStrength()

Neptune usage:

- direct trust lookup
- second-degree trust lookup
- relationship path discovery

---

## Core Module 2: Loan Module

Purpose:
Trust-based micro-loan workflow.

Core flow:

Borrower creates loan request
↓
Guarantor reviews
↓
Approve/reject
↓
Loan active
↓
Repayment simulation
↓
Trust graph update

Loan states:

pending
approved
active
repaid
defaulted

Required APIs:

POST /loan/apply
POST /loan/approve
POST /loan/reject
POST /loan/repay
GET /loan/status/:loanId

Functions:

applyLoan()
approveLoan()
rejectLoan()
repayLoan()

Repayment:
Mock transaction only.
No payment gateway.

---

## Trust Score Logic (Simple)

Use rule-based scoring.

No Bedrock.

Formula:

Base Score = 50

+ successful repayments
+ active guarantors
+ strong trust links

- defaults
- rejected loans

Store score in PostgreSQL.

Update after:

- repayment
- default

---

## Database Design

PostgreSQL Tables:

users
trust_requests
loans
repayments

Fields:

users:
id
name
trust_score

trust_requests:
id
sender_id
receiver_id
status

loans:
id
borrower_id
guarantor_id
amount
status

repayments:
id
loan_id
amount
status

---

## Neptune Graph Design

(User)-[:TRUSTS]->(User)

(User)-[:GUARANTEES]->(User)

(User)-[:REPAID]->(Loan)

(User)-[:DEFAULTED]->(Loan)

---

## Frontend Pages

Convert existing HTML into React pages:

1. Home
2. Connections
3. Trust Network
4. Apply Loan
5. Review Loan
6. Loan Tracking

Preserve:

- mobile-first UI
- trust graph visualization
- trust score indicator

---

## Required Deliverables

Generate:

1. Frontend code
2. Backend code
3. REST APIs
4. PostgreSQL schema
5. Neptune schema
6. AWS EC2 deployment guide
7. Environment variables
8. Seed data
9. API integration layer
10. Folder structure

---

## Project Structure

/frontend
/backend

frontend:
pages/
components/
services/

backend:
routes/
controllers/
services/
models/

---

## Development Priority

Phase 1:
Mock users + Trust links

Phase 2:
Neptune graph integration

Phase 3:
Loan workflow

Phase 4:
Repayment simulation

Phase 5:
EC2 deployment

---

Rules:

Keep architecture modular.
Keep backend lightweight.
Use mock data where possible.
Focus on demonstrating trust-based lending.
Optimize for hackathon demo.
