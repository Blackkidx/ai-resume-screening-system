# backend/routes/student.py - Student-specific routes เท่านั้น
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from typing import Optional

# Local imports
from core.auth import get_current_user_id, get_current_user_data
from core.database import get_database

# Create router
router = APIRouter(prefix="/student", tags=["Student Specific"])

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
async def verify_student_access(user_id: str):
    """ตรวจสอบว่าเป็น Student และมีสิทธิ์เข้าถึง"""
    db = get_database()
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get("user_type") != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student access required."
        )
    
    return user

# =============================================================================
# STUDENT DASHBOARD - ข้อมูลเฉพาะ Student
# =============================================================================
@router.get("/dashboard")
async def get_student_dashboard(user_id: str = Depends(get_current_user_id)):
    """ดึงข้อมูลสำหรับ Student Dashboard (เฉพาะ Student เท่านั้น)"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # นับสถิติเฉพาะ Student
        resume_count = await db.resumes.count_documents({"user_id": user["_id"]})
        applications_count = await db.applications.count_documents({"user_id": user["_id"]})
        
        # ข้อมูลสำหรับ Student Dashboard
        dashboard_data = {
            "user_info": {
                "name": user["full_name"],
                "email": user["email"],
                "profile_image": user.get("profile_image")
            },
            "stats": {
                "resumes_uploaded": resume_count,
                "jobs_applied": applications_count,
                "profile_completeness": calculate_profile_completeness(user)
            },
            "recent_activity": [],  # จะเพิ่มทีหลัง
            "notifications": [],    # จะเพิ่มทีหลัง
            "recommended_jobs": []  # จะเพิ่มทีหลัง
        }
        
        return dashboard_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )

# =============================================================================
# RESUME MANAGEMENT - เฉพาะ Student
# =============================================================================
@router.post("/resume/upload")
async def upload_resume(user_id: str = Depends(get_current_user_id)):
    """อัปโหลดเรซูเม่ (เฉพาะ Student)"""
    try:
        user = await verify_student_access(user_id)
        
        # TODO: Implement resume upload logic
        return {
            "message": "Resume upload feature will be implemented soon",
            "user_id": str(user["_id"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resume: {str(e)}"
        )

@router.get("/resume/history")
async def get_resume_history(user_id: str = Depends(get_current_user_id)):
    """ดูประวัติเรซูเม่ (เฉพาะ Student)"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ดึงประวัติเรซูเม่
        resumes = await db.resumes.find({"user_id": user["_id"]}).to_list(length=None)
        
        return {
            "resumes": resumes,
            "total_count": len(resumes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch resume history: {str(e)}"
        )

# =============================================================================
# JOB APPLICATION - เฉพาะ Student
# =============================================================================
@router.get("/job-positions")
async def get_available_jobs(user_id: str = Depends(get_current_user_id)):
    """ดูตำแหน่งงานที่เปิดรับสมัคร (เฉพาะ Student)"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ดึงตำแหน่งงานที่เปิดรับสมัคร
        jobs = await db.job_positions.find({"is_active": True}).to_list(length=None)
        
        return {
            "jobs": jobs,
            "total_count": len(jobs)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch job positions: {str(e)}"
        )

@router.post("/applications")
async def apply_for_job(user_id: str = Depends(get_current_user_id)):
    """สมัครงาน (เฉพาะ Student)"""
    try:
        user = await verify_student_access(user_id)
        
        # TODO: Implement job application logic
        return {
            "message": "Job application feature will be implemented soon",
            "user_id": str(user["_id"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply for job: {str(e)}"
        )

@router.get("/applications/results")
async def get_application_results(user_id: str = Depends(get_current_user_id)):
    """ดูผลการสมัครงาน (เฉพาะ Student)"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ดึงผลการสมัครงาน
        applications = await db.applications.find({"user_id": user["_id"]}).to_list(length=None)
        
        return {
            "applications": applications,
            "total_count": len(applications)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch application results: {str(e)}"
        )

# =============================================================================
# AI FEATURES - เฉพาะ Student
# =============================================================================
@router.post("/matching-score")
async def get_matching_score(user_id: str = Depends(get_current_user_id)):
    """คำนวณคะแนนความเหมาะสม (เฉพาะ Student)"""
    try:
        user = await verify_student_access(user_id)
        
        # TODO: Implement AI matching score logic
        return {
            "message": "AI matching score feature will be implemented soon",
            "user_id": str(user["_id"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate matching score: {str(e)}"
        )

@router.get("/resume/{resume_id}/analysis")
async def get_resume_analysis(
    resume_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """วิเคราะห์เรซูเม่ด้วย AI (เฉพาะ Student)"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ตรวจสอบว่าเรซูเม่เป็นของ Student คนนี้
        resume = await db.resumes.find_one({
            "_id": ObjectId(resume_id),
            "user_id": user["_id"]
        })
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        # TODO: Implement AI resume analysis logic
        return {
            "message": "AI resume analysis feature will be implemented soon",
            "resume_id": resume_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze resume: {str(e)}"
        )

# =============================================================================
# NOTIFICATIONS - เฉพาะ Student
# =============================================================================
@router.get("/notifications")
async def get_student_notifications(user_id: str = Depends(get_current_user_id)):
    """ดูรายการแจ้งเตือนทั้งหมด (เฉพาะ Student)"""
    try:
        db = get_database()
        await verify_student_access(user_id)

        from services.notification_service import NotificationService
        svc = NotificationService(db)

        notifications = await svc.get_notifications(user_id, limit=50)
        unread_count = await svc.get_unread_count(user_id)

        return {
            "notifications": notifications,
            "unread_count": unread_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}",
        )


@router.get("/notifications/stream")
async def notification_stream(token: str = ""):
    """SSE endpoint — real-time notification stream (เฉพาะ Student).
    Uses query param ?token= because EventSource cannot send Authorization header.
    """
    from starlette.responses import StreamingResponse
    from core.auth import decode_access_token
    from services.notification_service import sse_event_generator

    if not token:
        raise HTTPException(status_code=401, detail="Token required")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    await verify_student_access(user_id)

    return StreamingResponse(
        sse_event_generator(user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Mark notification as read"""
    try:
        db = get_database()
        await verify_student_access(user_id)

        from services.notification_service import NotificationService
        svc = NotificationService(db)

        success = await svc.mark_as_read(notification_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")

        return {"message": "Marked as read"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification: {str(e)}",
        )


@router.put("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = Depends(get_current_user_id)):
    """Mark all notifications as read"""
    try:
        db = get_database()
        await verify_student_access(user_id)

        from services.notification_service import NotificationService
        svc = NotificationService(db)

        count = await svc.mark_all_as_read(user_id)
        return {"message": f"Marked {count} notifications as read", "count": count}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notifications: {str(e)}",
        )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def calculate_profile_completeness(user: dict) -> int:
    """คำนวณความสมบูรณ์ของโปรไฟล์ (0-100%)"""
    total_fields = 5
    completed_fields = 0

    required_fields = ["full_name", "email", "username"]
    optional_fields = ["phone", "profile_image"]

    for field in required_fields:
        if user.get(field):
            completed_fields += 1

    for field in optional_fields:
        if user.get(field):
            completed_fields += 1

    return int((completed_fields / total_fields) * 100)
