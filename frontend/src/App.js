// frontend/src/App.js - Updated with Job Routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Homepage from './components/Homepage/Homepage';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Companies from './components/Companies/Companies';
import JobDetail from './components/Jobs/JobDetail';
import AdminDashboard from './components/Admin/AdminDashboard';
import CompanyManagement from './components/Admin/CompanyManagement';
import HRDashboard from './components/HR/HRDashboard';
import JobCreation from './components/HR/JobCreation';
import JobEdit from './components/HR/JobEdit';
import JobManagement from './components/HR/JobManagement';
import Profile from './components/Profile/Profile';
import ResumeUpload from './components/Student/ResumeUpload';
import './styles/global.css';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/companies" element={<Companies />} />

            {/* Job Routes - ต้อง login */}
            <Route path="/jobs/:jobId" element={<JobDetail />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompanyManagement />} />

            {/* HR Routes */}
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/jobs/create" element={<JobCreation />} />
            <Route path="/hr/jobs/:jobId/edit" element={<JobEdit />} />
            <Route path="/hr/jobs" element={<JobManagement />} />

            {/* User Routes */}
            <Route path="/profile" element={<Profile />} />

            {/* Student Routes */}
            <Route path="/student/resume" element={<ResumeUpload />} />

            {/* จะเพิ่ม route อื่นๆ ทีหลัง */}
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;