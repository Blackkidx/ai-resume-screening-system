import React from 'react';
import '../../styles/companies.css';

const Companies = () => {
  // ข้อมูลจำลองของบริษัท
  const companies = [
    {
      id: 1,
      name: 'Exam1',
      position: 'Full Stack Developer',
      location: 'เขตบางขุนเทียน กรุงเทพมหานคร',
      salary: '500 บาท/วัน',
      status: 'เปิดรับสมัคร',
      contact: 'xxx-xxx-xxxx'
    },
    {
      id: 2,
      name: 'Exam2',
      position: 'Flutter Developer',
      location: 'เขตสาทร กรุงเทพมหานคร',
      salary: '600 บาท/วัน',
      status: 'เปิดรับสมัคร',
      contact: 'xxx-xxx-xxxx'
    },
    {
      id: 3,
      name: 'Exam3',
      position: 'IT Support',
      location: 'เขตจตุจักร กรุงเทพมหานคร',
      salary: '400 บาท/วัน',
      status: 'ปิดรับสมัคร',
      contact: 'xxx-xxx-xxxx'
    }
  ];

  return (
    <div className="companies-page">
      <div className="companies-container">
        <div className="companies-header">
          <h1 className="companies-title">บริษัททั้งหมด</h1>
          <p className="companies-subtitle">ค้นหาตำแหน่งงานฝึกงานที่เหมาะกับคุณ</p>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="ค้นหาบริษัท..."
            className="search-input"
          />
          <button className="search-button">ค้นหา</button>
        </div>

        <div className="companies-grid">
          {companies.map((company) => (
            <div key={company.id} className="company-card">
              <div className="company-header">
                <h3 className="company-name">{company.name}</h3>
                <span className={`status ${company.status === 'เปิดรับสมัคร' ? 'open' : 'closed'}`}>
                  {company.status}
                </span>
              </div>
              
              <div className="company-details">
                <h4 className="position">{company.position}</h4>
                <p className="location">📍 {company.location}</p>
                <p className="salary">💰 {company.salary}</p>
                <p className="contact">📞 {company.contact}</p>
              </div>
              
              <div className="company-actions">
                {company.status === 'เปิดรับสมัคร' ? (
                  <button className="apply-button">สมัครงาน</button>
                ) : (
                  <button className="apply-button disabled" disabled>
                    ปิดรับสมัคร
                  </button>
                )}
                <button className="contact-button">ติดต่อ</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Companies;