// frontend/src/components/LoadingSpinner/LoadingSpinner.jsx
import React from 'react';
import '../../styles/LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'กำลังโหลด...' }) => {
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;