import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// done reportError
export const Registration = () => {
  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [currentQualification, setCurrentQualification] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const navigate = useNavigate();

  const verifyToken = async () => {
    try {
      if (!token) {
        setErrorMessage("Please enter your access token");
        return;
      }

      const response = await fetch('/api/tokens/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Invalid token or token has already been used.");
        return;
      }

      setIsTokenVerified(true);
      localStorage.setItem("userToken", token.trim().toUpperCase());
      setErrorMessage("");
    } catch (err) {
      console.error("Token verification error:", err);
      setErrorMessage("Failed to verify token");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!name || !phoneNo || !currentQualification || !email) {
        setErrorMessage("Please fill in all the fields.");
        return;
      }

      const userToken = localStorage.getItem("userToken");
      if (!userToken) {
        setErrorMessage("No access token found. Please verify your token first.");
        return;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phoneNo,
          currentQualification,
          email,
          accessToken: userToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Registration failed.");
        return;
      }

      setErrorMessage("");
      navigate("/instructions");
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  if (!isTokenVerified) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
          backgroundSize: "cover"
        }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Token</h1>
            <p className="text-blue-100 text-sm">Enter your token to get started</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {errorMessage && (
              <div className="w-full p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your 8-character token"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-center text-lg font-mono tracking-wider"
                    maxLength="8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                onClick={verifyToken}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                Verify Token
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have a token? Contact your administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4"
      style={{
        backgroundImage: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
        backgroundSize: "cover"
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Registration</h1>
          <p className="text-blue-100 text-sm">Tell us a bit about yourself</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {errorMessage && (
            <div className="w-full p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Qualification
              </label>
              <div className="relative">
                <select
                  value={currentQualification}
                  onChange={(e) => setCurrentQualification(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">Select your qualification</option>
                  <option value="10th Grade">10th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!name || !phoneNo || !currentQualification || !email}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Complete Registration
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-cyan-600 transition-colors duration-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;