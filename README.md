# Smart Health Reminder

A monorepo for the Smart Health Reminder system, designed to support medication reminders, hydration tracking, refill alerts, and caregiver visibility.

## Monorepo Structure
- `apps/frontend`: React Native / Expo mobile app
- `apps/backend`: backend domain, persistence, and Phase-1 implementation work
- `agents`: project agents that drive architecture and development workflow
- `specs`: approved specifications and implementation plans

## Core Goals
- Improve medication adherence
- Encourage regular hydration
- Reduce missed doses with fallback reminders
- Provide caregiver visibility for safety

## Current Status
The repo is organized for spec-driven development. Phase-1 work is currently focused on backend domain modeling, validation, persistence contracts, and path isolation foundations.

## Workspace Commands
```bash
npm run frontend:start
npm run frontend:typecheck
npm run backend:typecheck
npm run backend:test:domain
npm run backend:test:persistence
```

## Safety Notice
This app is an assistive reminder system, not a medical authority. Users should always consult healthcare professionals for medical decisions.
