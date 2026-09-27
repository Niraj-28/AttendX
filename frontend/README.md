# AttendX Frontend

React-based frontend for AttendX automated attendance system.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

## Project Structure
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── context/         # React context (Auth, etc.)
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json
```

## Features

### Faculty Dashboard
- Login/Authentication
- Start/Stop attendance sessions
- View live attendance
- Student management (add, edit, delete)
- Upload student photos
- Generate attendance reports
- Export data (CSV/PDF)

### Student Portal
- Login with student credentials
- View personal attendance only
- No modification access

## Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **State Management**: React Context + React Query
- **Styling**: Emotion (CSS-in-JS)

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
