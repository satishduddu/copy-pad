# Pastebin-Lite

A production-ready, feature-complete Pastebin application built with React, Vite, and Supabase. Share text snippets with optional expiration constraints based on time and view count.

## Features

- Create text pastes with shareable URLs
- Optional TTL (time-to-live) expiration in seconds
- Optional max view count with atomic decrement
- Paste expires when either constraint triggers
- Deterministic time handling for automated testing
- Persistent storage using Supabase PostgreSQL
- Clean, responsive UI with real-time feedback

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Architecture

### Frontend (`/src`)
- `App.tsx` - Main application with client-side routing
- `components/CreatePaste.tsx` - Paste creation UI
- `components/ViewPaste.tsx` - Paste viewing UI with expiration info

### Backend (Supabase Edge Functions)
- `healthz` - Health check endpoint
- `create-paste` - Creates new pastes with validation
- `fetch-paste` - Retrieves pastes with atomic view decrement

### Database
- `pastes` table stores all paste data
- Atomic view decrement using PostgreSQL function
- Row Level Security (RLS) enabled for public access

## API Endpoints

### Health Check
```
GET /api/healthz
Response: { "ok": true }
```

### Create Paste
```
POST /api/pastes
Body: {
  "content": "string",
  "ttl_seconds": 60,      // optional, integer >= 1
  "max_views": 5          // optional, integer >= 1
}
Response: {
  "id": "abc123",
  "url": "https://domain.com/p/abc123"
}
```

### Fetch Paste
```
GET /api/pastes/:id
Response: {
  "content": "string",
  "remaining_views": 4,                  // null if unlimited
  "expires_at": "2026-01-01T00:00:00Z"  // null if no TTL
}
```

### View Paste (HTML)
```
GET /p/:id
Returns: HTML page rendering the paste content
```

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <repo-url>
cd pastebin-lite
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
The `.env` file contains Supabase configuration:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run typecheck
```

## Test Mode

For automated testing, set the environment variable:
```
TEST_MODE=1
```

When enabled, the API will respect the `x-test-now-ms` header for deterministic time handling:
```
x-test-now-ms: 1234567890000
```

This allows testing TTL expiration without waiting for real time to pass.

## Persistence Layer

This application uses **Supabase PostgreSQL** for persistence:

- **Pastes Table**: Stores all paste data with constraints
- **Atomic Operations**: View count decrements are atomic using PostgreSQL functions
- **RLS Policies**: Public read/write access for pastes
- **Indexes**: Optimized for expiration queries

### Database Schema

```sql
CREATE TABLE pastes (
  id text PRIMARY KEY,
  content text NOT NULL,
  ttl_seconds integer CHECK (ttl_seconds IS NULL OR ttl_seconds >= 1),
  max_views integer CHECK (max_views IS NULL OR max_views >= 1),
  remaining_views integer CHECK (remaining_views IS NULL OR remaining_views >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
```

### Atomic View Decrement

The `decrement_paste_views()` PostgreSQL function ensures thread-safe view counting:
- Never decrements below 0
- Only decrements if remaining_views > 0
- Returns new remaining_views value
- Handles concurrent access safely

## Robustness Features

- No negative view counts (enforced at database level)
- Atomic decrement operations prevent race conditions
- Expired/exhausted pastes return 404
- Input validation on all API endpoints
- Safe HTML rendering (XSS prevention)
- Proper error handling and user feedback

## Deployment

This application is designed to be deployed on platforms that support:
- Serverless functions (Supabase Edge Functions)
- Static site hosting (Vercel, Netlify, etc.)
- PostgreSQL database (Supabase)

The application automatically uses the correct API URLs based on the deployment environment.

## Project Structure

```
pastebin-lite/
├── src/
│   ├── components/
│   │   ├── CreatePaste.tsx
│   │   └── ViewPaste.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── functions/
│       ├── healthz/
│       ├── create-paste/
│       └── fetch-paste/
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## License

MIT
