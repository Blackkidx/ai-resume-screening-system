// frontend/src/services/notificationService.js
// SSE client + notification CRUD for real-time student notifications

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class NotificationService {
    constructor() {
        this.eventSource = null;
        this.listeners = new Set();
        this.reconnectTimer = null;
        this.reconnectDelay = 3000;
    }

    getToken() {
        return sessionStorage.getItem('auth_token');
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getToken()}`,
        };
    }

    // --- REST APIs ---

    async fetchNotifications() {
        try {
            const res = await fetch(`${BASE_URL}/api/student/notifications`, {
                headers: this.getHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('[NotificationService] Fetch failed:', err);
            return { notifications: [], unread_count: 0 };
        }
    }

    async markAsRead(notificationId) {
        try {
            const res = await fetch(
                `${BASE_URL}/api/student/notifications/${notificationId}/read`,
                { method: 'PUT', headers: this.getHeaders() }
            );
            return res.ok;
        } catch (err) {
            console.error('[NotificationService] Mark read failed:', err);
            return false;
        }
    }

    async markAllAsRead() {
        try {
            const res = await fetch(`${BASE_URL}/api/student/notifications/read-all`, {
                method: 'PUT',
                headers: this.getHeaders(),
            });
            return res.ok;
        } catch (err) {
            console.error('[NotificationService] Mark all read failed:', err);
            return false;
        }
    }

    // --- SSE (Server-Sent Events) ---

    connectSSE() {
        if (this.eventSource) this.disconnectSSE();

        const token = this.getToken();
        if (!token) return;

        const url = `${BASE_URL}/api/student/notifications/stream?token=${token}`;
        this.eventSource = new EventSource(url);

        this.eventSource.addEventListener('notification', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.notifyListeners(data);
            } catch (err) {
                console.error('[SSE] Parse error:', err);
            }
        });

        this.eventSource.onerror = () => {
            console.warn('[SSE] Connection lost, reconnecting...');
            this.eventSource?.close();
            this.eventSource = null;
            this.scheduleReconnect();
        };

        this.eventSource.onopen = () => {
            this.reconnectDelay = 3000;
        };
    }

    disconnectSSE() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    scheduleReconnect() {
        this.reconnectTimer = setTimeout(() => {
            this.connectSSE();
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
        }, this.reconnectDelay);
    }

    // --- Event Listeners ---

    onNotification(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach((cb) => cb(data));
    }
}

const notificationService = new NotificationService();
export default notificationService;
