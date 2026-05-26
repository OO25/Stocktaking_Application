# Stocktaking Application

A multi-outlet stocktake and financial tracking system for food service operations. Replaces an Excel-based workflow with a modern web application.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech))

## Project Structure

```
├── client/          # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── api/         # API client functions
│       ├── components/  # Reusable UI components
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Page-level components
│       └── utils/       # Shared utilities
├── server/          # Express backend
│   └── src/
│       ├── config/      # Database and app configuration
│       ├── controllers/ # Route handlers
│       ├── middleware/   # Express middleware
│       ├── models/      # Database queries and models
│       ├── routes/      # API route definitions
│       └── utils/       # Shared utilities
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL instance)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/OO25/Stocktaking_Application.git
   cd Stocktaking_Application
   ```

2. Copy the environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations:
   ```bash
   npm run migrate --workspace=server
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

   This runs both the Express API (port 3000) and Vite dev server (port 5173) concurrently.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run dev:server` | Start only the Express server |
| `npm run build` | Build the client for production |
| `npm run start` | Start the production server |