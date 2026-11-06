import os
from app.database import engine, Base, SessionLocal
from app.faculty_seeder import seed_permanent_faculty
from app.excel_importer import clear_semester_registration_data

def clean_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear any existing semester registration data
        clear_semester_registration_data(db)
        # Ensure permanent faculty directory is pre-seeded with all 34 faculty
        seed_permanent_faculty(db)
        print("Database initialized in clean NO_SEMESTER_LOADED state with permanent faculty directory.")
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
