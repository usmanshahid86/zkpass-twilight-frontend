/**
 * Self Protocol Verification Component with Real SDK Integration
 * Following the quickstart guide: https://docs.self.xyz/use-self/quickstart
 */

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import { SelfQRcodeWrapper, SelfAppBuilder, type SelfApp } from "@selfxyz/qrcode";
import { ethers } from "ethers";

interface VerificationResult {
  verified: boolean;
  timestamp: number;
  source: string;
}

interface SelfVerificationProps {
  onVerificationComplete: (result: VerificationResult) => void;
}

export const SelfVerificationComponent: React.FC<SelfVerificationProps> = ({ onVerificationComplete }) => {
  // Environment configuration
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "https://5a80ea2fef72.ngrok-free.app";
  const APP_NAME = import.meta.env.VITE_SELF_APP_NAME || 'Twilight Self Passport';
  const SCOPE = import.meta.env.VITE_SELF_SCOPE || 'twilight-relayer-passport';
  
  // State management
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState<string>('');
  const [userId, setUserId] = useState(ethers.ZeroAddress);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: 'idle' | 'loading' | 'opened' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: 'Ready to start verification' });

  // New state for tracking verification steps
  const [verificationSteps, setVerificationSteps] = useState({
    sdkInitialized: false,
    backendConnected: false,
    appScanned: false,
    proofProvided: false,
    backendVerified: false,
    resultReturned: false
  });

  // Initialize Self Protocol on component mount
  useEffect(() => {
    initializeSelfProtocol();
    testBackendConnection();
  }, []);

  
  // Initialize Self Protocol
  // This function initializes the Self Protocol and sets up the Self App

  const initializeSelfProtocol = async () => {
    try {
      console.log('🚀 Initializing Self Protocol with connection to Self App...');
      
      const selfAppBuilder = new SelfAppBuilder({
        version: 2,
        appName: APP_NAME,
        scope: SCOPE,
        endpoint: `${BACKEND_URL}/api/verify`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // add Twilight logo here later. This will be displayed in the Self App.in the self app
        userId: userId,
        endpointType: "staging_https",
        userIdType: "uuid",
        userDefinedData: "Bonjour Cannes!",
        disclosures: {
          // 1. what you want to verify from users' identity
          minimumAge: 18,
          // ofac: false,
          // excludedCountries: [countries.BELGIUM],

          // 2. what you want users to reveal (Optional)
          nationality: true,
          gender: true,
          // date_of_birth: true,
          // passport_number: false,
          // expiry_date: false,
          // issuing_state: true,
          // name: false,
        },
      });

  

      const app = selfAppBuilder.build();
      setSelfApp(app);
      
      // Update verification step
      setVerificationSteps(prev => ({ ...prev, sdkInitialized: true }));

      // Generate universal link and user ID
      const wallet = ethers.Wallet.createRandom();
      const userIdHex = wallet.address;
      setUserId(userIdHex);
      
      const link = getUniversalLink(app);
      setUniversalLink(link);
      
      console.log('✅ Self Protocol initialized successfully');
      console.log('🔗 Universal Link:', link);
      console.log('👤 User ID:', userIdHex);
      
    } catch (error) {
      console.error('❌ Failed to initialize Self app:', error);
      setVerificationStatus({
        status: 'error',
        message: '❌ Failed to initialize Self Protocol'
      });
    }
  };

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connectivity...');
      const response = await fetch(`${BACKEND_URL}/health`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'  // This bypasses the ngrok warning
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend server connected:', data);
        
        // Update verification step
        setVerificationSteps(prev => ({ ...prev, backendConnected: true }));
      } else {
        throw new Error(`Backend server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Backend server not reachable:', error);
    }
  };

  const handleSuccessfulVerification = () => {
    console.log("🎉 Verification successful!");
    
    // Update all remaining verification steps
    setVerificationSteps(prev => ({
      ...prev,
      proofProvided: true,
      backendVerified: true,
      resultReturned: true
    }));
    
    setVerificationStatus({
      status: 'success',
      message: '🎉 Identity verification completed successfully!'
    });
    
    // Hide the QR code component to prevent React errors
    setSelfApp(null);
    
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
      
      // Update verification step
      setVerificationSteps(prev => ({ ...prev, appScanned: true }));
    }
  };

  // Function to get step status class
  const getStepClass = (completed: boolean) => completed ? 'completed' : 'pending';
  const getStepIcon = (completed: boolean) => completed ? '✅' : '⏳';

  return (
    <div className="self-verification-container">
      <h3>🛡️ Self Protocol Identity Verification</h3>
      
      {/* QR Code Section */}
      <div className="qr-section">
        {selfApp ? (
          <div className="qr-display">
            <h4>📱 Scan QR Code with Self App</h4>
            <div className="qr-container">
              <SelfQRcodeWrapper
                selfApp={selfApp}
               // userId={userId}
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

      {/* Wrap both sections in a container */}
      <div className="info-sections-container">
        {/* Configuration Info */}
        <div className="config-info">
          <h4>Self Protocol Configuration:</h4>
          <ul>
            <li>✅ App Name: "Twilight Self Passport"</li>
            <li>✅ Scope: "twilight-relayer-passport"</li>
            <li>✅ User Data: "Bonjour Cannes!"</li>
            <li>✅ Min Age: 18</li>
            <li>✅ Disclosures: nationality, gender</li>
            <li>🔗 Backend: {BACKEND_URL}/api/verify</li>
            <li>📋 Supported IDs: Passport, EU ID Card</li>
            <li>👤 User ID: {userId.substring(0, 10)}...</li>
          </ul>
        </div>

        {/* Process Info */}
        <div className="process-info">
          <h4>🔄 Verification Process:</h4>
          <ol>
            <li className={getStepClass(verificationSteps.sdkInitialized)}>
              {getStepIcon(verificationSteps.sdkInitialized)} Self Protocol SDK initialized
            </li>
            <li className={getStepClass(verificationSteps.backendConnected)}>
              {getStepIcon(verificationSteps.backendConnected)} Backend server connected
            </li>
            <li className={getStepClass(verificationSteps.appScanned)}>
              {getStepIcon(verificationSteps.appScanned)} Self app scan completed
            </li>
            <li className={getStepClass(verificationSteps.proofProvided)}>
              {getStepIcon(verificationSteps.proofProvided)} User provided identity proof
            </li>
            <li className={getStepClass(verificationSteps.backendVerified)}>
              {getStepIcon(verificationSteps.backendVerified)} Backend verified zero-knowledge proof
            </li>
            <li className={getStepClass(verificationSteps.resultReturned)}>
              {getStepIcon(verificationSteps.resultReturned)} Verification result returned
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export const SelfVerification = SelfVerificationComponent;
export default SelfVerification;
