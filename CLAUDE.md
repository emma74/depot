# CLAUDE.md

## Project Overview
Full-stack application with React frontend (Vite) and Node.js backend deployed on AWS ECS.

---

## Tech Stack

### Frontend
- React (Vite)
- JavaScript
- Plain CSS (no Tailwind)

### Backend
- Node.js (Express)
- Prisma ORM
- PostgreSQL

### Infrastructure
- Docker
- AWS ECS, ALB
- Cloudformation

---

## Frontend Rules

- Use functional components with hooks
- Keep components small and reusable
- Separate UI and business logic

### Styling
- Use plain CSS or CSS modules
- Do not use Tailwind
- Keep styles organized per component or page
- Ensure responsive design using media queries

---

## State Management

- Use React hooks (useState, useEffect)
- Avoid unnecessary global state
- Use Context API only when needed

---

## API Integration Rules

- All API calls must go through a service layer
- Do not call APIs directly inside components
- Handle loading and error states properly
- Use environment variables for API base URL

---

## Backend Rules

- Use async/await
- Validate all request inputs
- Follow REST conventions
- Use Prisma for database access

---

## Infrastructure Rules

- All infrastructure must be defined in Cloudformation
- ECS services must include health checks
- Logs must go to CloudWatch
- Use IAM roles (no hardcoded credentials)

---

## Deployment Rules

- Frontend must build successfully before deployment
- Backend must pass health checks
- Container ports must match configuration
- Ensure services stabilize after deployment

---

## Do

- Write clean, modular code
- Keep frontend and backend concerns separate
- Use environment variables

---

## Don’t

- Do not use Tailwind
- Do not hardcode API URLs
- Do not mix UI logic with API calls
- Do not bypass Cloudformation