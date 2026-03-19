# Stitch UI Prompt

## Context

Design a modern SaaS dashboard interface for a **Package Management Platform**.

The platform is used by a physical store to manage packages that arrive for clients.

Employees can:

* register packages
* assign packages to clients
* notify clients
* confirm when packages are picked up

The UI must feel like a professional SaaS product similar to:

* Stripe
* Linear
* Notion
* Vercel dashboards

---

# Design Principles

Style:

* modern SaaS
* clean
* minimal
* responsive
* accessible

Framework compatibility:

* React
* Next.js
* Tailwind CSS

Support:

* light mode
* dark mode

---

# Application Pages

## Login

Fields:

* email
* password

Buttons:

* sign in

---

## Dashboard

Widgets:

* packages received today
* packages waiting for pickup
* packages picked up today

Tables:

* recent packages
* recent pickups

---

## Clients

Table showing:

* client name
* phone
* email
* packages waiting

Actions:

* add client
* edit client
* delete client

---

## Packages

Table showing:

* package id
* client
* carrier
* arrival date
* status

Statuses:

* arrived
* ready for pickup
* picked up

Actions:

* register package
* mark as picked up

---

## Register Package

Form fields:

* client selector
* carrier
* package id
* arrival date
* notes

Submit button:

* register package

---

## Notifications

List showing notifications sent to clients.

---

## Analytics

Charts:

* packages received per day
* packages picked up per day

---

## Settings

User profile

Language selection

---

# Navigation Layout

Sidebar navigation:

* Dashboard
* Clients
* Packages
* Notifications
* Analytics
* Settings

Top bar:

* user avatar
* language switcher

---

# Internationalization

Support the following languages:

* Spanish
* English
* German

Language selector in the top bar.

---

# Output Requirements

Generate a complete UI structure compatible with:

Next.js
React
Tailwind CSS

Include:

* page layout
* reusable components
* tables
* forms
* navigation
