import React, { useState } from 'react';
import ClaimForm from './components/ClaimForm';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<'claimant' | 'adjuster'>('claimant');

  return (
    <div className="app-container">
      <header className="header">
        <h1>TrustScore API</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Next-Generation Fraud Detection & Processing</p>
        
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'claimant' ? 'active' : ''}`}
            onClick={() => setActiveTab('claimant')}
          >
            Claimant Portal
          </button>
          <button 
            className={`tab-btn ${activeTab === 'adjuster' ? 'active' : ''}`}
            onClick={() => setActiveTab('adjuster')}
          >
            Adjuster Dashboard
          </button>
        </div>
      </header>
      
      <div className="tab-content">
        {activeTab === 'claimant' ? <ClaimForm /> : <Dashboard />}
      </div>
    </div>
  );
}

export default App;
