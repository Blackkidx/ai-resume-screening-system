import React from 'react';
import '../../styles/navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          InternScreen
        </a>
        <div className="navbar-menu">
          <div className="navbar-links">
            <a href="/" className="navbar-link">หน้าหลัก</a>
            <a href="/companies" className="navbar-link">บริษัททั้งหมด</a>
          </div>
          <div className="navbar-auth">
            <a href="/login" className="btn btn-secondary">Login</a>
            <a href="/register" className="btn btn-primary">Register</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;