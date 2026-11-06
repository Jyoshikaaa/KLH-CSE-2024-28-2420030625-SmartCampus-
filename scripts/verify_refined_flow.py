import requests
import json
import time
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"
EXCEL_PATH = r"C:\Users\Krishna\Desktop\FacultyLens\Y24 Option Form-Updated 30062026.xlsx"

def test_workflow():
    print("=" * 60)
    print("FACULTYLENS REFINED ID-CARD WORKFLOW VERIFICATION")
    print("=" * 60)

    # 1. Health Checks
    r_api = requests.get(f"{BASE_URL}/")
    assert r_api.status_code == 200, "Backend offline"
    r_fe = requests.get(FRONTEND_URL)
    assert r_fe.status_code == 200, "Frontend offline"
    print("[OK] 1. Backend and Frontend servers are online.")

    # 2. Test Permanent Faculty Directory Pre-Seeding
    r_fac = requests.get(f"{BASE_URL}/api/faculty")
    assert r_fac.status_code == 200
    faculty_list = r_fac.json()
    assert len(faculty_list) == 34, f"Expected 34 predefined faculty, got {len(faculty_list)}"
    print(f"[OK] 2. Permanent Faculty Directory contains {len(faculty_list)} predefined faculty members.")

    # 3. Test Reset / Clean State (Simulation of First Launch)
    r_reset = requests.post(f"{BASE_URL}/api/import/reset-semester")
    assert r_reset.status_code == 200
    r_status = requests.get(f"{BASE_URL}/api/status")
    status = r_status.json()
    assert status["has_registration_data"] == False, "Expected has_registration_data == False after reset"
    assert status["faculty_count"] == 34, "Permanent faculty directory must remain intact after semester reset"
    print("[OK] 3. Verified Initial State: Registration Data not loaded, Permanent Faculty Directory intact (34 faculty).")

    # 4. Test Excel Upload & Ingestion Flow
    assert os.path.exists(EXCEL_PATH), f"Excel not found at {EXCEL_PATH}"
    with open(EXCEL_PATH, "rb") as f:
        files = {"file": (os.path.basename(EXCEL_PATH), f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r_upload = requests.post(f"{BASE_URL}/api/import/excel", files=files)
    assert r_upload.status_code == 200, f"Upload failed: {r_upload.text}"
    summary = r_upload.json()
    print(f"[OK] 4. Excel Upload Processed: {summary['courses_count']} Courses, {summary['clusters_count']} Clusters, {summary['sections_count']} Sections, {summary['assignments_count']} Assignments.")
    assert summary["courses_count"] == 16
    assert summary["clusters_count"] == 4
    assert summary["sections_count"] == 13

    # 5. Verify Active Semester Status
    r_status = requests.get(f"{BASE_URL}/api/status")
    status = r_status.json()
    assert status["has_registration_data"] == True
    print(f"[OK] 5. Active Semester: '{status['semester']}' successfully loaded into workspace.")

    # 6. Test Faculty Search & Photo Retrieval
    r_search = requests.get(f"{BASE_URL}/api/search?q=9940")
    assert r_search.status_code == 200
    results = r_search.json()
    assert len(results["faculty"]) >= 1
    fac_archana = results["faculty"][0]
    print(f"[OK] 6. Search by EMP ID '9940': Found '{fac_archana['full_name']}' with photo '{fac_archana['photo_path']}'")
    if fac_archana["photo_path"]:
        r_img = requests.get(f"{BASE_URL}{fac_archana['photo_path']}")
        assert r_img.status_code == 200
        print(f"     Official photo verified ({len(r_img.content)} bytes).")

    # 7. Test Course Exploration & Cluster Assignments
    r_courses = requests.get(f"{BASE_URL}/api/courses")
    courses = r_courses.json()
    assert len(courses) == 16
    c1 = courses[0]
    r_c1 = requests.get(f"{BASE_URL}/api/courses/{c1['id']}")
    c1_detail = r_c1.json()
    print(f"[OK] 7. Course Detail '{c1_detail['course_title']}': {len(c1_detail['assignments'])} section options across {len(c1_detail['clusters'])} clusters.")

    # 8. Test Planning (Priority 1 & Priority 2 Backup)
    a1 = c1_detail["assignments"][0]
    a2 = c1_detail["assignments"][1]

    # Add Priority 1
    r_p1 = requests.post(f"{BASE_URL}/api/registration-plan", json={
        "course_id": c1_detail["id"],
        "section_id": a1["section_id"],
        "faculty_id": a1["faculty"]["id"],
        "cluster_id": a1["cluster_id"],
        "priority": 1,
        "notes": "First choice for ASE"
    })
    assert r_p1.status_code == 200
    item1 = r_p1.json()

    # Add Priority 2 (Backup)
    r_p2 = requests.post(f"{BASE_URL}/api/registration-plan", json={
        "course_id": c1_detail["id"],
        "section_id": a2["section_id"],
        "faculty_id": a2["faculty"]["id"],
        "cluster_id": a2["cluster_id"],
        "priority": 2,
        "notes": "Backup choice for ASE"
    })
    assert r_p2.status_code == 200
    item2 = r_p2.json()

    r_plan = requests.get(f"{BASE_URL}/api/registration-plan")
    plan = r_plan.json()
    assert len(plan["course_groups"]) >= 1
    assert len(plan["course_groups"][0]["items"]) == 2
    print(f"[OK] 8. Registration Plan updated: Course '{plan['course_groups'][0]['course_title']}' has Priority 1 ({a1['faculty']['full_name']}) and Priority 2 ({a2['faculty']['full_name']}).")

    # 9. Test Reordering Priorities
    r_reorder = requests.post(f"{BASE_URL}/api/registration-plan/reorder", json=[item2["id"], item1["id"]], params={"course_id": c1_detail["id"]})
    assert r_reorder.status_code == 200
    r_plan2 = requests.get(f"{BASE_URL}/api/registration-plan")
    new_cg = r_plan2.json()["course_groups"][0]
    assert new_cg["items"][0]["id"] == item2["id"]
    print(f"[OK] 9. Priority Reordering verified: Priority 1 is now '{new_cg['items'][0]['faculty']['full_name']}'.")

    # 10. Test Resetting Back to Clean First-Launch State
    r_clean = requests.post(f"{BASE_URL}/api/import/reset-semester")
    assert r_clean.status_code == 200
    r_final_status = requests.get(f"{BASE_URL}/api/status")
    final_status = r_final_status.json()
    assert final_status["has_registration_data"] == False
    assert final_status["faculty_count"] == 34
    print("[OK] 10. Clean state reset verified: Application left ready for Excel upload on launch.")

    print("\n" + "=" * 60)
    print("ALL 10 ID-CARD WORKFLOW CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_workflow()
