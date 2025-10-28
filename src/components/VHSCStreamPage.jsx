import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VHSCStreamPage = () => {
  const navigate = useNavigate();
  const [assessmentType, setAssessmentType] = useState('general'); // 'general' or 'stream'

  const handleStartAssessment = () => {
    // Navigate to VHSC stream assessment registration
    navigate('/vhsc-register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            VHSC Stream Recommendation System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your ideal academic stream after Grade 10 with our comprehensive assessment
            focusing on Science (MLT), Science (PCM/PCB), Commerce, Arts/Humanities, and Vocational streams.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Assessment Components</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Aptitude Assessment</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Numerical Reasoning</li>
                <li>• Verbal Reasoning</li>
                <li>• Spatial Reasoning</li>
                <li>• Mechanical Reasoning</li>
                <li>• Logical/Abstract Reasoning</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Interest & Personality</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• RIASEC Career Interests</li>
                <li>• Big Five Personality Traits</li>
                <li>• Learning Styles</li>
                <li>• Multiple Intelligences</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Academic Performance</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Mathematics</li>
                <li>• Science</li>
                <li>• English</li>
                <li>• Social Science</li>
                <li>• Languages</li>
              </ul>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">Contextual Factors</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Career Awareness</li>
                <li>• Resource Access</li>
                <li>• Parental Support</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Stream Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded">
                <strong className="text-red-600">Science (MLT)</strong>
                <p className="text-gray-600">Medical Laboratory Technology</p>
              </div>
              <div className="bg-white p-3 rounded">
                <strong className="text-blue-600">Science (PCM/PCB)</strong>
                <p className="text-gray-600">Physics, Chemistry, Math/Bio</p>
              </div>
              <div className="bg-white p-3 rounded">
                <strong className="text-green-600">Commerce</strong>
                <p className="text-gray-600">Business & Finance</p>
              </div>
              <div className="bg-white p-3 rounded">
                <strong className="text-purple-600">Arts/Humanities</strong>
                <p className="text-gray-600">Social Sciences & Languages</p>
              </div>
              <div className="bg-white p-3 rounded md:col-span-2">
                <strong className="text-orange-600">Vocational/Technical</strong>
                <p className="text-gray-600">MLT & Allied Health Sciences</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartAssessment}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start VHSC Stream Assessment
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VHSCStreamPage;
