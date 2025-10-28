import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-cyan-300 to-cyan-900 text-white p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="relative w-48 h-48 mx-auto mb-8 overflow-hidden rounded-full shadow-xl">
          <img
            src="/logo.png"
            alt="NextU Empower Logo"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/200?text=NextU+Empower";
            }}
          />
        </div>
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Career Preference Tests
        </h1>
        <p className="text-lg font-medium mb-8 max-w-md mx-auto drop-shadow-md">
          Discover your ideal career path through comprehensive assessment tests designed to guide your future!
        </p>

        <div className="space-y-6">
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
          >
            Start Your Assessment
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Assessment</h3>
              <p className="text-sm opacity-90">Multi-dimensional evaluation covering aptitude, interests, personality, and academic performance</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Stream Recommendations</h3>
              <p className="text-sm opacity-90">Get personalized recommendations for Science, Commerce, or Arts streams based on your profile</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Guidance</h3>
              <p className="text-sm opacity-90">Receive detailed guidance, study strategies, and career pathways tailored to your results</p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-sm font-semibold text-white drop-shadow-md">
          Powered by <span className="text-yellow-300 italic">NextU Empower</span>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
