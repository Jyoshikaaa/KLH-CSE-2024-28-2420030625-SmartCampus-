import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, SessionLocal
from app.faculty_seeder import seed_permanent_faculty
from app.api.routes_courses import router as courses_router
from app.api.routes_faculty import router as faculty_router
from app.api.routes_plan import router as plan_router
from app.api.routes_import import router as import_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Static photos folder
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "faculty")
os.makedirs(STATIC_DIR, exist_ok=True)

app = FastAPI(
    title="FacultyLens API",
    description="Smart Faculty Selection & Registration Planning Assistant Backend",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static faculty photos
app.mount("/uploads/faculty", StaticFiles(directory=STATIC_DIR), name="faculty_photos")

# Include Routers
app.include_router(courses_router)
app.include_router(faculty_router)
app.include_router(plan_router)
app.include_router(import_router)

@app.on_event("startup")
def startup_event():
    # Seed permanent faculty directory on startup
    db = SessionLocal()
    try:
        seed_permanent_faculty(db)
    except Exception as e:
        print(f"Permanent faculty seed error: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "name": "FacultyLens API",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
