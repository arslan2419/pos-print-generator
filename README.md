# Fuel Pump Receipt Generator

Client-side web app for fuel station owners to fill in transaction details and download a **POS-sized thermal receipt PDF** (80mm wide).

## Stack

- React 18 + Vite
- Tailwind CSS
- jsPDF
- Lucide React icons

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Features

- Card-based form with validation
- Auto-generated invoice number, date, and time on load
- Real-time total: fuel rate × volume
- Optional logo upload (PNG, JPG, SVG up to 2MB)
- 80mm POS receipt PDF with Courier monospace font
