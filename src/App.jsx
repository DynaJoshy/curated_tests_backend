import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import LandingPage from "./components/LandingPage";
import VHSCStreamPage from "./components/VHSCStreamPage";
import VHSCRegistration from "./components/VHSCRegistration";
import VHSCInstructionsPage from "./components/VHSCInstructionsPage";
import TestPage from "./components/TestPage";
import LoginPage from "./components/LoginPage";
import AdminPage from "./components/AdminPage";
import ThankYouPage from "./components/ThankYouPage";
import InstructionsPage from "./components/InstructionsPage";
import Registration from "./components/Registration";
import CareerReport from "./components/CareerReport";
import personalityQuestions from "./data/personalityQuestions";
import intelligenceQuestions from "./data/intelligenceQuestions";
import careerQuestions from "./data/careerQuestions";
import learningQuestions from "./data/learningQuestions";
import aptitudeQuestions from "./data/aptitudeQuestions";
import academicQuestions from "./data/academicQuestions";
import contextQuestions from "./data/contextQuestions";

// Add Protected Route component
const ProtectedRoute = ({ children }) => {
  const userToken = localStorage.getItem('userToken');
  if (!userToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Add Test Flow Route component
const TestFlowRoute = ({ children }) => {
  const userToken = localStorage.getItem('userToken');
  const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
  
  if (!userToken) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasSeenInstructions) {
    return <Navigate to="/instructions" replace />;
  }
  
  return children;
};

function App() {
  const location = useLocation();
  const showNavBar = !["/", "/login", "/register"].includes(location.pathname);

  return (
    <>
      {showNavBar && <NavBar />}
      <div className={showNavBar ? "pt-20" : ""}>
        <Routes>
        <Route exact path="/" element={<LandingPage />} />
        <Route exact path="/vhsc-stream" element={<VHSCStreamPage />} />
        <Route exact path="/vhsc-register" element={<VHSCRegistration />} />
        <Route
          exact
          path="/vhsc-instructions"
          element={
            <ProtectedRoute>
              <VHSCInstructionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          exact
          path="/vhsc-aptitude"
          element={
            <TestFlowRoute>
              <TestPage
                title="Aptitude Assessment"
                questions={aptitudeQuestions.numerical.concat(
                  aptitudeQuestions.verbal,
                  aptitudeQuestions.spatial,
                  aptitudeQuestions.mechanical,
                  aptitudeQuestions.logical
                )}
                nextTest="/vhsc-academic"
                assessmentType="vhsc"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/vhsc-academic"
          element={
            <TestFlowRoute>
              <TestPage
                title="Academic Performance"
                questions={academicQuestions}
                nextTest="/vhsc-career"
                assessmentType="vhsc"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/vhsc-career"
          element={
            <TestFlowRoute>
              <TestPage
                title="Career Interests (RIASEC)"
                questions={careerQuestions}
                nextTest="/vhsc-personality"
                assessmentType="vhsc"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/vhsc-personality"
          element={
            <TestFlowRoute>
              <TestPage
                title="Personality Assessment"
                questions={personalityQuestions}
                nextTest="/vhsc-intelligences"
                assessmentType="vhsc"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/vhsc-intelligences"
          element={
            <TestFlowRoute>
              <TestPage
                title="Multiple Intelligences"
                questions={intelligenceQuestions}
                nextTest="/vhsc-context"
                assessmentType="vhsc"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/vhsc-context"
          element={
            <TestFlowRoute>
              <TestPage
                title="Contextual Factors"
                questions={contextQuestions}
                nextTest="/vhsc-report"
                assessmentType="vhsc"
              />
            </TestFlowRoute>
          }
        />
        <Route exact path="/register" element={<Registration />} />
        <Route exact path="/login" element={<LoginPage />} />
        <Route
          exact
          path="/instructions"
          element={
            <ProtectedRoute>
              <InstructionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          exact
          path="/aptitude"
          element={
            <TestFlowRoute>
              <TestPage
                title="Aptitude Assessment"
                questions={aptitudeQuestions.numerical.concat(
                  aptitudeQuestions.verbal,
                  aptitudeQuestions.spatial,
                  aptitudeQuestions.mechanical,
                  aptitudeQuestions.logical
                )}
                nextTest="/personality"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/personality"
          element={
            <TestFlowRoute>
              <TestPage
                title="Personality Test"
                questions={personalityQuestions}
                nextTest="/intelligences"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/learning"
          element={
            <TestFlowRoute>
              <TestPage
                title="Learning Styles Test"
                questions={learningQuestions}
                nextTest="/report"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/intelligences"
          element={
            <TestFlowRoute>
              <TestPage
                title="Multiple Intelligences Test"
                questions={intelligenceQuestions}
                nextTest="/career"
              />
            </TestFlowRoute>
          }
          
        />
        <Route
          exact
          path="/career"
          element={
            <TestFlowRoute>
              <TestPage
                title="Career Preference Test (RIASEC)"
                questions={careerQuestions}
                nextTest="/academic"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/academic"
          element={
            <TestFlowRoute>
              <TestPage
                title="Academic Performance"
                questions={academicQuestions}
                nextTest="/context"
              />
            </TestFlowRoute>
          }
        />
        <Route
          exact
          path="/context"
          element={
            <TestFlowRoute>
              <TestPage
                title="Contextual Factors"
                questions={contextQuestions}
                nextTest="/report"
              />
            </TestFlowRoute>
          }
        />
        <Route
          path="/report"
          element={
            <CareerReport />
          }
        />
        <Route
          path="/vhsc-report"
          element={
            <CareerReport assessmentType="vhsc" />
          }
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/thank-you"
          element={
            <ProtectedRoute>
              <ThankYouPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;