import React from 'react';
import { useNavigate } from 'react-router-dom';

const VHSCInstructionsPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    localStorage.setItem('hasSeenInstructions', 'true');
    navigate('/vhsc-aptitude');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              VHSC Stream Assessment Instructions
            </h1>
            <p className="text-lg text-gray-600">
              Please read these instructions carefully before starting your assessment
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Assessment Overview</h2>
              <p className="text-blue-700">
                This assessment consists of 6 sections designed to evaluate your aptitude, interests,
                academic performance, personality, and contextual factors to recommend the most suitable
                academic stream after Grade 10.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Sections</h3>
                <ol className="list-decimal list-inside space-y-2 text-green-700">
                  <li>Aptitude Test (5 categories)</li>
                  <li>Academic Performance</li>
                  <li>Career Interests (RIASEC)</li>
                  <li>Personality Assessment</li>
                  <li>Multiple Intelligences</li>
                  <li>Contextual Factors</li>
                </ol>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Time Estimate</h3>
                <ul className="space-y-2 text-purple-700">
                  <li>• Aptitude: 15-20 minutes</li>
                  <li>• Academic: 5 minutes</li>
                  <li>• Interests: 10 minutes</li>
                  <li>• Personality: 10 minutes</li>
                  <li>• Intelligences: 15 minutes</li>
                  <li>• Context: 5 minutes</li>
                  <li><strong>Total: ~60 minutes</strong></li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Important Guidelines</h3>
              <ul className="space-y-2 text-yellow-700">
                <li>• Answer honestly - there are no right or wrong answers</li>
                <li>• Take your time to think about each question</li>
                <li>• Complete all sections for accurate recommendations</li>
                <li>• You can pause and resume if needed</li>
                <li>• Your responses are confidential and secure</li>
              </ul>
            </div>

            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Stream Recommendations</h3>
              <p className="text-red-700 mb-3">
                Based on your assessment, you'll receive recommendations for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded text-center">
                  <strong className="text-red-600">Science (MLT)</strong>
                  <p className="text-sm text-gray-600">Medical Laboratory Technology</p>
                </div>
                <div className="bg-white p-3 rounded text-center">
                  <strong className="text-blue-600">Science (PCM/PCB)</strong>
                  <p className="text-sm text-gray-600">Physics, Chemistry, Math/Bio</p>
                </div>
                <div className="bg-white p-3 rounded text-center">
                  <strong className="text-green-600">Commerce</strong>
                  <p className="text-sm text-gray-600">Business & Finance</p>
                </div>
                <div className="bg-white p-3 rounded text-center">
                  <strong className="text-purple-600">Arts/Humanities</strong>
                  <p className="text-sm text-gray-600">Social Sciences & Languages</p>
                </div>
                <div className="bg-white p-3 rounded text-center md:col-span-2">
                  <strong className="text-orange-600">Vocational/Technical</strong>
                  <p className="text-sm text-gray-600">MLT & Allied Health Sciences</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStart}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start VHSC Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VHSCInstructionsPage;
