/**
 * Main App Component - Self Protocol React Frontend
 * Maintains the design flow you liked from the previous version
 */

import { useState } from 'react';
import { SelfVerification } from './components/SelfVerification';
import './App.css';

interface VerificationResult {
  verified: boolean;
  timestamp: number;
  source: string;
  attestationId?: string;  // Add this for Self Protocol verification
  cosmosAddress?: string;  // Add this to show connected address
}

function App() {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to Twilight Identity Verification');

  const handleVerificationComplete = (result: VerificationResult) => {
    setVerificationResult(result);
    setWelcomeMessage('🛡️ Identity Verified with Self Protocol!');
    
    // Show detailed success information
    console.log('🎉 Verification completed:', {
      ...result,
      timestamp: new Date(result.timestamp).toLocaleString()
    });
  };

  const handleVerifyClick = () => {
    setShowVerification(true);
  };

  const handleWelcomeClick = () => {
    if (verificationResult) {
      // Updated messages to be more specific to Self Protocol
      const verifiedMessages = [
        '🛡️ Identity Verified with Self Protocol!',
        '✨ Self Protocol Verification Complete',
        '🌟 Identity Proof Generated',
        '🔐 Zero-Knowledge Proof Verified',
        '💎 Self Protocol Member',
        '🚀 Ready for Twilight'
      ];
      
      const currentIndex = verifiedMessages.indexOf(welcomeMessage);
      const nextIndex = (currentIndex + 1) % verifiedMessages.length;
      setWelcomeMessage(verifiedMessages[nextIndex]);
    } else {
      setShowVerification(true);
    }
  };

  return (
    <div className="app-container">
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
              🛡️ Verify with Self Protocol
            </button>
          )}
          
          {verificationResult && (
            <div className="verification-badge">
              <span>✅ Identity Verified with Self Protocol</span>
              <small>Verification ID: {verificationResult.attestationId?.substring(0, 8)}...</small>
              {verificationResult.cosmosAddress && (
                <small>Cosmos Address: {verificationResult.cosmosAddress.substring(0, 8)}...</small>
              )}
              <small>Verified at: {new Date(verificationResult.timestamp).toLocaleString()}</small>
            </div>
          )}
        </div>
      </div>

      {/* Updated Features Grid */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <div className="feature-title">Self Protocol Integration</div>
          <p>Secure identity verification using Self Protocol's zero-knowledge proofs.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">Instant Verification</div>
          <p>Quick verification process with the Self Protocol mobile app.</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🌍</div>
          <div className="feature-title">Compliant Verification</div>
          <p>Supports verification from approved jurisdictions with built-in compliance checks.</p>
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
