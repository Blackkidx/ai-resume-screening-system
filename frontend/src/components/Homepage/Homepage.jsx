import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/student/resume');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Great <span className="highlight">Product</span> is<br />
              built by great <span className="highlight">teams</span>
            </h1>
            <p>
              ระบบคัดกรองเรซูเม่ด้วย AI ที่ช่วยให้การจับคู่งานฝึกงาน
              เป็นเรื่องง่ายและแม่นยำยิ่งขึ้น
            </p>
            <button className="hero-cta" onClick={handleGetStarted}>เริ่มต้นใช้งาน</button>
          </div>

          <div className="hero-visual">
            <div className="hero-illustration">
              <div className="people-group">
                <div className="person-avatar">👨‍💻</div>
                <div className="person-avatar">👩‍💼</div>
                <div className="person-avatar">👨‍🎓</div>
              </div>
              <div className="tech-stack">
                <div className="tech-item">⚛️</div>
                <div className="tech-item">🐍</div>
                <div className="tech-item">🤖</div>
                <div className="tech-item">📊</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">ทำไมต้องเลือก InternScreen?</h2>
          <p className="features-subtitle">
            ระบบคัดกรองเรซูเม่ที่ใช้เทคโนโลยี AI เพื่อการจับคู่ที่แม่นยำ
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🤖</span>
              <h3>AI-Powered Screening</h3>
              <p>
                ใช้เทคโนโลยี Machine Learning และ NLP
                ในการวิเคราะห์และคัดกรองเรซูเม่อย่างแม่นยำ
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>รวดเร็วและมีประสิทธิภาพ</h3>
              <p>
                ลดเวลาการคัดกรองจากหลายชั่วโมงเหลือเพียงไม่กี่นาที
                พร้อมผลลัพธ์ที่แม่นยำ
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>การจับคู่ที่แม่นยำ</h3>
              <p>
                ประเมินทั้ง Hard Skills และ Soft Skills
                เพื่อหาผู้สมัครที่เหมาะสมที่สุดกับตำแหน่งงาน
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;