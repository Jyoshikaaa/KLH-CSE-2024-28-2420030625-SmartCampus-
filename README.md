# FacultyLens — Smart Faculty Selection & Registration Planning Assistant

> **Official Pre-Registration Decision-Support System for Semester Course & Faculty Selection**  
> *KLH Bachupally-Bowrampet Campus • Department of Computer Science & Engineering*

---

## 📌 Problem Statement & Purpose

Before each semester, the college releases an extensive pre-registration Option Form Excel file (`Y24 Option Form-Updated 30062026.xlsx`) specifying courses, clusters, sections, and faculty allocations.

Students face significant hurdles during registration:
1. **Faculty Identification**: Students often do not recognize faculty members solely by names or employee IDs.
2. **Cluster & Section Mapping**: Navigating the matrix across multiple clusters and sections is confusing.
3. **Backup Preparation**: On registration day, high-demand sections fill up rapidly in the college ERP, leaving unprepared students stranded without backup priorities.

**FacultyLens** transforms the pre-registration Excel into an interactive, visual workspace with verified official photographs, allowing students to structure Priority 1, 2, and 3 backups, export high-resolution registration planning cards (PNG), and use a mobile-first cheat sheet side-by-side with ERP.

> **Zero ERP Automation Note**: FacultyLens functions strictly as a pre-registration decision assistant and does not collect credentials, automate ERP clicks, or bypass CAPTCHA.

---

## 🚀 Key Features

- **📊 Registration Dashboard**: Visual planning metrics, course completion progress bar (e.g. *8 / 16 Courses Planned*), quick jump to flagged professors.
- **🖼️ Verified Official Faculty Photos**: Multi-tier matching against the official KLH directory (`https://klh.edu.in/bhp-faculty/`) stored locally in `C:\Users\Krishna\Desktop\Faculty`.
- **🔍 Global Instant Search (`Ctrl + K`)**: Real-time lookup across all faculty, employee IDs, course codes, acronyms, and sections.
- **📚 Course → Cluster → Section → Faculty Flow**: Faithful representation of the Option Form matrix with interactive cluster tabs (Cluster 1 to 4) and section faculty cards (S1 to S13).
- **🥇 Multi-Priority Preference Planning**: Assign Priority 1 (🥇), Priority 2 (🥈), Priority 3 (🥉) backups with drag/reorder, notes, and instant SQLite persistence.
- **❓ "Need to Identify" Tracker**: Flag unfamiliar faculty for peer recommendations or review.
- **📱 Registration Day Mode**: Distraction-free, high-contrast mobile layout with section copy buttons and completion check-off toggles.
- **📸 High-Resolution PNG & PDF Export**: Crisp planning cards suitable for saving to phone galleries or printing.
- **⚙️ Admin Excel Importer & Photo Manager**: Safe upsert engine to upload new semester sheets and replace faculty photographs anytime.

---

## 🏗️ Architecture & Tech Stack

```
FacultyLens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_courses.py
│   │   │   ├── routes_faculty.py
│   │   │   ├── routes_plan.py
│   │   │   └── routes_import.py
│   │   ├── database.py
│   │   ├── excel_importer.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── uploads/faculty/
│   ├── main.py
│   └── requirements.txt
├── data/
│   ├── faculty_match_report.csv
│   └── facultylens.db
├── frontend/
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   └── download_faculty_photos.py
└── Y24 Option Form-Updated 30062026.xlsx
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, `html-to-image`, Axios
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, SQLite, Pydantic v2, openpyxl, BeautifulSoup4
- **Photo Dataset**: Master storage at `C:\Users\Krishna\Desktop\Faculty` and served through `/uploads/faculty`

---

## 🛠️ Installation & Setup Guide

### 1. Backend Setup
```powershell
cd C:\Users\Krishna\Desktop\FacultyLens\backend
python -m pip install -r requirements.txt
python main.py
```
*API will run at `http://127.0.0.1:8000` (Swagger UI at `http://127.0.0.1:8000/docs`).*

### 2. Frontend Setup
```powershell
cd C:\Users\Krishna\Desktop\FacultyLens\frontend
npm install
npm run dev
```
*Application UI will open at `http://localhost:5173`.*

### 3. Running Photo Acquisition Script (Reusable for Future Semesters)
```powershell
cd C:\Users\Krishna\Desktop\FacultyLens
python scripts\download_faculty_photos.py
```

---

## 🧪 Matching Report Summary (Y24 3-1 Dataset)

- **Total Unique Faculty in Excel**: 34
- **Official Matched Photos**: 16 (Saved to `C:\Users\Krishna\Desktop\Faculty`)
- **Unmatched Faculty**: 18 (Represented with initials avatars with *"Photo unavailable"* badges)
- **Detailed Audit Trail**: `C:\Users\Krishna\Desktop\FacultyLens\data\faculty_match_report.csv`

---

## 📖 Step-by-Step User Journey

1. **Open FacultyLens**: Visit `http://localhost:5173`.
2. **Search or Browse Courses**: Press `Ctrl + K` or open **Courses Explorer**.
3. **Inspect Faculty & Clusters**: Open a course (e.g. *Adaptive Software Engineering*) and view section allocations across clusters with verified photos.
4. **Select for Planning**: Click **+ Select for Planning** to add Priority 1, 2, or 3 faculty options.
5. **Review My Plan**: Visit **My Plan** to reorder priorities or add custom notes.
6. **Download Planning Card**: Click **Download Planning Image (PNG)** to save the high-res plan card to your phone.
7. **Registration Day**: Open **Registration Day Mode** on mobile/split-screen and register seamlessly in ERP.
