# FamilySync Frontend

React frontend for the FamilySync family scheduling application.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **React Router v6** for navigation
- **React Query** for server state management
- **Axios** for API requests
- **Lucide** for icons

## Project Structure

```
src/
├── api/              # API client modules
│   ├── client.ts     # Axios instance with auth
│   ├── auth.ts       # Authentication API
│   ├── family.ts     # Family management API
│   ├── children.ts   # Children API
│   ├── appointments.ts # Appointments API
│   ├── ai.ts         # AI parsing API
│   ├── notifications.ts # Notifications API
│   └── integrations.ts # External integrations API
├── components/       # Reusable components
│   ├── ui/          # Base UI components
│   ├── Layout.tsx   # Main app layout
│   └── ProtectedRoute.tsx # Auth guard
├── context/         # React context providers
│   └── AuthContext.tsx # Authentication state
├── hooks/           # Custom React hooks
│   └── use-toast.ts # Toast notifications
├── lib/             # Utility functions
│   └── utils.ts     # Helpers
├── pages/           # Page components
│   ├── Index.tsx    # Landing page
│   ├── Login.tsx    # Login page
│   ├── Register.tsx # Registration page
│   ├── Dashboard.tsx # Main dashboard
│   ├── Calendar.tsx # Calendar view
│   ├── Appointments.tsx # Appointments list
│   ├── Children.tsx # Children management
│   ├── Family.tsx   # Family management
│   ├── AIAssistant.tsx # AI input page
│   ├── Notifications.tsx # Notifications
│   ├── Integrations.tsx # External integrations
│   └── Settings.tsx # User settings
├── App.tsx          # Main app with routes
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:8000
```

## Features

### Authentication
- JWT-based authentication
- Persistent login with localStorage
- Protected routes with redirect

### Dashboard
- Overview of upcoming appointments
- Weekly statistics
- Children quick view
- AI-generated insights

### Calendar
- Monthly calendar view
- Filter by child
- Today's schedule
- Color-coded categories

### Appointments
- Create, edit, delete appointments
- Filter by category and child
- Add notes and documents
- Conflict detection

### AI Assistant
- Parse natural language text
- Parse emails from schools/clinics
- OCR for flyers and notices
- Auto-create appointments

### Family Management
- Create family groups
- Invite members with roles
- Manage permissions

### Integrations
- Google Calendar sync
- Two-way synchronization
