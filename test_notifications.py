"""
Script to test notification creation and verify they're working
"""
from app.database import SessionLocal
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.family import FamilyMember
from app.models.appointment import Appointment
from datetime import datetime, timedelta
import uuid

def test_notifications():
    db = SessionLocal()
    
    print("=== Notification System Test ===\n")
    
    # Get all users
    users = db.query(User).all()
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"  - {user.email} (ID: {user.user_id})")
    
    # Get all notifications
    notifications = db.query(Notification).all()
    print(f"\nTotal notifications: {len(notifications)}")
    for notif in notifications:
        user = db.query(User).filter(User.user_id == notif.user_id).first()
        print(f"  - {notif.notification_type}: {notif.title}")
        print(f"    User: {user.email if user else 'Unknown'}")
        print(f"    Notify at: {notif.notify_at}")
        print(f"    Read: {notif.read}, Sent: {notif.sent}")
        print()
    
    # Create a test notification for each user
    print("\n=== Creating Test Notifications ===")
    for user in users:
        test_notif = Notification(
            user_id=user.user_id,
            title="Test Notification",
            message=f"This is a test notification for {user.email}",
            notification_type=NotificationType.REMINDER,
            notify_at=datetime.utcnow(),
            sent=False,
            read=False
        )
        db.add(test_notif)
        print(f"Created test notification for {user.email}")
    
    db.commit()
    
    # Verify creation
    print("\n=== Verification ===")
    all_notifications = db.query(Notification).all()
    print(f"Total notifications after test: {len(all_notifications)}")
    
    # Show notifications by user
    for user in users:
        user_notifs = db.query(Notification).filter(
            Notification.user_id == user.user_id
        ).all()
        print(f"\n{user.email} has {len(user_notifs)} notifications:")
        for n in user_notifs:
            print(f"  - {n.notification_type}: {n.title} (Read: {n.read})")
    
    db.close()
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_notifications()
