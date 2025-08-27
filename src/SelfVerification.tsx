/**
 * Self Protocol Verification Component
 * Following quickstart guide: https://docs.self.xyz/use-self/quickstart
 */

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

interface SelfVerificationProps {
  onVerificationComplete: (result: any) => void;
}

export const SelfVerification: React.FC<SelfVerificationProps> = ({ 
  onVerificationComplete 
}) => {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.ZeroAddress);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: string;
    message: string;
  }>({ status: 'initializing', message: 'Initializing Self Protocol...' });
  const [backendConnected, setBackendConnected] = useState(false);

  // Backend endpoint - will point to your existing backend
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "https://8a411aa5bc01.ngrok-free.app";

  useEffect(() => {
    initializeSelfProtocol();
    testBackendConnection();
  }, []);

  const initializeSelfProtocol = async () => {
    try {
      console.log('🚀 Initializing Self Protocol with real SDK...');
      
      // Create the SelfApp with exact configuration from quickstart guide
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Twilight Self Passport",
        scope: "twilight-relayer-passport",
        endpoint: `${BACKEND_URL}/api/verify`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: "Bonjour Cannes!",
        disclosures: {
          /* 1. what you want to verify from users' identity */
          minimumAge: 18,
          // ofac: false,
          // excludedCountries: [countries.BELGIUM],

          /* 2. what you want users to reveal */
          // name: false,
          // issuing_state: true,
          nationality: true,
          // date_of_birth: true,
          // passport_number: false,
          gender: true,
          // expiry_date: false,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
      
      console.log('✅ Self app initialized successfully:', {
        appName: "Twilight Self Passport",
        scope: "twilight-relayer-passport",
        userId: userId,
        endpoint: `${BACKEND_URL}/api/verify`,
      });

      setVerificationStatus({
        status: 'ready',
        message: '✅ Self Protocol ready - Scan QR code or open Self app'
      });

    } catch (error) {
      console.error("❌ Failed to initialize Self app:", error);
      setVerificationStatus({
        status: 'error',
        message: '❌ Failed to initialize Self Protocol'
      });
    }
  };

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connectivity...');
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend server is running:', data);
        setBackendConnected(true);
      } else {
        throw new Error(`Backend server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Backend server not reachable:', error);
      setBackendConnected(false);
    }
  };

  const handleSuccessfulVerification = () => {
    console.log("🎉 Verification successful!");
    setVerificationStatus({
      status: 'success',
      message: '🎉 Identity verification completed successfully!'
    });
    
    // Notify parent component
    onVerificationComplete({
      verified: true,
      timestamp: Date.now(),
      source: 'self-protocol'
    });
  };

  const handleVerificationError = () => {
    console.error("❌ Verification failed");
    setVerificationStatus({
      status: 'error',
      message: '❌ Identity verification failed'
    });
  };

  const openSelfApp = () => {
    if (universalLink) {
      console.log('📱 Opening Self app with universal link:', universalLink);
      window.open(universalLink, "_blank");
      setVerificationStatus({
        status: 'opened',
        message: '📱 Self app opened - complete verification there'
      });
    }
  };

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app</p>
      
      {/* Backend Connection Status */}
      <div className="backend-status">
        <div className={`status-indicator ${backendConnected ? 'connected' : 'disconnected'}`}></div>
        <span>
          {backendConnected 
            ? `✅ Backend connected (${BACKEND_URL})`
            : `❌ Backend disconnected (${BACKEND_URL})`
          }
        </span>
      </div>

      {/* QR Code Section */}
      <div className="qr-code-container">
        {selfApp ? (
          <div className="qr-code-display">
            <div className="qr-code-wrapper">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccessfulVerification}
                onError={handleVerificationError}
              />
            </div>
            <p className="qr-help-text">
              📱 Scan with the Self app on your mobile device
            </p>
          </div>
        ) : (
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Generating Self Protocol QR Code...</p>
          </div>
        )}
      </div>

      {/* Universal Link Section */}
      <div className="universal-link-section">
        <button 
          className="open-app-button"
          onClick={openSelfApp}
          disabled={!universalLink}
        >
          📱 Open Self App
        </button>
      </div>

      {/* Verification Status */}
      <div className="verification-status">
        <div className={`status-indicator ${verificationStatus.status}`}></div>
        <span>{verificationStatus.message}</span>
      </div>

      {/* Configuration Info - Your preferred way to show what's happening */}
      <div className="config-info">
        <h4>Self Protocol Configuration:</h4>
        <ul>
          <li>✅ App Name: "Self Workshop"</li>
          <li>✅ Scope: "self-workshop"</li>
          <li>✅ User Data: "Bonjour Cannes!"</li>
          <li>✅ Min Age: 18</li>
          <li>✅ Disclosures: nationality, gender</li>
          <li>🔗 Backend: {BACKEND_URL}/api/verify</li>
          <li>📋 Supported IDs: 1 (Passport), 2 (EU ID Card)</li>
          <li>👤 User ID: {userId.substring(0, 10)}...</li>
        </ul>
      </div>

      {/* Real-time Process Information */}
      <div className="process-info">
        <h4>🔄 Verification Process:</h4>
        <ol>
          <li className={selfApp ? 'completed' : 'pending'}>
            {selfApp ? '✅' : '🔄'} Self Protocol SDK initialized
          </li>
          <li className={backendConnected ? 'completed' : 'pending'}>
            {backendConnected ? '✅' : '🔄'} Backend server connected
          </li>
          <li className="pending">
            ⏳ Waiting for Self app scan
          </li>
          <li className="pending">
            ⏳ User provides identity proof
          </li>
          <li className="pending">
            ⏳ Backend verifies zero-knowledge proof
          </li>
          <li className="pending">
            ⏳ Verification result returned
          </li>
        </ol>
      </div>
    </div>
  );
};
