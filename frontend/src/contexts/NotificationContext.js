// frontend/src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
    return ctx;
};

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const timerRef = useRef(null);

    const dismiss = useCallback(() => {
        setNotification(prev => prev ? { ...prev, leaving: true } : null);
        setTimeout(() => setNotification(null), 280);
    }, []);

    const show = useCallback((message, type = 'success', duration = 3000) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotification({ message, type, leaving: false });
        if (duration > 0) {
            timerRef.current = setTimeout(dismiss, duration);
        }
    }, [dismiss]);

    const success = useCallback((msg, dur) => show(msg, 'success', dur), [show]);
    const error = useCallback((msg, dur) => show(msg, 'error', dur ?? 4000), [show]);
    const warning = useCallback((msg, dur) => show(msg, 'warning', dur ?? 3500), [show]);
    const info = useCallback((msg, dur) => show(msg, 'info', dur), [show]);

    return (
        <NotificationContext.Provider value={{ show, success, error, warning, info, dismiss }}>
            {children}
            {notification && (
                <div
                    className={`app-toast-overlay ${notification.leaving ? 'app-toast-leaving' : ''}`}
                    onClick={dismiss}
                >
                    <div
                        className={`app-toast-card app-toast-${notification.type}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="app-toast-icon-wrap">
                            {notification.type === 'success' && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            )}
                            {notification.type === 'error' && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            )}
                            {notification.type === 'warning' && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            )}
                            {notification.type === 'info' && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            )}
                        </div>
                        <p className="app-toast-msg">{notification.message}</p>
                        <button className="app-toast-close" onClick={dismiss}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <div className="app-toast-progress">
                            <div className="app-toast-bar" />
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
