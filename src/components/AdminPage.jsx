import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchTokens();
    } else {
      setError('Invalid admin password');
    }
  };

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      const data = await response.json();
      setTokens(data);
    } catch (err) {
      console.error('Error in fetchTokens:', err);
      setError('An unexpected error occurred while fetching tokens.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewToken = async () => {
    try {
      setIsGenerating(true);
      setError('');

      const response = await fetch('/api/tokens', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate token');
      }

      const data = await response.json();
      console.log('Successfully generated token:', data);
      await fetchTokens();
    } catch (err) {
      console.error('Error in generateNewToken:', err);
      setError(`An unexpected error occurred while generating token: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to delete this token?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete token');
      }

      await fetchTokens();
    } catch (err) {
      console.error('Error in deleteToken:', err);
      setError('An unexpected error occurred while deleting token.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl mb-4">Admin Login</h2>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
              {error}
            </div>
          )}
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter admin password"
          />
          <button 
            type="submit"
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Access Token Management</h1>
        <button
          onClick={generateNewToken}
          disabled={isGenerating}
          className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate New Token'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <p>Loading tokens...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Token</th>
              <th className="p-2 text-left">Created At</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id} className="border-t">
                <td className="p-2">{token.token}</td>
                <td className="p-2">
                  {new Date(token.createdAt).toLocaleString()}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded ${
                    token.is_used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {token.is_used ? 'Used' : 'Available'}
                  </span>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => deleteToken(token.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    disabled={token.is_used}
                    title={token.is_used ? "Used tokens cannot be deleted" : "Delete token"}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPage;