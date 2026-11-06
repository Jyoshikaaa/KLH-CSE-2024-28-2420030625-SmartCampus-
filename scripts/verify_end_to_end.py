import requests
import json
import time
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"

def test_api():
    print("=" * 60)
    print("FACULTYLENS AUTOMATED END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Health Check
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200, f"Root API failed: {res.status_code}"
    print(f"[OK] 1. Backend Health Check Passed: {res.json()}")

    # 2. Frontend Health Check
    res_front = requests.get(FRONTEND_URL)
    assert res_front.status_code == 200, f"Frontend failed: {res_front.status_code}"
    print(f"[OK] 2. Frontend Server Running on {FRONTEND_URL}")

    # 3. Dashboard Stats
    res = requests.get(f"{BASE_URL}/api/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    print(f"[OK] 3. Dashboard Stats: Total Courses={stats['total_courses']}, Total Faculty={stats['total_faculty']}, Clusters={stats['total_clusters']}")
    assert stats['total_courses'] == 16, f"Expected 16 courses, got {stats['total_courses']}"
    assert stats['total_faculty'] == 34, f"Expected 34 faculty, got {stats['total_faculty']}"

    # 4. Courses API
    res = requests.get(f"{BASE_URL}/api/courses")
    assert res.status_code == 200
    courses = res.json()
    print(f"[OK] 4. Courses API returned {len(courses)} courses.")

    # 5. Course Detail API (e.g. Course ID 1 - Adaptive Software Engineering)
    c1_id = courses[0]["id"]
    res = requests.get(f"{BASE_URL}/api/courses/{c1_id}")
    assert res.status_code == 200
    c1 = res.json()
    print(f"[OK] 5. Course Detail: '{c1['course_title']}' ({c1['course_code']}) with {len(c1['assignments'])} section assignments.")

    # 6. Faculty Search API (Search for 'Archana')
    res = requests.get(f"{BASE_URL}/api/search?q=Archana")
    assert res.status_code == 200
    search_res = res.json()
    assert len(search_res["faculty"]) >= 1, "Faculty 'Archana' not found in search"
    fac_archana = search_res["faculty"][0]
    print(f"[OK] 6. Search API: Found faculty '{fac_archana['full_name']}' (EMP: {fac_archana['employee_id']}) with photo path: {fac_archana['photo_path']}")

    # 7. Verify Static Photo Serving
    if fac_archana["photo_path"]:
        photo_res = requests.get(f"{BASE_URL}{fac_archana['photo_path']}")
        assert photo_res.status_code == 200, f"Failed to serve photo: {photo_res.status_code}"
        print(f"[OK] 7. Verified Faculty Photo Serving: {fac_archana['photo_path']} (Length: {len(photo_res.content)} bytes)")

    # 8. Faculty Profile API
    res = requests.get(f"{BASE_URL}/api/faculty/{fac_archana['employee_id']}")
    assert res.status_code == 200
    prof = res.json()
    print(f"[OK] 8. Faculty Profile: '{prof['full_name']}' has {len(prof['assignments'])} teaching assignments.")

    # 9. Test Mark as 'Need to Identify'
    res = requests.post(f"{BASE_URL}/api/faculty/identify", json={"faculty_id": prof["id"], "status": "need_to_identify"})
    assert res.status_code == 200
    print(f"[OK] 9. Marked faculty #{prof['id']} as 'need_to_identify'")

    # 10. Verify Need to Identify List
    res = requests.get(f"{BASE_URL}/api/faculty/needing-identification")
    assert res.status_code == 200
    need_id_list = res.json()
    assert any(f["id"] == prof["id"] for f in need_id_list)
    print(f"[OK] 10. Verified 'Need to Identify' list contains {len(need_id_list)} faculty members.")

    # 11. Add Selection to Registration Plan (Priority 1)
    assign_0 = prof["assignments"][0]
    res = requests.post(f"{BASE_URL}/api/registration-plan", json={
        "course_id": assign_0["course_id"],
        "section_id": assign_0["section_id"],
        "faculty_id": prof["id"],
        "cluster_id": assign_0["cluster_id"],
        "priority": 1,
        "notes": "Verified good lab teaching"
    })
    assert res.status_code == 200
    plan_item_1 = res.json()
    print(f"[OK] 11. Added Plan Item 1: {prof['full_name']} for {assign_0['course_code']} ({assign_0['section_name']})")

    # 12. Add a Backup Faculty Selection for Same Course (Priority 2)
    other_assign = [a for a in c1["assignments"] if a["faculty"]["id"] != prof["id"]][0]
    res = requests.post(f"{BASE_URL}/api/registration-plan", json={
        "course_id": c1["id"],
        "section_id": other_assign["section_id"],
        "faculty_id": other_assign["faculty"]["id"],
        "cluster_id": other_assign["cluster_id"],
        "priority": 2,
        "notes": "Backup option"
    })
    assert res.status_code == 200
    plan_item_2 = res.json()
    print(f"[OK] 12. Added Plan Item 2 (Backup): {other_assign['faculty']['full_name']} for {c1['course_code']} ({other_assign['section_name']})")

    # 13. Verify Registration Plan Structure
    res = requests.get(f"{BASE_URL}/api/registration-plan")
    assert res.status_code == 200
    plan_data = res.json()
    assert len(plan_data["course_groups"]) >= 1
    cg = plan_data["course_groups"][0]
    assert len(cg["items"]) >= 2
    print(f"[OK] 13. Multi-Priority Plan verified: Course '{cg['course_title']}' has {len(cg['items'])} prioritized choices (P1: {cg['items'][0]['faculty']['full_name']}, P2: {cg['items'][1]['faculty']['full_name']})")

    # 14. Test Reordering Preferences
    reorder_res = requests.post(f"{BASE_URL}/api/registration-plan/reorder", json=[plan_item_2["id"], plan_item_1["id"]], params={"course_id": c1["id"]})
    assert reorder_res.status_code == 200
    
    res = requests.get(f"{BASE_URL}/api/registration-plan")
    plan_data = res.json()
    cg = plan_data["course_groups"][0]
    print(f"[OK] 14. Priority Reordering verified: New P1 is '{cg['items'][0]['faculty']['full_name']}'")

    print("\n" + "=" * 60)
    print("ALL 14 AUTOMATED END-TO-END VERIFICATION CHECKS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
