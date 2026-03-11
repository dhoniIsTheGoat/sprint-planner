# Sprint Planner

A lightweight sprint planning tool for engineering teams. Plan capacity, track allocations per product, import from spreadsheets, and compare planned vs actual hours.

## Features
- Assign hours per resource per product each sprint
- Capacity utilization tracking with over-allocation warnings
- Import from `.xlsx` (Prep tabs → Plan, Planned tabs → Actuals)
- Planned vs Actual comparison with variance
- Print-ready summary view
- Persistent via localStorage

## Getting Started

npm install
npm run dev

Open http://localhost:5173

## Build for Production

npm run build
npm run preview

## Spreadsheet Import
Download your Google Sheet as `.xlsx` (File → Download → Microsoft Excel), then use the Import button in the app header.
- Tabs prefixed `Prep` → imported as planned hours
- Tabs prefixed `Planned` → imported as actuals