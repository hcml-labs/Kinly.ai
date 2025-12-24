#!/usr/bin/env python3
"""Initialize the database by creating all tables."""

from app.database import Base, engine
from app.models import user, family, child, appointment, notification, integration

def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

if __name__ == "__main__":
    init_db()
