# Flex Living – Reviews Dashboard

## Developer Assessment Documentation

A full-stack **Reviews Management Dashboard** built for **Flex Living**, enabling property managers to monitor, analyze, and curate guest reviews across multiple properties.

The system integrates mocked **Hostaway** review data, supports managerial approval workflows, and ensures only approved reviews are displayed on public-facing pages.

The solution is designed with a **product-owner mindset**, focusing on usability, scalability, and real-world operational workflows.

---

## Introduction

The Flex Living Reviews Dashboard helps property managers:

- Assess property performance
- Identify trends and recurring issues
- Control which guest reviews appear publicly

In addition to Hostaway integration, the project explores the feasibility of integrating **Google Reviews** using the **Google Places API**.

---

## Tech Stack

### Frontend
- React (Vite)
- React Router DOM
- JavaScript (ES6+)
- Custom Vanilla CSS
- Dark / Light Theme Toggle

### Backend
- Node.js
- Express.js
- CORS
- In-memory data store using mocked JSON

### External APIs (Mocked / Explored)
- Hostaway Reviews API (sandboxed, mocked)
- Google Places API (feasibility explored)

---

## Key Design and Logic Decisions

### Review Normalization

Hostaway API responses are normalized into a consistent internal data structure before being consumed by the frontend.

Each review is normalized into:
- id
- listing
- guestName
- comment
- overallRating (average of category ratings)
- categories (key-value map)
- submittedAt (ISO format)
- channel (hostaway / google)
- approved (boolean)

**Why this matters**

External APIs often return complex or inconsistent data. Normalization ensures predictable rendering, simpler analytics, and easy future integrations.

---

### Approval Workflow

- Managers can approve or unapprove reviews from the dashboard
- Only approved reviews are displayed on:
  - Public Reviews page
  - Individual Property pages
- Approval changes reflect instantly without resetting filters or pagination

This mirrors real-world moderation workflows.

---

### Manager Dashboard

**Features**
- Filters by approval status, rating, property, and date range
- Sorting by date, rating, and guest name
- Pagination with smooth scrolling
- Analytics overview:
  - Total reviews
  - Approved vs pending
  - Average rating
  - Reviews per property
  - Monthly trends
  - Category averages

---

### Public Review Display

- Dedicated public pages for approved reviews
- Reviews grouped by property
- Only manager-approved reviews are visible
- Layout consistent with Flex Living property pages

---

## API Behaviors

### GET /api/reviews/hostaway
Returns all normalized Hostaway reviews with filtering and sorting support.

### PATCH /api/reviews/:id/approve
Toggles the approval status of a review and returns the updated review.

### GET /api/reviews/public/:listing
Returns approved reviews only for a specific property.

### GET /api/reviews/analytics
Returns dashboard analytics including totals, trends, and averages.

---

## Google Reviews – Feasibility Findings

### Feasibility
Technically feasible using Google Places API.

### Requirements
- Google Cloud Platform account
- Places API enabled
- Billing-enabled API key
- Google Place IDs

### Limitations
- Max 5 reviews per request
- No date-based filtering
- Cannot respond to reviews
- Approx. $0.032 per request

### Recommended Approach
- Fetch via scheduled cron job
- Normalize to Hostaway schema
- Store with channel: google
- Apply approval workflow

---

## Running Locally

### Prerequisites
- Node.js v18+
- npm

### Project Structure
frontend / backend folders

### Backend
cd backend  
npm install  
npm run dev  

Runs on http://localhost:3001

### Frontend
cd frontend  
npm install  
npm run dev  

Runs on http://localhost:5173

---



## Conclusion

This project satisfies all Flex Living Developer Assessment requirements and demonstrates clean architecture, strong UX decisions, and product-driven thinking.

---

## Author
**Penagonda Akash**  
Flex Living – Developer Assessment
