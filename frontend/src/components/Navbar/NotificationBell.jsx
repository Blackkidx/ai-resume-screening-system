import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import '../../styles/notification.css';

const BellIcon = ({ hasUnread }) => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`notif-bell-svg ${hasUnread ? 'notif-bell-ring' : ''}`}
    >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const StatusIcon = ({ type }) => {
    if (type === 'accepted') {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        );
    }
    if (type === 'rejected') {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
        );
    }
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const dropdownRef = useRef(null);

    const loadNotifications = useCallback(async () => {
        const result = await notificationService.fetchNotifications();
        setNotifications(result.notifications || []);
        setUnreadCount(result.unread_count || 0);
    }, []);

    useEffect(() => {
        loadNotifications();

        // SSE listener
        const unsubscribe = notificationService.onNotification((data) => {
            setNotifications((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast
            setShowToast(data);
            setTimeout(() => setShowToast(null), 5000);
        });

        notificationService.connectSSE();

        return () => {
            unsubscribe();
            notificationService.disconnectSSE();
        };
    }, [loadNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            await notificationService.markAsRead(notif.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setIsOpen(false);
        navigate('/student/applications');
    };

    return (
        <>
            {/* Toast Notification */}
            {showToast && (
                <div className="notif-toast notif-toast-enter">
                    <StatusIcon type={showToast.data?.new_status} />
                    <div className="notif-toast-content">
                        <strong>{showToast.title}</strong>
                        <span>{showToast.message}</span>
                    </div>
                    <button className="notif-toast-close" onClick={() => setShowToast(null)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Bell + Dropdown */}
            <div className="notif-bell-wrapper" ref={dropdownRef}>
                <button
                    className="notif-bell-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="การแจ้งเตือน"
                >
                    <BellIcon hasUnread={unreadCount > 0} />
                    {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>

                {isOpen && (
                    <div className="notif-dropdown notif-dropdown-enter">
                        <div className="notif-dropdown-header">
                            <h4>การแจ้งเตือน</h4>
                            {unreadCount > 0 && (
                                <button className="notif-read-all-btn" onClick={handleMarkAllRead}>
                                    อ่านทั้งหมด
                                </button>
                            )}
                        </div>

                        <div className="notif-dropdown-list">
                            {notifications.length === 0 ? (
                                <div className="notif-empty">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    <p>ยังไม่มีการแจ้งเตือน</p>
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notif) => (
                                    <button
                                        key={notif.id}
                                        className={`notif-item ${!notif.is_read ? 'notif-unread' : ''}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="notif-item-icon">
                                            <StatusIcon type={notif.data?.new_status} />
                                        </div>
                                        <div className="notif-item-content">
                                            <span className="notif-item-title">{notif.title}</span>
                                            <span className="notif-item-msg">{notif.message}</span>
                                            <span className="notif-item-time">{formatTimeAgo(notif.created_at)}</span>
                                        </div>
                                        {!notif.is_read && <span className="notif-unread-dot" />}
                                    </button>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <button
                                className="notif-dropdown-footer"
                                onClick={() => { setIsOpen(false); navigate('/student/applications'); }}
                            >
                                ดูทั้งหมด
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationBell;
