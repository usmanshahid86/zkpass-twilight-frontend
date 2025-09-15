/**
 * Self Protocol Verification Component with Real SDK Integration
 * Following the quickstart guide: https://docs.self.xyz/use-self/quickstart
 */

import React, { useState, useEffect } from 'react';
import { getUniversalLink, countries } from "@selfxyz/core";
import { SelfQRcodeWrapper, SelfAppBuilder, type SelfApp } from "@selfxyz/qrcode";
import { v4 as uuidv4 } from 'uuid';
import type { Country3LetterCode } from "@selfxyz/common"; // or the package where the enum lives
import type { SelfAppDisclosureConfig } from "@selfxyz/common";
// Environment configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APP_NAME = import.meta.env.VITE_SELF_APP_NAME || "Twilight Self Passport";
const SCOPE = import.meta.env.VITE_SELF_SCOPE || "twilight-relayer-passport";


// interface DisclosureConfig {
//   ofac: boolean;
//   excludedCountries: Country3LetterCode[];
//   nationality: boolean;
//   gender: boolean;
//   date_of_birth: boolean;
//   passport_number: boolean;
//   expiry_date: boolean;
//   issuing_state: boolean;
//   name: boolean;
// }

/** Build excludedCountries from a single allowlist JSON in .env */
// export function buildExcludedCountriesFromEnv(): Country3LetterCode[] {
//   const raw = import.meta.env.VITE_SELF_APAC_ALLOWED;
//   if (!raw) throw new Error("VITE_SELF_APAC_ALLOWED is missing");

//   let allowedParsed: unknown;
//   try {
//     allowedParsed = JSON.parse(raw);
//   } catch (e) {
//     throw new Error("VITE_SELF_APAC_ALLOWED is not valid JSON");
//   }

//   if (
//     !Array.isArray(allowedParsed) ||
//     !allowedParsed.every((x) => typeof x === "string")
//   ) {
//     throw new Error(
//       "VITE_SELF_APAC_ALLOWED must be a JSON array of ISO-3 strings"
//     );
//   }

//   const allSelfCodes = Object.values(countries) as Country3LetterCode[];
//   // Build a typed allow set, and ignore any codes not present in Self's countries
//   const allowedSet = new Set<Country3LetterCode>();
//   for (const code of allowedParsed as string[]) {
//     if ((allSelfCodes as readonly string[]).includes(code)) {
//       allowedSet.add(code as Country3LetterCode);
//     } else {
//       console.warn(
//         `[Self] Ignoring unsupported ISO-3 code in VITE_SELF_APAC_ALLOWED: ${code}`
//       );
//     }
//   }

//   // Everything NOT allowed becomes excluded (typed as Country3LetterCode)
//   return allSelfCodes.filter((code) => !allowedSet.has(code));
// }

// Hardcoded cosmos address for testing
const TEST_COSMOS_ADDRESS = "twilight1zyxwvut7cglh3gm0dtq2gxv76xcf54knh2kj11";
  
interface VerificationResult {
  verified: boolean;
  timestamp: number;
  source: string;
}

interface SelfVerificationProps {
  onVerificationComplete: (result: VerificationResult) => void;
}

interface VerificationStatus {
  status: 'idle' | 'loading' | 'opened' | 'success' | 'error';
  message: string;
  details?: string;
}

//const excludedCountries = buildExcludedCountriesFromEnv();
//console.log("🌍 Excluded Countries:", excludedCountries);

// function to fetch the disclosure config from the backend
const fetchDisclosureConfig = async (): Promise<SelfAppDisclosureConfig> => {
  try {
    const response = await fetch(`${BACKEND_URL}/disclosures`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Backend server responded with status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Raw response from backend for disclosure config:", data);
    // Validate the response structure
    if (!data.data || data.status !== "success") {
      throw new Error("Invalid response format from server");
    }

    const config = data.data as SelfAppDisclosureConfig;
    console.log("✅ Parsed disclosure config:", config);

    return config;
  } catch (error) {
    console.error("❌ Failed to fetch disclosure config:", error);
    throw error;
  }
}


export const SelfVerificationComponent: React.FC<SelfVerificationProps> = ({ onVerificationComplete }) => {
  
  // State management
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState<string>("");
  const [userId] = useState(uuidv4());
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      status: "idle",
      message: "Ready to start verification",
    });

  // New state for tracking verification steps
  const [verificationSteps, setVerificationSteps] = useState({
    sdkInitialized: false,
    backendConnected: false,
    appScanned: false,
    proofProvided: false,
    backendVerified: false,
  });

  // Add a new state to track verification completion
  const [isVerified, setIsVerified] = useState(false);
  // get Config from the backend 
  const [disclosureConfig, setDisclosureConfig] = useState<SelfAppDisclosureConfig | null>(null);


  // Initialize Self Protocol on component mount
  useEffect(() => {
    initializeSelfProtocol();
    testBackendConnection();
  }, []);

  // Initialize Self Protocol
  // This function initializes the Self Protocol and sets up the Self App

  const initializeSelfProtocol = async () => {
    try {
      console.log(
        "🚀 Initializing Self Protocol with connection to Self App..."
      );
       // Fetch disclosures first
      const config = await fetchDisclosureConfig();
      setDisclosureConfig(config);
      //console.log('Using disclosure config:', disclosureConfig);

      const selfAppBuilder = new SelfAppBuilder({
        version: 2,
        appName: APP_NAME,
        scope: SCOPE,
        endpoint: `${BACKEND_URL}/api/verify`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // add Twilight logo here later. This will be displayed in the Self App.in the self app
        userId: userId,
        endpointType: "staging_https",
        userIdType: "uuid",
        userDefinedData: TEST_COSMOS_ADDRESS,
         // Fetch disclosures first
        disclosures: config,
        // disclosures: {
        //   // 1. what you want to verify from users' identity
        //   // minimumAge: 18,
        //   ofac: false,
        //   excludedCountries: excludedCountries,

        //   // 2. what you want users to reveal (Optional)
        //   nationality: false,
        //   gender: false,
        //   date_of_birth: false,
        //   passport_number: false,
        //   expiry_date: true,
        //   issuing_state: true,
        //   name: false,
        // },
        devMode: true,
      });


      const app = selfAppBuilder.build();
      setSelfApp(app);

      // Update verification step
      setVerificationSteps((prev) => ({ ...prev, sdkInitialized: true }));

      const link = getUniversalLink(app);
      setUniversalLink(link);

      console.log("✅ Self Protocol initialized successfully");
      console.log("🔗 Universal Link:", link);
      console.log("👤 User ID:", userId);
    } catch (error) {
      console.error("❌ Failed to initialize Self app:", error);
      setVerificationStatus({
        status: "error",
        message: "❌ Failed to initialize Self Protocol",
      });
    }
  };

  const testBackendConnection = async () => {
    try {
      console.log("🔍 Testing backend connectivity...", BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/health`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend server connected:", data);
        setVerificationSteps((prev) => ({ ...prev, backendConnected: true }));
      } else {
        throw new Error(
          `Backend server responded with status: ${response.status}`
        );
      }
    } catch (error) {
      console.warn("⚠️ Backend server not reachable:", error);
      console.warn("⚠️ Attempted URL:", `${BACKEND_URL}/health`);
    }
  };

  const handleSuccessfulVerification = async () => {
    console.log("🎉 Verification successful!");
    // Set verification flag
    setIsVerified(true);
    // Hide the QR code component
    setSelfApp(null);
    // Update all remaining verification steps
    setVerificationSteps((prev) => ({
      ...prev,
      appScanned: true, // Add this line to fix the scan status
      proofProvided: true,
      backendVerified: true,
    }));

    setVerificationStatus({
      status: "success",
      message: "🎉 Identity verification completed successfully!",
    });

    // try {
    //   console.log("📤 Sending verification data to backend...", {
    //     cosmosAddress: TEST_COSMOS_ADDRESS,
    //     attestationId: userId,
    //   });

    //   const response = await fetch(`${BACKEND_URL}/api/verify/self`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       cosmosAddress: TEST_COSMOS_ADDRESS,
    //       uuid: userId,
    //     }),
    //   });

    //   // display the response to the console
    //   console.log(
    //     "📤 Raw Response from Server for CosmosAddress communication:",
    //     response
    //   );

    //   // Parse and log the response data
    //   const responseData = await response.json();
    //   console.log("📤 Response Data:", {
    //     status: responseData.status,
    //     message: responseData.message,
    //     savedData: responseData.data,
    //     timestamp: new Date(responseData.timestamp).toLocaleString(),
    //   });
    //   // Identity proof verification is working fine. We need to save the data on the backend server.
    //   if (!response.ok) {
    //     throw new Error(
    //       responseData.message ||
    //         "Failed to save verification data on Backend server. Retry sending the cosmos address and uuid data"
    //     );
    //   }

    //   // Notify parent component
    //   onVerificationComplete({
    //     verified: true,
    //     timestamp: Date.now(),
    //     source: "self-protocol",
    //   });
    // } catch (error) {
    //   // Sending Self Protocol Verification data to Backend server failed. The Identity verification is working fine.No need to do it again.
    //   // Send a notification to the user or retry sending the data to the backend server.

    //   console.error("❌ Sending Self Protocol Verification data to Backend server failed", error);

    //   setVerificationStatus({
    //     status: "error",
    //     message: "❌ Sending Self Protocol Verification data to Backend server failed",
    //     details:
    //       error instanceof Error ? error.message : "Unknown error occurred",
    //   });
    // }
  };

  const handleVerificationError = (error: unknown) => {
    console.error("❌ Verification failed", error);

    let errorDetails = "Unknown error occurred";

    if (error instanceof Error) {
      errorDetails = error.message;
    } else if (typeof error === "string") {
      errorDetails = error;
    } else if (error && typeof error === "object" && "message" in error) {
      errorDetails = String(error.message);
    }

    setVerificationStatus({
      status: "error",
      message: "❌ Verification succeeded but failed to save data",
      details: errorDetails,
    });
  };

  const handleRetry = () => {
    setVerificationStatus({
      status: "idle",
      message: "Ready to start verification",
    });
    initializeSelfProtocol();
  };

  const openSelfApp = () => {
    if (universalLink) {
      console.log("📱 Opening Self app with universal link:", universalLink);
      window.open(universalLink, "_blank");
      setVerificationStatus({
        status: "opened",
        message: "📱 Self app opened - complete verification there",
      });

      // Update verification step for app scan
      setVerificationSteps((prev) => ({ ...prev, appScanned: true }));
    }
  };

  // Function to get step status class
  const getStepClass = (completed: boolean) =>
    completed ? "completed" : "pending";
  const getStepIcon = (completed: boolean) => (completed ? "✅" : "⏳");

  return (
    <div className="self-verification-container">
      <h3>🛡️ Self Protocol Identity Verification</h3>

      {/* QR Code Section */}
      <div className="qr-section">
        {verificationStatus.status === "error" ? (
          <div className="verification-error">
            <h4>{verificationStatus.message}</h4>
            {verificationStatus.details && (
              <p className="error-details">{verificationStatus.details}</p>
            )}
            <button className="retry-button" onClick={handleRetry}>
              🔄 Try Again
            </button>
          </div>
        ) : isVerified ? (
          <div className="verification-success">
            <h4>✅ Verification Complete</h4>
            <p>Your identity has been successfully verified!</p>
          </div>
        ) : selfApp ? (
          <div className="qr-display">
            <h4>📱 Scan QR Code with Self App</h4>
            <div className="qr-container">
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

      {/* Wrap both sections in a container */}
      <div className="info-sections-container">
        {/* Configuration Info */}
        <div className="config-info">
          <h4>Self Protocol Configuration:</h4>
          <ul>
            <li>✅ App Name: "Twilight Self Passport"</li>
            <li>✅ Scope: "twilight-relayer-passport"</li>
            <li>✅ User Data: {TEST_COSMOS_ADDRESS}</li>
            <li>✅ Disclosures: issuing_state, expiry_date</li>
            <li>✅ OFAC: false</li>
            <li>✅ Excluded Countries: IRN, PRK, CUB, SYR</li>
            <li>👤 User ID: {userId.substring(0, 10)}...</li>
          </ul>
        </div>

        {/* Process Info */}
        <div className="process-info">
          <h4>🔄 Verification Process:</h4>
          <ol>
            <li className={getStepClass(verificationSteps.sdkInitialized)}>
              {getStepIcon(verificationSteps.sdkInitialized)} Self Protocol App
              initialized
            </li>
            <li className={getStepClass(verificationSteps.backendConnected)}>
              {getStepIcon(verificationSteps.backendConnected)} Verification
              server connected
            </li>
            <li className={getStepClass(verificationSteps.appScanned)}>
              {getStepIcon(verificationSteps.appScanned)} Self app scan
              completed
            </li>
            <li className={getStepClass(verificationSteps.proofProvided)}>
              {getStepIcon(verificationSteps.proofProvided)} User provided
              identity proof
            </li>
            <li className={getStepClass(verificationSteps.backendVerified)}>
              {getStepIcon(verificationSteps.backendVerified)} Identity proof
              verified
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export const SelfVerification = SelfVerificationComponent;
export default SelfVerification;
