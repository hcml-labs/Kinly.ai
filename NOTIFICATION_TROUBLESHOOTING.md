# Notification System Troubleshooting Guide

## Current Status

✅ **Notifications ARE being created in the database**

Test results show:
- **harshaxdragon@outlook.com**: 1 notification
- **ChaitanyaGuf150136@gmail.com**: 3 notifications (Family, Update, Test)

## Issue

Notifications exist in database but may not be showing in the UI.

## Steps to Verify & Fix

### 1. Check Browser Console

Open the Notifications page and check the browser console (F12) for:
- `Fetched notifications:` log - shows what data is returned
- Any error messages from the API call

### 2. Verify You're Logged In as the Correct User

The notifications are created for specific users. Make sure you're logged in as:
- **ChaitanyaGuf150136@gmail.com** (has 3 notifications)
- OR **harshaxdragon@outlook.com** (has 1 notification)

### 3. Check the "All Notifications" Tab

The notifications page has two tabs:
1. **All Notifications** - Shows system notifications
2. **Upcoming Appointments** - Shows this week's appointments

Make sure you're on the "All Notifications" tab to see the notifications.

### 4. Try "All" Filter Instead of "Unread"

The page has two filters:
- **All** - Shows all notifications
- **Unread** - Shows only unread notifications

Click "All" to see all notifications.

### 5. Manual Database Check

Run this command to see all notifications:

```bash
python -c "from app.database import SessionLocal; from app.models.notification import Notification; db = SessionLocal(); notifications = db.query(Notification).all(); [print(f'{n.notification_type}: {n.title} (User: {n.user_id}, Read: {n.read})') for n in notifications]"
```

### 6. Test API Endpoint Directly

Get your auth token from localStorage in browser console:
```javascript
localStorage.getItem('token')
```

Then test the API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/notifications
```

## How to Create Test Notifications

### Method 1: Run Test Script

```bash
python test_notifications.py
```

This creates a test notification for each user.

### Method 2: Create Appointment (Triggers Reminders)

1. Log in to the app
2. Create an appointment 2+ hours in the future
3. Check database - should see 2 reminder notifications created:
   ```bash
   python -c "from app.database import SessionLocal; from app.models.notification import Notification; db = SessionLocal(); reminders = db.query(Notification).filter(Notification.notification_type == 'reminder').all(); print(f'Found {len(reminders)} reminders'); [print(f'  {r.title} - notify at: {r.notify_at}') for r in reminders]"
   ```

### Method 3: Update Appointment (Triggers Update Notification)

1. Create an appointment
2. Edit it (change time or title)
3. Check Notifications page - should see "Appointment Updated" notification immediately

### Method 4: Create Conflict (Triggers Conflict Notification)

1. Create appointment: "Meeting" from 2:00 PM - 3:00 PM
2. Create another: "Doctor" from 2:30 PM - 3:30 PM
3. Check Notifications page - should see "Schedule Conflict Detected"

### Method 5: Invite Family Member (Triggers Family Notification)

1. Go to Family page
2. Invite a new member (they must be registered first)
3. Check Notifications page - should see "New Family Member"

## Common Issues & Solutions

### Issue: "No notifications" message

**Possible Causes:**
1. Logged in as wrong user
2. Notifications filtered by "Unread" but all are read
3. API authentication issue

**Solutions:**
- Switch to "All" filter
- Check browser console for errors
- Verify you're logged in
- Check database to confirm notifications exist for your user

### Issue: Notifications in database but not in UI

**Possible Causes:**
1. Frontend not fetching properly
2. CORS issue
3. Token expired

**Solutions:**
- Check browser console for API errors
- Refresh the page
- Log out and log back in
- Check Network tab in DevTools for failed requests

### Issue: Reminders not showing at scheduled time

**Explanation:**
Reminders are scheduled for future times (24h and 1h before appointment). They won't show immediately.

**To see them:**
- Create appointment 2+ hours in future
- Check database to confirm they're created
- Wait for scheduled time OR manually update `notify_at` in database to past time

## Notification Types & When They Trigger

| Type | Trigger | Who Gets Notified | When |
|------|---------|-------------------|------|
| **reminder** | Appointment created | All family members | 24h & 1h before appointment |
| **update** | Appointment edited | All family members (except editor) | Immediately |
| **conflict** | Overlapping appointments | User who created/edited | Immediately |
| **missed** | Appointment time passed | All family members | Within 15 min after end time |
| **family** | New member added | All existing members (except inviter) | Immediately |

## Quick Verification Commands

### See all notifications:
```bash
python -c "from app.database import SessionLocal; from app.models.notification import Notification; db = SessionLocal(); notifs = db.query(Notification).all(); print(f'Total: {len(notifs)}'); [print(f'{n.notification_type}: {n.title}') for n in notifs]"
```

### See notifications for specific user:
```bash
python -c "from app.database import SessionLocal; from app.models.notification import Notification; from app.models.user import User; db = SessionLocal(); user = db.query(User).filter(User.email == 'YOUR_EMAIL').first(); notifs = db.query(Notification).filter(Notification.user_id == user.user_id).all(); print(f'{user.email} has {len(notifs)} notifications'); [print(f'  {n.notification_type}: {n.title} (Read: {n.read})') for n in notifs]"
```

### Clear all test notifications:
```bash
python -c "from app.database import SessionLocal; from app.models.notification import Notification; db = SessionLocal(); db.query(Notification).filter(Notification.title == 'Test Notification').delete(); db.commit(); print('Test notifications cleared')"
```

## Expected Behavior

### When Creating Appointment

1. **Immediate:** Appointment saved to database
2. **Immediate:** 2 reminder notifications created (24h & 1h before)
3. **Immediate:** If conflicts exist, conflict notification created
4. **At scheduled time:** Background job sends reminders

### When Updating Appointment

1. **Immediate:** Appointment updated in database
2. **Immediate:** Update notification created for all family members
3. **Immediate:** If new conflicts exist, conflict notification created

### When Inviting Family Member

1. **Immediate:** Member added to family
2. **Immediate:** Family notification created for all existing members

## Next Steps

1. **Open the app** and go to Notifications page
2. **Check browser console** (F12) for any errors or the "Fetched notifications:" log
3. **Verify you're on "All Notifications" tab** (not "Upcoming Appointments")
4. **Click "All" filter** (not "Unread")
5. **If still no notifications**, check which user you're logged in as
6. **Run the test script** to create fresh test notifications: `python test_notifications.py`

## Contact Points

If notifications still don't show:
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify backend is running (http://localhost:8000/docs)
4. Check database directly with commands above
