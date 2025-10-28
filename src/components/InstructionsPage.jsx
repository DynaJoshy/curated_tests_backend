import React from 'react';
import { useNavigate } from 'react-router-dom';

const InstructionsPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // Set flag that user has seen instructions
    localStorage.setItem('hasSeenInstructions', 'true');
    // Navigate to first test based on assessment type
    const assessmentType = localStorage.getItem('assessmentType') || 'general';
    if (assessmentType === 'vhsc') {
      navigate('/vhsc-aptitude');
    } else {
      navigate('/aptitude');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Instructions</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Before You Begin</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You will be taking 4 different tests: Personality, Multiple Intelligences, Career Preferences, and Learning Styles.</li>
          <li>Each test consists of multiple questions with different options.</li>
          <li>Please answer all questions honestly for the most accurate results.</li>
          <li>You can change your answers before submitting each test.</li>
          <li>Once you complete all tests, you will receive a comprehensive analysis.</li>
          <li>Make sure to complete all tests in one go</li>
          <li>The question Grid : Grey is for unattempted questions, Green is for attempted questions</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Flow</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Personality Test - Understanding your personality traits</li>
          <li>Multiple Intelligences Test - Discovering your learning strengths</li>
          <li>Career Preferences Test - Identifying your career interests</li>
          <li>Learning Styles Test - Understanding how you learn best</li>
        </ol>
      </div>

      <div className="text-center">
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Start Tests
        </button>
      </div>
    </div>
  );
};

export default InstructionsPage;