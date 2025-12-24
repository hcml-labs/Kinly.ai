# Kinly.ai Database Documentation

## Database Configuration

**Database Type:** SQLite (Development) / PostgreSQL (Production)  
**Database Name:** `kinly.db` (SQLite) or `kinly` (PostgreSQL)  
**Default Username:** N/A for SQLite / `postgres` for PostgreSQL  
**Default Password:** N/A for SQLite / Set via environment variable `DATABASE_URL`

### Connection String
```
# SQLite (Development)
DATABASE_URL=sqlite:///./kinly.db

# PostgreSQL (Production)
DATABASE_URL=postgresql://username:password@localhost:5432/kinly
```

### Environment Variables
```bash
# .env file
DATABASE_URL=sqlite:///./kinly.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

---

## Database Schema

### 1. Users Table
Stores user account information.

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'parent', -- 'parent' or 'caregiver'
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email)
);
```

**Columns:**
- `user_id`: Unique identifier (UUID)
- `name`: User's full name
- `email`: Unique email address (used for login)
- `phone`: Optional phone number
- `role`: User role (parent, caregiver)
- `password_hash`: Hashed password (PBKDF2-SHA256)
- `created_at`: Account creation timestamp

**Sample Data:**
```sql
INSERT INTO users (user_id, name, email, phone, role, password_hash) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', '+1234567890', 'parent', 'hashed_password_here'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com', '+0987654321', 'parent', 'hashed_password_here');
```

---

### 2. Families Table
Stores family group information.

```sql
CREATE TABLE families (
    family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `family_id`: Unique identifier (UUID)
- `family_name`: Name of the family
- `description`: Optional description
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Sample Data:**
```sql
INSERT INTO families (family_id, family_name, description) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'The Smiths', 'Our lovely family'),
('660e8400-e29b-41d4-a716-446655440002', 'The Johnsons', 'Johnson family household');
```

---

### 3. Family Members Table
Links users to families (many-to-many relationship).

```sql
CREATE TABLE family_members (
    family_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'admin' or 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (family_id, user_id),
    FOREIGN KEY (family_id) REFERENCES families(family_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Columns:**
- `family_id`: Reference to families table
- `user_id`: Reference to users table
- `role`: Member role (admin, member)
- `joined_at`: When user joined the family

**Sample Data:**
```sql
INSERT INTO family_members (family_id, user_id, role) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'admin'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'member');
```

---

### 4. Children Table
Stores information about children in families.

```sql
CREATE TABLE children (
    child_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    grade VARCHAR(50),
    school VARCHAR(255),
    medical_info TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (family_id) REFERENCES families(family_id) ON DELETE CASCADE,
    INDEX idx_children_family (family_id)
);
```

**Columns:**
- `child_id`: Unique identifier (UUID)
- `family_id`: Reference to families table
- `name`: Child's name
- `date_of_birth`: Birth date
- `grade`: Current grade level
- `school`: School name
- `medical_info`: Medical information/allergies
- `notes`: Additional notes
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Sample Data:**
```sql
INSERT INTO children (child_id, family_id, name, date_of_birth, grade, school, medical_info, notes) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Emma Smith', '2015-05-15', '4th Grade', 'Lincoln Elementary', 'No allergies', 'Loves soccer'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Liam Smith', '2018-08-22', '1st Grade', 'Lincoln Elementary', 'Peanut allergy', 'Enjoys reading');
```

---

### 5. Appointments Table
Stores scheduled appointments and events.

```sql
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    child_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL, -- 'school', 'health', 'activity', 'personal'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    recurrence_rule VARCHAR(255), -- iCal RRULE format
    color VARCHAR(7), -- Hex color code
    created_by UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (family_id) REFERENCES families(family_id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_appointments_family (family_id),
    INDEX idx_appointments_child (child_id),
    INDEX idx_appointments_start_time (start_time),
    INDEX idx_appointments_category (category)
);
```

**Columns:**
- `appointment_id`: Unique identifier (UUID)
- `family_id`: Reference to families table
- `child_id`: Optional reference to children table
- `title`: Appointment title
- `description`: Detailed description
- `category`: Type (school, health, activity, personal)
- `start_time`: Start date/time
- `end_time`: End date/time
- `location`: Location/address
- `recurrence_rule`: Recurring pattern (iCal RRULE)
- `color`: Display color (hex code)
- `created_by`: User who created it
- `status`: Current status
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Sample Data:**
```sql
INSERT INTO appointments (appointment_id, family_id, child_id, title, description, category, start_time, end_time, location, created_by, status) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Soccer Practice', 'Weekly soccer practice', 'activity', '2024-01-15 16:00:00', '2024-01-15 17:30:00', 'Central Park', '550e8400-e29b-41d4-a716-446655440001', 'active'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Dentist Appointment', 'Regular checkup', 'health', '2024-01-20 14:00:00', '2024-01-20 15:00:00', 'Dr. Smith Dental', '550e8400-e29b-41d4-a716-446655440001', 'active');
```

---

### 6. Appointment Notes Table
Stores notes attached to appointments.

```sql
CREATE TABLE appointment_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL,
    note_text TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notes_appointment (appointment_id)
);
```

**Columns:**
- `note_id`: Unique identifier (UUID)
- `appointment_id`: Reference to appointments table
- `note_text`: Note content
- `created_by`: User who created the note
- `created_at`: Creation timestamp

---

### 7. Appointment Documents Table
Stores documents/files attached to appointments.

```sql
CREATE TABLE appointment_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_documents_appointment (appointment_id)
);
```

**Columns:**
- `document_id`: Unique identifier (UUID)
- `appointment_id`: Reference to appointments table
- `file_name`: Original filename
- `file_url`: Storage URL/path
- `file_type`: MIME type
- `file_size`: Size in bytes
- `uploaded_by`: User who uploaded
- `uploaded_at`: Upload timestamp

---

### 8. Notifications Table
Stores user notifications.

```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reminder', 'update', 'alert'
    related_id UUID, -- ID of related entity (appointment, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
);
```

**Columns:**
- `notification_id`: Unique identifier (UUID)
- `user_id`: Reference to users table
- `title`: Notification title
- `message`: Notification message
- `type`: Type (reminder, update, alert)
- `related_id`: Related entity ID
- `is_read`: Read status
- `created_at`: Creation timestamp

---

### 9. Integrations Table
Stores external service integrations.

```sql
CREATE TABLE integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google_calendar', 'apple_calendar', etc.
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    settings JSON,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_integrations_user (user_id),
    INDEX idx_integrations_provider (provider)
);
```

**Columns:**
- `integration_id`: Unique identifier (UUID)
- `user_id`: Reference to users table
- `provider`: Service provider name
- `access_token`: OAuth access token (encrypted)
- `refresh_token`: OAuth refresh token (encrypted)
- `token_expiry`: Token expiration time
- `settings`: JSON configuration
- `status`: Connection status
- `last_sync`: Last sync timestamp
- `created_at`: Creation timestamp

---

### 10. AI Parsed Inputs Table
Stores AI-parsed input data.

```sql
CREATE TABLE ai_parsed_inputs (
    parse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_id UUID NOT NULL,
    source_type VARCHAR(20) NOT NULL, -- 'email', 'image', 'text', 'voice'
    raw_input TEXT,
    file_url VARCHAR(500),
    parsed_json JSON, -- Parsed data in JSON format
    confidence_score DECIMAL(3, 2),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(family_id) ON DELETE CASCADE,
    INDEX idx_parsed_inputs_user (user_id),
    INDEX idx_parsed_inputs_family (family_id)
);
```

**Columns:**
- `parse_id`: Unique identifier (UUID)
- `user_id`: Reference to users table
- `family_id`: Reference to families table
- `source_type`: Input source type
- `raw_input`: Original input text
- `file_url`: URL if file-based input
- `parsed_json`: Extracted data (JSON)
- `confidence_score`: AI confidence (0.00-1.00)
- `processed`: Processing status
- `created_at`: Creation timestamp

---

## Database Initialization

### Using SQLite (Development)

```bash
# Initialize database
python init_db.py

# This creates all tables in kinly.db
```

### Using PostgreSQL (Production)

```bash
# Create database
createdb kinly

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/kinly"

# Run migrations
alembic upgrade head
```

---

## Common Queries

### Get all appointments for a family
```sql
SELECT a.*, c.name as child_name
FROM appointments a
LEFT JOIN children c ON a.child_id = c.child_id
WHERE a.family_id = 'family_uuid'
  AND a.status = 'active'
ORDER BY a.start_time ASC;
```

### Get upcoming appointments for this week
```sql
SELECT a.*, c.name as child_name
FROM appointments a
LEFT JOIN children c ON a.child_id = c.child_id
WHERE a.family_id = 'family_uuid'
  AND a.start_time >= CURRENT_DATE
  AND a.start_time < CURRENT_DATE + INTERVAL '7 days'
  AND a.status = 'active'
ORDER BY a.start_time ASC;
```

### Check for scheduling conflicts
```sql
SELECT *
FROM appointments
WHERE family_id = 'family_uuid'
  AND child_id = 'child_uuid'
  AND status = 'active'
  AND (
    (start_time <= 'new_start_time' AND end_time > 'new_start_time')
    OR (start_time < 'new_end_time' AND end_time >= 'new_end_time')
    OR (start_time >= 'new_start_time' AND end_time <= 'new_end_time')
  );
```

### Get unread notifications
```sql
SELECT *
FROM notifications
WHERE user_id = 'user_uuid'
  AND is_read = FALSE
ORDER BY created_at DESC;
```

---

## Backup and Restore

### SQLite Backup
```bash
# Backup
cp kinly.db kinly_backup_$(date +%Y%m%d).db

# Restore
cp kinly_backup_20240101.db kinly.db
```

### PostgreSQL Backup
```bash
# Backup
pg_dump kinly > kinly_backup_$(date +%Y%m%d).sql

# Restore
psql kinly < kinly_backup_20240101.sql
```

---

## Performance Indexes

The following indexes are created for optimal query performance:

- `idx_users_email` on users(email)
- `idx_children_family` on children(family_id)
- `idx_appointments_family` on appointments(family_id)
- `idx_appointments_child` on appointments(child_id)
- `idx_appointments_start_time` on appointments(start_time)
- `idx_appointments_category` on appointments(category)
- `idx_notes_appointment` on appointment_notes(appointment_id)
- `idx_documents_appointment` on appointment_documents(appointment_id)
- `idx_notifications_user` on notifications(user_id)
- `idx_notifications_read` on notifications(is_read)
- `idx_integrations_user` on integrations(user_id)
- `idx_integrations_provider` on integrations(provider)
- `idx_parsed_inputs_user` on ai_parsed_inputs(user_id)
- `idx_parsed_inputs_family` on ai_parsed_inputs(family_id)

---

## Security Considerations

1. **Password Storage**: Passwords are hashed using PBKDF2-SHA256 with salt
2. **Tokens**: OAuth tokens should be encrypted at rest
3. **Access Control**: All queries should verify user has access to family data
4. **SQL Injection**: Use parameterized queries (handled by SQLAlchemy ORM)
5. **Backup Encryption**: Encrypt database backups before storage
