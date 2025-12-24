# Kinly.ai API Documentation

**Base URL:** `http://localhost:8000/api/v1`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication APIs

### 1.1 Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword123",
  "role": "parent"
}
```

**Response (201):**
```json
{
  "user_id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "parent",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 1.2 Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "parent"
  }
}
```

---

### 1.3 Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### 1.4 Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

## 2. Family APIs

### 2.1 Create Family
**POST** `/family`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "family_name": "The Smiths",
  "description": "Our lovely family"
}
```

**Response (201):**
```json
{
  "family_id": "uuid",
  "family_name": "The Smiths",
  "description": "Our lovely family",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.2 Get Family Details
**GET** `/family/{family_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "family_id": "uuid",
  "family_name": "The Smiths",
  "description": "Our lovely family",
  "created_at": "2024-01-01T00:00:00Z",
  "members": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "parent",
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2.3 Update Family
**PUT** `/family/{family_id}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "family_name": "The Smith Family",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "family_id": "uuid",
  "family_name": "The Smith Family",
  "description": "Updated description",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.4 Add Family Member
**POST** `/family/{family_id}/members`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "role": "parent"
}
```

**Response (200):**
```json
{
  "message": "Member added successfully",
  "member": {
    "user_id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "parent"
  }
}
```

---

## 3. Children APIs

### 3.1 Create Child
**POST** `/children`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "family_id": "uuid",
  "name": "Emma Smith",
  "date_of_birth": "2015-05-15",
  "grade": "4th Grade",
  "school": "Lincoln Elementary",
  "medical_info": "No allergies",
  "notes": "Loves soccer"
}
```

**Response (201):**
```json
{
  "child_id": "uuid",
  "family_id": "uuid",
  "name": "Emma Smith",
  "date_of_birth": "2015-05-15",
  "grade": "4th Grade",
  "school": "Lincoln Elementary",
  "medical_info": "No allergies",
  "notes": "Loves soccer",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.2 Get All Children
**GET** `/children?family_id={family_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "child_id": "uuid",
    "family_id": "uuid",
    "name": "Emma Smith",
    "date_of_birth": "2015-05-15",
    "grade": "4th Grade",
    "school": "Lincoln Elementary",
    "medical_info": "No allergies",
    "notes": "Loves soccer",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 3.3 Get Child by ID
**GET** `/children/{child_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "child_id": "uuid",
  "family_id": "uuid",
  "name": "Emma Smith",
  "date_of_birth": "2015-05-15",
  "grade": "4th Grade",
  "school": "Lincoln Elementary",
  "medical_info": "No allergies",
  "notes": "Loves soccer",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.4 Update Child
**PUT** `/children/{child_id}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Emma Smith",
  "grade": "5th Grade",
  "notes": "Loves soccer and piano"
}
```

**Response (200):**
```json
{
  "child_id": "uuid",
  "family_id": "uuid",
  "name": "Emma Smith",
  "date_of_birth": "2015-05-15",
  "grade": "5th Grade",
  "school": "Lincoln Elementary",
  "medical_info": "No allergies",
  "notes": "Loves soccer and piano",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.5 Delete Child
**DELETE** `/children/{child_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Child deleted successfully"
}
```

---

## 4. Appointments APIs

### 4.1 Create Appointment
**POST** `/appointments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "family_id": "uuid",
  "child_id": "uuid",
  "title": "Soccer Practice",
  "description": "Weekly soccer practice at the park",
  "category": "activity",
  "start_time": "2024-01-15T16:00:00Z",
  "end_time": "2024-01-15T17:30:00Z",
  "location": "Central Park",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE",
  "color": "#10B981"
}
```

**Response (201):**
```json
{
  "appointment_id": "uuid",
  "family_id": "uuid",
  "child_id": "uuid",
  "title": "Soccer Practice",
  "description": "Weekly soccer practice at the park",
  "category": "activity",
  "start_time": "2024-01-15T16:00:00Z",
  "end_time": "2024-01-15T17:30:00Z",
  "location": "Central Park",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE",
  "color": "#10B981",
  "status": "active",
  "created_by": "uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 4.2 Get All Appointments
**GET** `/appointments?family_id={family_id}&child_id={child_id}&category={category}&start_date={start_date}&end_date={end_date}&status={status}`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `family_id` (required): Family UUID
- `child_id` (optional): Filter by child
- `category` (optional): school, health, activity, personal
- `start_date` (optional): ISO date string
- `end_date` (optional): ISO date string
- `status` (optional): active, cancelled, completed

**Response (200):**
```json
[
  {
    "appointment_id": "uuid",
    "family_id": "uuid",
    "child_id": "uuid",
    "child_name": "Emma Smith",
    "title": "Soccer Practice",
    "description": "Weekly soccer practice at the park",
    "category": "activity",
    "start_time": "2024-01-15T16:00:00Z",
    "end_time": "2024-01-15T17:30:00Z",
    "location": "Central Park",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 4.3 Get Appointment by ID
**GET** `/appointments/{appointment_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "appointment_id": "uuid",
  "family_id": "uuid",
  "child_id": "uuid",
  "child_name": "Emma Smith",
  "title": "Soccer Practice",
  "description": "Weekly soccer practice at the park",
  "category": "activity",
  "start_time": "2024-01-15T16:00:00Z",
  "end_time": "2024-01-15T17:30:00Z",
  "location": "Central Park",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE",
  "color": "#10B981",
  "status": "active",
  "created_by": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "notes": [],
  "documents": []
}
```

---

### 4.4 Update Appointment
**PUT** `/appointments/{appointment_id}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Soccer Practice - Updated",
  "start_time": "2024-01-15T17:00:00Z",
  "end_time": "2024-01-15T18:30:00Z"
}
```

**Response (200):**
```json
{
  "appointment_id": "uuid",
  "title": "Soccer Practice - Updated",
  "start_time": "2024-01-15T17:00:00Z",
  "end_time": "2024-01-15T18:30:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 4.5 Delete Appointment
**DELETE** `/appointments/{appointment_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Appointment deleted successfully"
}
```

---

### 4.6 Check Scheduling Conflicts
**POST** `/appointments/check-conflicts?family_id={family_id}&start_time={start_time}&end_time={end_time}&child_id={child_id}&exclude_appointment_id={appointment_id}`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `family_id` (required): Family UUID
- `start_time` (required): ISO datetime string
- `end_time` (required): ISO datetime string
- `child_id` (optional): Child UUID
- `exclude_appointment_id` (optional): Appointment UUID to exclude (for editing)

**Response (200):**
```json
{
  "has_conflict": true,
  "conflicts": [
    {
      "appointment_id": "uuid",
      "title": "Piano Lesson",
      "start_time": "2024-01-15T16:30:00Z",
      "end_time": "2024-01-15T17:30:00Z"
    }
  ],
  "message": "Scheduling conflict detected"
}
```

---

### 4.7 Add Note to Appointment
**POST** `/appointments/{appointment_id}/notes`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "note_text": "Remember to bring water bottle"
}
```

**Response (201):**
```json
{
  "note_id": "uuid",
  "appointment_id": "uuid",
  "note_text": "Remember to bring water bottle",
  "created_by": "uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 4.8 Upload Document to Appointment
**POST** `/appointments/{appointment_id}/documents`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `file`: File to upload

**Response (201):**
```json
{
  "document_id": "uuid",
  "appointment_id": "uuid",
  "file_name": "permission_slip.pdf",
  "file_url": "https://storage.example.com/documents/uuid.pdf",
  "file_type": "application/pdf",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

---

## 5. AI Processing APIs

### 5.1 Parse Email
**POST** `/ai/parse-email`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "family_id": "uuid",
  "email_content": "Subject: Soccer Practice\n\nDear Parents,\n\nSoccer practice will be held on Monday, January 15th at 4:00 PM at Central Park.\n\nCoach Smith"
}
```

**Response (200):**
```json
{
  "parse_id": "uuid",
  "parsed_data": {
    "title": "Soccer Practice",
    "category": "activity",
    "start_time": "2024-01-15T16:00:00Z",
    "location": "Central Park"
  },
  "confidence_score": 0.95,
  "suggestions": [
    {
      "field": "end_time",
      "value": "2024-01-15T17:30:00Z",
      "confidence": 0.75
    }
  ]
}
```

---

### 5.2 Parse Image (OCR)
**POST** `/ai/parse-image`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `family_id`: UUID
- `image`: Image file

**Response (200):**
```json
{
  "parse_id": "uuid",
  "extracted_text": "Parent-Teacher Conference\nDate: January 20, 2024\nTime: 3:00 PM\nRoom 205",
  "parsed_data": {
    "title": "Parent-Teacher Conference",
    "category": "school",
    "start_time": "2024-01-20T15:00:00Z",
    "location": "Room 205"
  },
  "confidence_score": 0.88
}
```

---

### 5.3 Parse Voice/Text
**POST** `/ai/parse-text`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "family_id": "uuid",
  "text_input": "Schedule dentist appointment for Emma next Tuesday at 2pm"
}
```

**Response (200):**
```json
{
  "parse_id": "uuid",
  "parsed_data": {
    "title": "Dentist Appointment",
    "category": "health",
    "child_name": "Emma",
    "start_time": "2024-01-16T14:00:00Z",
    "end_time": "2024-01-16T15:00:00Z"
  },
  "confidence_score": 0.92
}
```

---

## 6. Notifications APIs

### 6.1 Get All Notifications
**GET** `/notifications?user_id={user_id}&is_read={is_read}`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id` (required): User UUID
- `is_read` (optional): true/false

**Response (200):**
```json
[
  {
    "notification_id": "uuid",
    "user_id": "uuid",
    "title": "Upcoming Appointment",
    "message": "Soccer Practice starts in 1 hour",
    "type": "reminder",
    "related_id": "appointment_uuid",
    "is_read": false,
    "created_at": "2024-01-15T15:00:00Z"
  }
]
```

---

### 6.2 Mark Notification as Read
**PUT** `/notifications/{notification_id}/read`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "notification_id": "uuid",
  "is_read": true,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 6.3 Delete Notification
**DELETE** `/notifications/{notification_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## 7. Integrations APIs

### 7.1 Connect Google Calendar
**POST** `/integrations/google-calendar/connect`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "user_id": "uuid",
  "auth_code": "google_oauth_code"
}
```

**Response (200):**
```json
{
  "integration_id": "uuid",
  "provider": "google_calendar",
  "status": "connected",
  "connected_at": "2024-01-01T00:00:00Z"
}
```

---

### 7.2 Sync Calendar
**POST** `/integrations/{integration_id}/sync`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Sync completed successfully",
  "synced_events": 15,
  "last_sync": "2024-01-01T00:00:00Z"
}
```

---

### 7.3 Disconnect Integration
**DELETE** `/integrations/{integration_id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Integration disconnected successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "detail": "Invalid request data"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden:**
```json
{
  "detail": "Not authorized to access this resource"
}
```

**404 Not Found:**
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```

---

## Testing with Postman

1. Import this documentation as a Postman collection
2. Set up environment variables:
   - `base_url`: http://localhost:8000/api/v1
   - `access_token`: Your JWT token from login
3. First, register a user and login to get the access token
4. Use the access token in the Authorization header for protected endpoints
5. Create a family and children before creating appointments

---

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user

## Pagination

List endpoints support pagination:
- `?page=1&limit=20` (default: page=1, limit=50, max=100)
