// frontend/src/components/Navbar/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';

const StatusIcon = ({ type }) => {
    if (type === 'accepted') return (
        <svg className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    );
    if (type === 'rejected') return (
        <svg className="w-5 h-5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
    );
    return (
        <svg className="w-5 h-5 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
    );
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr);
    const m = Math.floor(diffMs / 60000), h = Math.floor(diffMs / 3600000), d = Math.floor(diffMs / 86400000);
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return `${m} นาทีที่แล้ว`;
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    if (d < 7) return `${d} วันที่แล้ว`;
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const [ticker, setTicker] = useState(0);
    const dropdownRef = useRef(null);

    const loadNotifications = useCallback(async () => {
        const result = await notificationService.fetchNotifications();
        setNotifications(result.notifications || []);
        setUnreadCount(result.unread_count || 0);
    }, []);

    // Global Ticker for real-time time ago updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTicker((prev) => prev + 1);
        }, 60000); // 1 minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadNotifications();
        const unsubscribe = notificationService.onNotification((data) => {
            setNotifications((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);
            setShowToast(data);
            setTimeout(() => setShowToast(null), 5000);
        });
        notificationService.connectSSE();
        return () => { unsubscribe(); notificationService.disconnectSSE(); };
    }, [loadNotifications]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
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
            setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setIsOpen(false);
        navigate('/student/applications');
    };

    return (
        <>
            {/* Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 z-[999] flex items-start gap-3 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-w-sm animate-slideInRight">
                    <StatusIcon type={showToast.data?.new_status} />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{showToast.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{showToast.message}</p>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0" onClick={() => setShowToast(null)}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
            )}

            {/* Bell Button + Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="การแจ้งเตือน"
                >
                    <svg
                        className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-sky-600 animate-bellShake' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 overflow-hidden z-[100] origin-top animate-[springDrop_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/60 bg-white/40">
                            <h4 className="font-extrabold text-slate-900 text-[15px] tracking-tight">การแจ้งเตือน</h4>
                            {unreadCount > 0 && (
                                <button className="text-[13px] font-bold text-sky-600 hover:text-sky-700 transition-colors" onClick={handleMarkAllRead}>
                                    อ่านทั้งหมด
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/50 custom-scrollbar relative">
                            {notifications.length === 0 ? (
                                <div className="py-16 flex flex-col items-center gap-4 text-slate-400 bg-white/40">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    </div>
                                    <p className="text-[13px] font-medium tracking-tight">ไม่มีการแจ้งเตือนใหม่</p>
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notif, index) => (
                                    <button
                                        key={notif.id}
                                        className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-slate-50/80 transition-all duration-300 animate-fadeInUp opacity-0 group ${!notif.is_read ? 'bg-sky-50/40 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sky-500 before:rounded-r-full' : 'bg-transparent'}`}
                                        style={{ animationDelay: `${index * 60 + 50}ms`, animationFillMode: 'forwards' }}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="p-2 rounded-2xl bg-white shadow-sm border border-slate-100 shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <StatusIcon type={notif.data?.new_status} />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className={`text-sm leading-tight ${!notif.is_read ? 'font-bold text-slate-900 group-hover:text-sky-700 transition-colors' : 'font-medium text-slate-700'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-[13px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            <p className="text-[11px] font-semibold text-slate-400 mt-2 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-3 h-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 15 15" /></svg>
                                                {formatTimeAgo(notif.created_at)}
                                            </p>
                                        </div>
                                        {!notif.is_read && <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)] shrink-0 mt-2 right-5 absolute" />}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <button
                                className="w-full py-3.5 text-center text-[13px] font-bold text-sky-600 hover:text-sky-700 bg-slate-50/50 hover:bg-slate-50 border-t border-slate-100/60 transition-colors"
                                onClick={() => { setIsOpen(false); navigate('/student/applications'); }}
                            >
                                ดูทั้งหมด →
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationBell;
