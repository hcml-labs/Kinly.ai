# FamilySync (Kinly.ai)

AI-powered family appointment and activities management system. One place for your family's school, health, and activity schedules.

## Features

- **Unified Family Calendar** - Single calendar for the entire family with views per child, parent, or whole family
- **AI-Powered Scheduling** - Create appointments via email parsing, photo upload, or natural language
- **Child Profiles** - Create profiles for each child with school, activities, and medical info
- **Smart Reminders** - Notifications 1 day before, 1 hour before, or travel-time based alerts
- **Shared Access** - Invite spouse, caregivers, or grandparents with role-based permissions
- **Conflict Detection** - Automatic detection of scheduling conflicts
- **Google Calendar Sync** - Two-way sync with Google Calendar
- **Weekly Insights** - AI-generated summaries and suggestions

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **Celery** - Background task processing
- **OpenAI GPT-4** - AI text parsing
- **Tesseract OCR** - Image text extraction

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Radix UI** - Accessible components
- **React Query** - Data fetching
- **React Router** - Navigation

## Project Structure

```
Kinly.ai/
├── app/                    # Backend
│   ├── api/v1/            # API routes
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── main.py            # FastAPI app
│   ├── config.py          # Configuration
│   └── database.py        # DB connection
├── frontend/              # React frontend
│   ├── src/
│   │   ├── api/          # API clients
│   │   ├── components/   # UI components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   └── pages/        # Page components
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt       # Python dependencies
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Backend Setup

1. Create virtual environment:
```bash
cd Kinly.ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend.

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/kinly
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token

### Family
- `POST /api/v1/family` - Create family
- `GET /api/v1/family` - List families
- `POST /api/v1/family/{id}/invite` - Invite member
- `DELETE /api/v1/family/{id}/members/{member_id}` - Remove member

### Children
- `GET /api/v1/children/{family_id}` - List children
- `POST /api/v1/children` - Add child
- `PUT /api/v1/children/{id}` - Update child
- `DELETE /api/v1/children/{id}` - Delete child

### Appointments
- `GET /api/v1/appointments/{family_id}` - List appointments
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/{id}` - Update appointment
- `DELETE /api/v1/appointments/{id}` - Delete appointment
- `POST /api/v1/appointments/{id}/notes` - Add note
- `POST /api/v1/appointments/{id}/documents` - Upload document
- `GET /api/v1/appointments/conflicts` - Check conflicts

### AI Processing
- `POST /api/v1/ai/parse-email` - Parse email for appointments
- `POST /api/v1/ai/parse-text` - Parse natural language
- `POST /api/v1/ai/parse-image` - OCR image for appointments
- `GET /api/v1/ai/weekly-summary/{family_id}` - Get weekly insights

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read

### Integrations
- `GET /api/v1/integrations` - List integrations
- `GET /api/v1/integrations/google/auth-url` - Get Google OAuth URL
- `POST /api/v1/integrations/google/sync` - Sync Google Calendar

## Appointment Categories

- **School** - PTA meetings, exams, events, report cards
- **Health** - Doctor visits, dentist, therapy, vaccinations
- **Activity** - Sports, music lessons, dance, recitals
- **Personal** - Birthdays, family events, reminders

## License

MIT License - see LICENSE file for details.
