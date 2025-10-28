import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentType, setAssessmentType] = useState('regular');
  const navigate = useNavigate();

  const clearPreviousResponses = async (userToken) => {
    try {
      // Clear responses from localStorage
      localStorage.removeItem('all_test_responses');

      // Clear responses from database for this token
      const response = await fetch(`/api/responses/${userToken}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Error clearing previous responses');
      }
    } catch (err) {
      console.error('Error in clearPreviousResponses:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First check if this is a VHSC token by trying to fetch VHSC assessment data
      const vhscResponse = await fetch(`/api/reports/${token.trim().toUpperCase()}`);
      let isVHSC = false;

      if (vhscResponse.ok) {
        const vhscData = await vhscResponse.json();
        if (vhscData.assessmentType === 'vhsc') {
          isVHSC = true;
        }
      }

      // If not VHSC, verify as regular token
      if (!isVHSC) {
        const response = await fetch('/api/tokens/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: token.trim().toUpperCase() }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Invalid token. Please check your token and try again.');
          setIsLoading(false);
          return;
        }
      }

      // Store token in localStorage
      localStorage.setItem('userToken', token.trim().toUpperCase());
      localStorage.setItem('assessmentType', isVHSC ? 'vhsc' : 'regular');

      // Clear any previous responses for this token
      await clearPreviousResponses(token.trim().toUpperCase());

      // Navigate to appropriate instructions page
      if (isVHSC) {
        navigate('/vhsc-instructions');
      } else {
        navigate('/instructions');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Your Assessment
          </h1>
          <p className="text-gray-600">
            Enter your access token to start the career assessment
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Access Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="Enter your access token"
              maxLength="8"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Verifying Token...' : 'Start Assessment'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;