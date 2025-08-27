/**
 * Main App Component - Self Protocol React Frontend
 * Maintains the design flow you liked from the previous version
 */

import React, { useState } from 'react';
import { SelfVerification } from './components/SelfVerification';
import './App.css';

interface VerificationResult {
  verified: boolean;
  timestamp: number;
  source: string;
  result?: any;
}

function App() {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome');

  const handleVerificationComplete = (result: VerificationResult) => {
    setVerificationResult(result);
    setWelcomeMessage('🛡️ Welcome, Verified User!');
    
    // Show success notification
    console.log('🎉 Verification completed:', result);
  };

  const handleVerifyClick = () => {
    setShowVerification(true);
  };

  const handleWelcomeClick = () => {
    if (verificationResult) {
      // Cycle through verified messages
      const verifiedMessages = [
        '🛡️ Welcome, Verified User!',
        '✨ Self Protocol Verified!',
        '🌟 Identity Confirmed!',
        '🚀 Proof Generated!',
        '💎 Verified Member!',
        '🔐 Zero-Knowledge Verified!'
      ];
      
      const currentIndex = verifiedMessages.indexOf(welcomeMessage);
      const nextIndex = (currentIndex + 1) % verifiedMessages.length;
      setWelcomeMessage(verifiedMessages[nextIndex]);
    } else {
      // Show verification if not verified
      setShowVerification(true);
    }
  };

  return (
    <div className="app-container">
      {/* Hero Section - Same design you liked */}
      <div className="hero-section">
        <div className="welcome-container">
          <h1 
            className={`welcome-message ${verificationResult ? 'verified' : ''}`}
            onClick={handleWelcomeClick}
          >
            {welcomeMessage}
          </h1>
          <p className="subtitle">
            Secure identity verification powered by Self Protocol
          </p>
          {!showVerification && (
            <button className="verify-button" onClick={handleVerifyClick}>
              🛡️ Verify Identity
            </button>
          )}
          
          {verificationResult && (
            <div className="verification-badge">
              <span>✅ Identity Verified</span>
              <small>Click welcome message for more</small>
            </div>
          )}
        </div>
      </div>

      {/* Features Grid - Same as before */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <div className="feature-title">Zero-Knowledge Proofs</div>
          <p>Your personal data stays private. We only verify what's necessary without seeing your raw documents.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">Instant Verification</div>
          <p>Get verified in seconds using your government-issued documents through the Self app.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🌍</div>
          <div className="feature-title">Global Support</div>
          <p>Works with passports and identity documents from countries worldwide.</p>
        </div>
      </div>

      {/* Self Protocol Verification Section */}
      {showVerification && (
        <div className="verification-section">
          <SelfVerification onVerificationComplete={handleVerificationComplete} />
        </div>
      )}
    </div>
  );
}

export default App;
