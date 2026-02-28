# backend/services/notification_service.py
"""
Notification Service with SSE (Server-Sent Events) support.
Manages notification creation, storage, and real-time push to connected clients.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import AsyncGenerator

from bson import ObjectId

logger = logging.getLogger(__name__)


class SSEConnectionManager:
    """Manages SSE connections per user for real-time push notifications."""

    def __init__(self):
        self._connections: dict[str, list[asyncio.Queue]] = {}

    def connect(self, user_id: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(queue)
        logger.info("[SSE] User %s connected (total: %d)", user_id, len(self._connections[user_id]))
        return queue

    def disconnect(self, user_id: str, queue: asyncio.Queue):
        if user_id in self._connections:
            self._connections[user_id] = [q for q in self._connections[user_id] if q is not queue]
            if not self._connections[user_id]:
                del self._connections[user_id]
            logger.info("[SSE] User %s disconnected", user_id)

    async def push(self, user_id: str, event_data: dict):
        if user_id not in self._connections:
            return
        for queue in self._connections[user_id]:
            await queue.put(event_data)
        logger.info("[SSE] Pushed event to user %s (%d queues)", user_id, len(self._connections[user_id]))

    def is_connected(self, user_id: str) -> bool:
        return user_id in self._connections and len(self._connections[user_id]) > 0


# Singleton
sse_manager = SSEConnectionManager()


class NotificationService:
    """Creates, stores, and manages notifications."""

    STATUS_LABELS = {
        "accepted": "ผ่านการคัดเลือก",
        "rejected": "ไม่ผ่านการคัดเลือก",
        "reviewing": "กำลังพิจารณา",
        "interview": "นัดสัมภาษณ์",
    }

    STATUS_ICONS = {
        "accepted": "check-circle",
        "rejected": "x-circle",
        "reviewing": "eye",
        "interview": "calendar",
    }

    def __init__(self, db):
        self.db = db

    async def create_application_notification(
        self,
        student_id: str,
        application_id: str,
        job_title: str,
        company_name: str,
        new_status: str,
        hr_reason: str = "",
    ) -> dict:
        """Create a notification when HR updates application status."""

        status_label = self.STATUS_LABELS.get(new_status, new_status)
        icon = self.STATUS_ICONS.get(new_status, "bell")

        if new_status == "accepted":
            title = "ยินดีด้วย! คุณผ่านการคัดเลือก"
            message = f"ใบสมัคร {job_title} ({company_name}) — {status_label}"
        elif new_status == "rejected":
            title = "ผลการคัดเลือก"
            message = f"ใบสมัคร {job_title} ({company_name}) — {status_label}"
        else:
            title = "อัปเดตสถานะใบสมัคร"
            message = f"ใบสมัคร {job_title} ({company_name}) — {status_label}"

        notification_doc = {
            "user_id": student_id,
            "type": "application_status",
            "icon": icon,
            "title": title,
            "message": message,
            "data": {
                "application_id": application_id,
                "job_title": job_title,
                "company_name": company_name,
                "new_status": new_status,
                "hr_reason": hr_reason,
            },
            "is_read": False,
            "created_at": datetime.utcnow(),
        }

        result = await self.db.notifications.insert_one(notification_doc)
        notification_doc["_id"] = result.inserted_id

        # Push via SSE
        sse_payload = self._serialize(notification_doc)
        await sse_manager.push(student_id, sse_payload)

        logger.info(
            "[Notification] Created for user %s: %s (%s)",
            student_id, job_title, new_status,
        )
        return notification_doc

    async def get_notifications(self, user_id: str, limit: int = 50) -> list[dict]:
        cursor = self.db.notifications.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)

        notifications = []
        async for doc in cursor:
            notifications.append(self._serialize(doc))
        return notifications

    async def get_unread_count(self, user_id: str) -> int:
        return await self.db.notifications.count_documents(
            {"user_id": user_id, "is_read": False}
        )

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        result = await self.db.notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
        )
        return result.modified_count > 0

    async def mark_all_as_read(self, user_id: str) -> int:
        result = await self.db.notifications.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
        )
        return result.modified_count

    @staticmethod
    def _serialize(doc: dict) -> dict:
        """Convert MongoDB doc to JSON-safe dict."""
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = NotificationService._serialize(value)
            else:
                result[key] = value
        if "_id" in result:
            result["id"] = result.pop("_id")
        return result


async def sse_event_generator(user_id: str) -> AsyncGenerator[str, None]:
    """SSE generator — yields events as they arrive in the user's queue."""
    queue = sse_manager.connect(user_id)
    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"event: notification\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive
                yield f": heartbeat\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        sse_manager.disconnect(user_id, queue)
