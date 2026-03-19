# Gemini Application Generation Prompt

## Project Overview

Generate a fullstack SaaS application called **CV Platform**.

The platform manages packages received by a physical store for its clients.

Employees use the system to:

* register packages
* assign packages to clients
* notify clients
* confirm package pickup

This is a **portfolio-grade AI-assisted fullstack project**.

---

# Architecture

The system must follow a clean architecture.

Frontend
Next.js
React
Tailwind CSS

Backend
Node.js
Express

Database
PostgreSQL

Authentication
JWT

---

# Repository Structure

The generated code must follow this structure:

frontend
backend
database
tests

---

# Frontend Requirements

Use:

Next.js
React
Tailwind CSS

Features:

Login page

Dashboard with statistics

Client management

Package management

Notifications page

Analytics dashboard

Settings page

Internationalization support.

Languages:

Spanish
English
German

Use JSON translation files.

---

# Backend Requirements

Use:

Node.js
Express

Implement REST API.

Authentication using JWT.

Endpoints:

POST /api/auth/register
POST /api/auth/login

GET /api/clients
POST /api/clients
PUT /api/clients/:id
DELETE /api/clients/:id

GET /api/packages
POST /api/packages
PUT /api/packages/:id
POST /api/packages/:id/pickup

GET /api/notifications

---

# Database Schema

Use PostgreSQL.

Tables:

users

fields:
id
email
password_hash
created_at

clients

fields:
id
name
phone
email
address
created_at

packages

fields:
id
package_id
client_id
carrier
arrival_date
status
notes
created_at

status values:

ARRIVED
READY_FOR_PICKUP
PICKED_UP

notifications

fields:
id
client_id
package_id
type
sent_at
status

---

# Testing

Generate test structure:

unit tests
integration tests
e2e tests

Recommended tools:

Jest
Playwright

---

# DevOps

Prepare the project for CI/CD.

Use GitHub Actions.

Include:

test workflow
build workflow

---

# Output

Generate a fullstack project scaffold compatible with:

Next.js
Node.js
PostgreSQL

Code must be modular, readable, and production-ready.
