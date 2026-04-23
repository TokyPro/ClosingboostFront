# SalesBoost AI - Frontend Quickstart

This guide will help you get the SalesBoost AI frontend up and running.

## Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **SalesBoost AI Backend** (Should be running)

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Views
- **Dashboard:** [/dashboard](/dashboard) - Pipeline and metrics.
- **Copilot:** [/copilot](/copilot) - Live call assistance.
- **Briefing:** [/opportunities/1/briefing](/opportunities/1/briefing) - Strategic analysis.
- **Admin:** [/admin](/admin) - System and knowledge management.

## Design Standards
This frontend implements the **Kinetic Obsidian "Digital Executive"** design system:
- **No-Line Rule:** Hierarchy defined by background shifts, not borders.
- **Typography:** Manrope for impact, Inter for utility.
- **Editorial Tone:** Asymmetric layouts and high-contrast precision.
