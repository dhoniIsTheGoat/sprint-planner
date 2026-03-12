# Sprint Planner — Project Memory

## Stack
- React 18 + Vite (JavaScript, no TypeScript)
- localStorage for persistence (key: `sprint_planner_v4`)
- Routing: react-router-dom (BrowserRouter in main.jsx)
- Monday.com API via raw fetch (monday-sdk-js installed but not used)
- Styling: inline styles throughout (no CSS framework)

## Key Files
- `src/App.jsx` — root router + SprintPlanner (renamed from App)
- `src/main.jsx` — BrowserRouter wraps App
- `src/api/monday.js` — Monday.com GraphQL client
- `src/pages/BoardMapping.jsx` — `/board-mapping` route
- `src/pages/TimeLog.jsx` — `/time-log` route
- `src/components/NavBar.jsx` — sticky top nav
- `src/hooks/useTimeData.js` — fetches + aggregates time tracking data

## localStorage Keys
- `sprint_planner_v4` — main app data (resources, products, sprints)
- `mondayBoardProductMap` — `{ [boardId]: { boardName, productName } }`
- `mondayUsersCache` — `{ users, cachedAt }` — 10 min TTL

## Routes
- `/` → SprintPlanner (existing app)
- `/board-mapping` → Board ↔ Product mapping
- `/time-log` → Hours logged page

## Monday.com API
- Token via `VITE_MONDAY_API_TOKEN` in `.env` (already gitignored)
- GraphQL endpoint: `https://api.monday.com/v2`
- API-Version header: `2024-10`
- fetchBoards, fetchBoardColumns, fetchBoardTimeData, fetchNextPage, fetchUsers in monday.js

## Colors / Style Conventions
- Primary: #6366f1 (indigo)
- Background: #f8fafc
- Dark header: #1e293b / #0f172a
- Table header bg: #f1f5f9
- Success: #10b981, Warning: #f59e0b, Error: #ef4444
