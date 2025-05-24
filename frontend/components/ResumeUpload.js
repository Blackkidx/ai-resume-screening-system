import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <h2>AI Resume Screening System</h2>
      <input 
        type="file" 
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])} 
      />
      <button onClick={handleUpload}>Upload Resume</button>
    </div>
  );
}

export default ResumeUpload;