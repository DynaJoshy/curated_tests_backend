import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import aptitudeQuestions from '../data/aptitudeQuestions.jsx';

const CareerReport = ({ assessmentType }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

  const validateToken = async () => {
    if (!accessToken.trim()) {
      setError('Please enter an access token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First validate the token exists
      const response = await fetch(`/api/reports/${accessToken.trim()}`);
      if (!response.ok) {
        throw new Error('Invalid access token or no assessment found');
      }

      const assessmentData = await response.json();

      // Check if it's a VHSC assessment
      if (assessmentData.assessmentType === 'vhsc') {
        // Fetch the original responses to get selected options
        const responsesResponse = await fetch(`/api/responses/${accessToken.trim()}`);
        if (!responsesResponse.ok) {
          throw new Error('Failed to fetch assessment responses');
        }
        const responses = await responsesResponse.json();
        const analysis = analyzeVHSCAssessment(assessmentData.data, responses);
        setReport(analysis);
      } else {
        // Regular assessment - fetch responses
        const responsesResponse = await fetch(`/api/responses/${accessToken.trim()}`);
        if (!responsesResponse.ok) {
          throw new Error('Failed to fetch assessment responses');
        }
        const responses = await responsesResponse.json();
        const analysis = analyzeResponses(responses);
        setReport(analysis);
      }

      setTokenValidated(true);

      // Fetch user details
      try {
        const userResponse = await fetch(`/api/users/${accessToken.trim()}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserDetails(userData);
        } else {
          console.warn('Failed to fetch user details');
        }
      } catch (userErr) {
        console.warn('Error fetching user details:', userErr);
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setError(err.message || 'Failed to validate token');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (userToken) => {
    try {
      if (assessmentType === 'vhsc') {
        // Fetch VHSC assessment data
        const response = await fetch(`/api/reports/${userToken}`);
        if (!response.ok) {
          throw new Error('Failed to fetch VHSC assessment');
        }
        const assessmentData = await response.json();

        if (assessmentData.assessmentType === 'vhsc') {
          // Fetch the original responses to get selected options
          const responsesResponse = await fetch(`/api/responses/${userToken}`);
          if (!responsesResponse.ok) {
            throw new Error('Failed to fetch assessment responses');
          }
          const responses = await responsesResponse.json();
          const analysis = analyzeVHSCAssessment(assessmentData.data, responses);
          setReport(analysis);
        } else {
          throw new Error('Invalid assessment type');
        }
      } else {
        // Regular assessment - fetch responses
        const response = await fetch(`/api/responses/${userToken}`);
        if (!response.ok) {
          throw new Error('Failed to fetch responses');
        }
        const responses = await response.json();

        const analysis = analyzeResponses(responses);
        setReport(analysis);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const analyzeResponses = (responses) => {
    const sections = {};
    responses.forEach(resp => {
      sections[resp.section] = resp.answers;
    });

    // Calculate scores for all sections
    const aptitudeScores = calculateAptitudeScores(sections.aptitude || {});
    const interestScores = calculateCareerScores(sections.career || {}); // RIASEC as interest scores
    const academicPerformance = calculateAcademicScores(sections.academic || {});
    const personalityTraits = calculatePersonalityScores(sections.personality || {});
    const contextualInputs = calculateContextScores(sections.context || {});

    // Calculate composite scores with weights (handle new aptitude structure)
    const aptitudeAvg = (aptitudeScores.numerical.score + aptitudeScores.verbal.score + aptitudeScores.spatial.score + aptitudeScores.mechanical.score + aptitudeScores.logical.score) / 5;
    const compositeScores = {
      aptitude: parseFloat(aptitudeAvg.toFixed(2)),
      interest: parseFloat(((interestScores.R + interestScores.I + interestScores.A + interestScores.S + interestScores.E + interestScores.C) / 6).toFixed(2)),
      academic: parseFloat(((academicPerformance.maths + academicPerformance.science + academicPerformance.english + academicPerformance.socialScience + academicPerformance.languages) / 5).toFixed(2)),
      personality: parseFloat(((personalityTraits.openness + personalityTraits.conscientiousness + personalityTraits.extraversion + personalityTraits.agreeableness + personalityTraits.neuroticism) / 5).toFixed(2)),
      context: parseFloat(((contextualInputs.careerAwareness + contextualInputs.resourceAccess + contextualInputs.parentalSupport) / 3).toFixed(2))
    };

    // Weighted composite score (40% aptitude, 25% interest, 20% academic, 10% personality, 5% context)
    const weightedScore = parseFloat((
      compositeScores.aptitude * 0.4 +
      compositeScores.interest * 0.25 +
      compositeScores.academic * 0.2 +
      compositeScores.personality * 0.1 +
      compositeScores.context * 0.05
    ).toFixed(2));

    // Generate stream recommendations
    const streamRecommendations = generateStreamRecommendations(aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs);

    // Legacy analysis for backward compatibility
    const personalityType = analyzePersonality(sections.personality || {});
    const topIntelligences = analyzeIntelligences(sections.intelligences || {});
    const learningStyle = analyzeLearning(sections.learning || {});

    return {
      assessmentType: 'general',
      aptitudeScores,
      interestScores,
      academicPerformance,
      personalityTraits,
      contextualInputs,
      compositeScores,
      weightedScore,
      streamRecommendations,
      // Legacy fields
      careerScores: interestScores,
      personalityType,
      topIntelligences,
      learningStyle,
      recommendations: streamRecommendations // Updated to use streams
    };
  };

  const getGrade = (score) => {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 55) return 'C+';
    if (score >= 45) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  };

  // Helper function to format numbers to 2 decimal places
  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  // Helper function to determine if a field should show grades
  const shouldShowGrade = (section, field) => {
    // Only show grades for aptitude scores and academic performance
    return (section === 'aptitude' || section === 'academic');
  };

  const analyzeVHSCAssessment = (assessmentData, responses) => {
    // Extract scores from the assessment data
    const { aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs } = assessmentData;

    // Extract academic performance responses to show selected options
    const academicResponses = responses.find(r => r.section === 'vhsc-academic')?.answers || {};
    const academicPerformanceWithOptions = {};

    // Helper to resolve selected option from various possible shapes
    const getSelectedOptionForSubject = (responsesObj, subject, subjectIndex, numericScore) => {
      if (!responsesObj) return null;

      // If responses is an array-like, try index
      if (Array.isArray(responsesObj)) {
        const val = responsesObj[subjectIndex];
        if (val !== undefined && val !== null && val !== '') return val;
      }

      // If responses has subject key (case-insensitive)
      const subjectKey = Object.keys(responsesObj).find(k => k.toLowerCase() === subject.toLowerCase());
      if (subjectKey && responsesObj[subjectKey]) return responsesObj[subjectKey];

      // Try q{n} style keys (q1, q2, ...)
      const qKey = `q${subjectIndex + 1}`;
      if (responsesObj[qKey]) return responsesObj[qKey];

      // Try numeric keys as strings or numbers
      if (responsesObj[subjectIndex] !== undefined) return responsesObj[subjectIndex];
      if (responsesObj[String(subjectIndex)] !== undefined) return responsesObj[String(subjectIndex)];

      // No valid response found
      return null;
    };

    Object.keys(academicPerformance).forEach((subject, idx) => {
      const subjectIndex = idx; // index within the academicPerformance keys
      const numericScore = academicPerformance[subject];
      const selectedOption = getSelectedOptionForSubject(academicResponses, subject, subjectIndex, numericScore);
      academicPerformanceWithOptions[subject] = {
        score: numericScore,
        selectedOption: selectedOption
      };
    });

    // Generate stream recommendations based on weighted scoring
    const streamRecommendations = generateStreamRecommendations(aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs);

    return {
      assessmentType: 'vhsc',
      aptitudeScores,
      interestScores,
      academicPerformance: academicPerformanceWithOptions,
      personalityTraits,
      contextualInputs,
      streamRecommendations
    };
  };

  const calculateAptitudeScores = (answers) => {
    // Aptitude questions are categorized by type, calculate scores and correct counts
    const scores = { numerical: 0, verbal: 0, spatial: 0, mechanical: 0, logical: 0 };
    const correctCounts = { numerical: 0, verbal: 0, spatial: 0, mechanical: 0, logical: 0 };
    const totalCounts = { numerical: 0, verbal: 0, spatial: 0, mechanical: 0, logical: 0 };

    // Map question indices to aptitude types (simplified mapping)
    const aptitudeMapping = {
      // Numerical: questions 1-10
      ...Object.fromEntries(Array.from({length: 10}, (_, i) => [i, 'numerical'])),
      // Verbal: questions 11-20
      ...Object.fromEntries(Array.from({length: 10}, (_, i) => [i + 10, 'verbal'])),
      // Spatial: questions 21-30
      ...Object.fromEntries(Array.from({length: 10}, (_, i) => [i + 20, 'spatial'])),
      // Mechanical: questions 31-40
      ...Object.fromEntries(Array.from({length: 10}, (_, i) => [i + 30, 'mechanical'])),
      // Logical: questions 41-50
      ...Object.fromEntries(Array.from({length: 10}, (_, i) => [i + 40, 'logical']))
    };

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const index = parseInt(questionIndex.replace('q', '')) - 1;
      const type = aptitudeMapping[index];
      if (type) {
        // Get the correct answer from aptitudeQuestions data
        const questionType = type;
        const questionList = aptitudeQuestions[questionType];
        if (questionList && questionList[index % 10]) {
          const correctAnswer = questionList[index % 10].correct;

          // Validate answer format - ensure it's one of the expected options
          const question = questionList[index % 10];
          const validOptions = question.options || [];
          const isValidAnswer = validOptions.includes(answer);

          if (!isValidAnswer) {
            console.warn(`Invalid answer format for question ${questionIndex}: ${answer}`);
            // Skip invalid answers
            return;
          }

          totalCounts[type] += 1;

          // Check if the user's answer matches the correct answer
          if (answer === correctAnswer) {
            correctCounts[type] += 1;
            scores[type] += 100;
          }
        }
      }
    });

    // Calculate percentages and return both scores and correct counts
    const result = {};
    Object.keys(scores).forEach(type => {
      if (totalCounts[type] > 0) {
        const percentage = parseFloat((scores[type] / totalCounts[type]).toFixed(2));
        result[type] = {
          score: percentage,
          correct: correctCounts[type],
          total: totalCounts[type]
        };
      } else {
        result[type] = {
          score: 0,
          correct: 0,
          total: 0
        };
      }
    });

    return result;
  };

  const calculateCareerScores = (answers) => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Career questions use Yes/No format, map to RIASEC categories
    const riasecMapping = {
      // Realistic (R) - questions 1, 7, 9, 21, 22, 24, 30, 34, 37, 39
      0: 'R', 6: 'R', 8: 'R', 20: 'R', 21: 'R', 23: 'R', 29: 'R', 33: 'R', 36: 'R', 38: 'R',
      // Investigative (I) - questions 2, 11, 18, 20, 23, 26, 28, 35, 41
      1: 'I', 10: 'I', 17: 'I', 19: 'I', 22: 'I', 25: 'I', 27: 'I', 34: 'I', 40: 'I',
      // Artistic (A) - questions 8, 17, 25, 27, 30, 33, 43
      7: 'A', 16: 'A', 24: 'A', 26: 'A', 29: 'A', 32: 'A', 42: 'A',
      // Social (S) - questions 4, 12, 13, 15, 20, 38, 42
      3: 'S', 11: 'S', 12: 'S', 14: 'S', 19: 'S', 37: 'S', 41: 'S',
      // Enterprising (E) - questions 10, 19, 29, 31, 36, 38, 44
      9: 'E', 18: 'E', 28: 'E', 30: 'E', 35: 'E', 37: 'E', 43: 'E',
      // Conventional (C) - questions 6, 9, 17, 25, 27, 37
      5: 'C', 8: 'C', 16: 'C', 24: 'C', 26: 'C', 36: 'C'
    };

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const index = parseInt(questionIndex.replace('q', '')) - 1; // Convert q1, q2, etc. to 0, 1, etc.
      const category = riasecMapping[index];
      if (category && answer === 'Yes') {
        scores[category] += 1;
      }
    });

    return scores;
  };

  const calculateAcademicScores = (answers) => {
    // Academic questions assess performance in different subjects
    const scores = { maths: 0, science: 0, english: 0, socialScience: 0, languages: 0 };
    const counts = { maths: 0, science: 0, english: 0, socialScience: 0, languages: 0 };

    // Map question indices to subjects (simplified mapping)
    const subjectMapping = {
      // Maths: questions 1-5
      ...Object.fromEntries(Array.from({length: 5}, (_, i) => [i, 'maths'])),
      // Science: questions 6-10
      ...Object.fromEntries(Array.from({length: 5}, (_, i) => [i + 5, 'science'])),
      // English: questions 11-15
      ...Object.fromEntries(Array.from({length: 5}, (_, i) => [i + 10, 'english'])),
      // Social Science: questions 16-20
      ...Object.fromEntries(Array.from({length: 5}, (_, i) => [i + 15, 'socialScience'])),
      // Languages: questions 21-25
      ...Object.fromEntries(Array.from({length: 5}, (_, i) => [i + 20, 'languages']))
    };

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const index = parseInt(questionIndex.replace('q', '')) - 1;
      const subject = subjectMapping[index];
      if (subject) {
        // Convert grade to numerical score
        const gradeMap = { 'A+': 95, 'A': 85, 'B+': 75, 'B': 65, 'C+': 55, 'C': 45, 'D': 35, 'F': 25 };
        const score = gradeMap[answer] || 50;
        scores[subject] += score;
        counts[subject] += 1;
      }
    });

    // Calculate averages
    Object.keys(scores).forEach(subject => {
      if (counts[subject] > 0) {
        scores[subject] = parseFloat((scores[subject] / counts[subject]).toFixed(2));
      }
    });

    return scores;
  };

  const calculatePersonalityScores = (answers) => {
    // Personality traits based on Big Five model
    const scores = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
    const counts = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };

    // Simplified mapping of personality questions to traits
    const traitMapping = {
      // Openness: questions 1, 5, 9, 13, 17
      0: 'openness', 4: 'openness', 8: 'openness', 12: 'openness', 16: 'openness',
      // Conscientiousness: questions 2, 6, 10, 14, 18
      1: 'conscientiousness', 5: 'conscientiousness', 9: 'conscientiousness', 13: 'conscientiousness', 17: 'conscientiousness',
      // Extraversion: questions 3, 7, 11, 15, 19
      2: 'extraversion', 6: 'extraversion', 10: 'extraversion', 14: 'extraversion', 18: 'extraversion',
      // Agreeableness: questions 4, 8, 12, 16, 20
      3: 'agreeableness', 7: 'agreeableness', 11: 'agreeableness', 15: 'agreeableness', 19: 'agreeableness',
      // Neuroticism: questions 21, 22, 23, 24, 25 (if available)
      20: 'neuroticism', 21: 'neuroticism', 22: 'neuroticism', 23: 'neuroticism', 24: 'neuroticism'
    };

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const index = parseInt(questionIndex.replace('q', '')) - 1;
      const trait = traitMapping[index];
      if (trait) {
        // Convert Likert scale to numerical score
        const scoreMap = { 'Strongly Agree': 5, 'Agree': 4, 'Neutral': 3, 'Disagree': 2, 'Strongly Disagree': 1 };
        const score = scoreMap[answer] || 3;
        scores[trait] += score;
        counts[trait] += 1;
      }
    });

    // Calculate averages and convert to percentage
    Object.keys(scores).forEach(trait => {
      if (counts[trait] > 0) {
        scores[trait] = parseFloat(((scores[trait] / counts[trait]) * 20).toFixed(2)); // Scale to 0-100
      }
    });

    return scores;
  };

  const calculateContextScores = (answers) => {
    // Contextual factors
    const scores = { careerAwareness: 0, resourceAccess: 0, parentalSupport: 0 };
    const counts = { careerAwareness: 0, resourceAccess: 0, parentalSupport: 0 };

    // Map question indices to contextual factors
    const contextMapping = {
      // Career Awareness: questions 1, 2, 3
      0: 'careerAwareness', 1: 'careerAwareness', 2: 'careerAwareness',
      // Resource Access: questions 4, 5, 6
      3: 'resourceAccess', 4: 'resourceAccess', 5: 'resourceAccess',
      // Parental Support: questions 7, 8, 9
      6: 'parentalSupport', 7: 'parentalSupport', 8: 'parentalSupport'
    };

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const index = parseInt(questionIndex.replace('q', '')) - 1;
      const factor = contextMapping[index];
      if (factor) {
        // Convert scale to numerical score
        const scoreMap = { 'Very High': 100, 'High': 75, 'Medium': 50, 'Low': 25, 'Very Low': 0 };
        const score = scoreMap[answer] || 50;
        scores[factor] += score;
        counts[factor] += 1;
      }
    });

    // Calculate averages
    Object.keys(scores).forEach(factor => {
      if (counts[factor] > 0) {
        scores[factor] = parseFloat((scores[factor] / counts[factor]).toFixed(2));
      }
    });

    return scores;
  };

  const analyzePersonality = (answers) => {
    // Personality questions have 4 options each, map to personality types
    const personalityTypes = {
      'Values and wisdom': 'Philosopher',
      'Integrity and perfection': 'Perfectionist',
      'Work hard play hard': 'Achiever',
      'Stability and balance': 'Balanced',
      'I am comfortable dealing with conflict and helping people find middle ground. My role is the mediator.': 'Mediator',
      'I make sure everything and everyone is taken care of. My role is the protector.': 'Protector',
      'I help my family understand work ethic, hustle, and the value of having resources. My role is material support.': 'Provider',
      'I focus on nurturing and wanting a healthy and content family.': 'Nurturer',
      'Honest and smart': 'Intellectual',
      'Strong presence and power': 'Leader',
      'Fun and dynamic': 'Enthusiast',
      'Reliable and respectful': 'Loyalist',
      'Documentaries, biographies, human observation': 'Observer',
      'Entertainment, politics, current affairs': 'Challenger',
      'Comedy, sport, drama, motivational stories': 'Enthusiast',
      'Soap operas, reality TV, family, gossip, daytime shows': 'Helper',
      'Calm, composed, balanced': 'Peacemaker',
      'Irritated, frustrated, angry': 'Challenger',
      'Moody, loud, restless': 'Individualist',
      'Lazy, depressed, worried': 'Loyalist'
    };

    const counts = {};
    Object.values(answers).forEach(answer => {
      const personalityType = personalityTypes[answer];
      if (personalityType) {
        counts[personalityType] = (counts[personalityType] || 0) + 1;
      }
    });

    // Get the most common personality type
    const topTrait = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
    return topTrait || 'Balanced';
  };

  const analyzeIntelligences = (answers) => {
    // Intelligence questions use 4-point scale, map to multiple intelligences
    const intelligenceMapping = {
      // Intrapersonal (self-awareness, meditation, reflection)
      0: 'Intrapersonal', 12: 'Intrapersonal', 31: 'Intrapersonal', 64: 'Intrapersonal', 65: 'Intrapersonal', 66: 'Intrapersonal', 78: 'Intrapersonal',
      // Musical (music, rhythm, sound)
      1: 'Musical', 3: 'Musical', 13: 'Musical', 18: 'Musical', 28: 'Musical', 59: 'Musical', 60: 'Musical', 72: 'Musical', 74: 'Musical', 75: 'Musical',
      // Bodily-Kinesthetic (physical, hands-on, movement)
      2: 'Bodily-Kinesthetic', 6: 'Bodily-Kinesthetic', 15: 'Bodily-Kinesthetic', 24: 'Bodily-Kinesthetic', 38: 'Bodily-Kinesthetic', 39: 'Bodily-Kinesthetic', 43: 'Bodily-Kinesthetic', 49: 'Bodily-Kinesthetic', 56: 'Bodily-Kinesthetic', 61: 'Bodily-Kinesthetic', 73: 'Bodily-Kinesthetic',
      // Logical-Mathematical (math, logic, patterns)
      4: 'Logical-Mathematical', 11: 'Logical-Mathematical', 17: 'Logical-Mathematical', 22: 'Logical-Mathematical', 33: 'Logical-Mathematical', 36: 'Logical-Mathematical', 57: 'Logical-Mathematical', 62: 'Logical-Mathematical',
      // Linguistic (words, language, reading)
      7: 'Linguistic', 8: 'Linguistic', 9: 'Linguistic', 25: 'Linguistic', 35: 'Linguistic', 47: 'Linguistic', 68: 'Linguistic', 69: 'Linguistic',
      // Spatial (visual, images, maps)
      26: 'Spatial', 42: 'Spatial', 51: 'Spatial', 52: 'Spatial', 53: 'Spatial', 56: 'Spatial', 68: 'Spatial', 76: 'Spatial', 77: 'Spatial',
      // Interpersonal (social, people, empathy)
      19: 'Interpersonal', 20: 'Interpersonal', 27: 'Interpersonal', 40: 'Interpersonal', 53: 'Interpersonal', 67: 'Interpersonal', 70: 'Interpersonal', 71: 'Interpersonal', 72: 'Interpersonal', 78: 'Interpersonal',
      // Naturalistic (nature, environment, animals)
      21: 'Naturalistic', 32: 'Naturalistic', 43: 'Naturalistic', 44: 'Naturalistic', 45: 'Naturalistic', 46: 'Naturalistic', 47: 'Naturalistic', 54: 'Naturalistic', 79: 'Naturalistic', 80: 'Naturalistic', 81: 'Naturalistic'
    };

    const scores = {
      'Intrapersonal': 0,
      'Musical': 0,
      'Bodily-Kinesthetic': 0,
      'Logical-Mathematical': 0,
      'Linguistic': 0,
      'Spatial': 0,
      'Interpersonal': 0,
      'Naturalistic': 0
    };

    const scoreMap = {
      'Mostly Disagree': 1,
      'Slightly Disagree': 2,
      'Slightly Agree': 3,
      'Mostly Agree': 4
    };

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const index = parseInt(questionIndex.replace('q', '')) - 1;
      const intelligence = intelligenceMapping[index];
      const score = scoreMap[answer] || 2;
      
      if (intelligence) {
        scores[intelligence] += score;
      }
    });

    return Object.keys(scores).sort((a, b) => scores[b] - scores[a]).slice(0, 3);
  };

  const analyzeLearning = (answers) => {
    // Learning questions have 3 options each, map to learning styles
    const learningStyleMapping = {
      // Visual learners
      'Read the instructions manual': 'Visual',
      'Have a look at a map': 'Visual',
      'Look up a written recipe': 'Visual',
      'Start writing things down': 'Visual',
      'Have a look at how I do it': 'Visual',
      'Go to a museum/gallery': 'Visual',
      'Imagine how I\'d look in them': 'Visual',
      'Read brochures': 'Visual',
      'Read reviews': 'Visual',
      'Watch a teacher': 'Visual',
      'Look at others\' food': 'Visual',
      'Watch the band and audience': 'Visual',
      'Focus on text/images': 'Visual',
      'Look at pictures': 'Visual',
      'A visual image': 'Visual',
      'Imagine bad outcomes': 'Visual',
      'How they look': 'Visual',
      'Make notes/diagrams': 'Visual',
      'Watching films, art, or people': 'Visual',
      'Watch Netflix': 'Visual',
      'Meet in person': 'Visual',
      'Replay the event in my head': 'Visual',
      'Faces': 'Visual',
      'They won\'t look at me': 'Visual',
      'Write a letter': 'Visual',
      'I see what you mean': 'Visual',
      
      // Auditory learners
      'Listen to someone who explains it': 'Auditory',
      'Ask someone for directions': 'Auditory',
      'Ask a friend or look up on YouTube': 'Auditory',
      'Explain verbally': 'Auditory',
      'Let me tell you how to do it': 'Auditory',
      'Talk to friends/listen to music': 'Auditory',
      'Talk to others about my choices': 'Auditory',
      'Talk to friends about their trips': 'Auditory',
      'Ask friends': 'Auditory',
      'Talk through steps': 'Auditory',
      'Talk through options': 'Auditory',
      'Listen to the lyrics and beat': 'Auditory',
      'Have an internal dialogue': 'Auditory',
      'Listen to advice': 'Auditory',
      'A sound or something said': 'Auditory',
      'Hear an internal voice of doom': 'Auditory',
      'What they say': 'Auditory',
      'Talk over notes': 'Auditory',
      'Listening to music or talking': 'Auditory',
      'Talk to friends': 'Auditory',
      'Call them': 'Auditory',
      'Talk about it angrily': 'Auditory',
      'Names': 'Auditory',
      'Their voice sounds off': 'Auditory',
      'I hear you': 'Auditory',
      
      // Kinesthetic learners
      'Just have a go': 'Kinesthetic',
      'Get a rough idea then follow instincts': 'Kinesthetic',
      'Use my knowledge and experiment': 'Kinesthetic',
      'Demonstrate and let them try': 'Kinesthetic',
      'Do sports or hands-on activities': 'Kinesthetic',
      'Just try them on quickly': 'Kinesthetic',
      'Imagine myself there': 'Kinesthetic',
      'Book test drives': 'Kinesthetic',
      'Try and figure it out': 'Kinesthetic',
      'Imagine the taste': 'Kinesthetic',
      'Dance!': 'Kinesthetic',
      'Move or fidget': 'Kinesthetic',
      'Try the furniture': 'Kinesthetic',
      'A feeling or action': 'Kinesthetic',
      'Feel physically affected': 'Kinesthetic',
      'How they make me feel': 'Kinesthetic',
      'Visualize and imagine success': 'Kinesthetic',
      'Sports, eating, dancing': 'Kinesthetic',
      'Do physical or creative things': 'Kinesthetic',
      'Meet while doing something': 'Kinesthetic',
      'Physically show it': 'Kinesthetic',
      'Things I did': 'Kinesthetic',
      'I can feel it': 'Kinesthetic',
      'See them in person': 'Kinesthetic',
      'I know how you feel': 'Kinesthetic'
    };

    const counts = { Visual: 0, Auditory: 0, Kinesthetic: 0 };
    
    Object.values(answers).forEach(answer => {
      const style = learningStyleMapping[answer];
      if (style) {
        counts[style] += 1;
      }
    });

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'Mixed');
  };

  const generateRecommendations = (careerScores, personality, intelligences, learning) => {
    const topCareers = Object.keys(careerScores).sort((a, b) => careerScores[b] - careerScores[a]).slice(0, 2);

    const recommendations = [];

    // Base on RIASEC combinations
    if (topCareers.includes('R') && topCareers.includes('I')) {
      recommendations.push({
        field: 'Engineering and Applied Sciences',
        professions: ['Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Software Engineer', 'Robotics Engineer'],
        reason: 'High Realistic + Investigative suggest practical, analytical problem-solving with tangible outcomes.'
      });
    }

    if (topCareers.includes('S') && topCareers.includes('I')) {
      recommendations.push({
        field: 'Healthcare and Clinical Sciences',
        professions: ['Doctor', 'Nurse', 'Pharmacist', 'Clinical Research Associate', 'Physiotherapist'],
        reason: 'High Social + Investigative indicates helping others using scientific knowledge and empathy.'
      });
    }

    if (topCareers.includes('A') && topCareers.includes('E')) {
      recommendations.push({
        field: 'Creative Industries and Marketing',
        professions: ['Product Designer', 'UI/UX Designer', 'Marketing Strategist', 'Creative Director', 'Entrepreneur'],
        reason: 'High Artistic + Enterprising points to creative expression with influence and initiative.'
      });
    }

    if (topCareers.includes('C') && topCarears.includes('E')) {
      recommendations.push({
        field: 'Business, Finance, and Operations',
        professions: ['Accountant', 'Financial Analyst', 'Business Operations Manager', 'Banker', 'Compliance Specialist'],
        reason: 'High Conventional + Enterprising suggests structured, goal-oriented business environments.'
      });
    }

    if (topCareers.includes('A') && !recommendations.find(r => r.field.includes('Creative'))) {
      recommendations.push({
        field: 'Architecture and Design',
        professions: ['Architect', 'Interior Designer', 'Urban Planner', 'Graphic Designer'],
        reason: 'High Artistic indicates visual-spatial creativity and aesthetics.'
      });
    }

    // Refine with Multiple Intelligences overlays
    if (intelligences.includes('Logical-Mathematical')) {
      recommendations.push({
        field: 'Data and Analytics',
        professions: ['Data Analyst', 'Data Scientist', 'Business Intelligence Analyst'],
        reason: 'Logical-Mathematical intelligence aligns with quantitative analysis and modeling.'
      });
    }
    if (intelligences.includes('Linguistic')) {
      recommendations.push({
        field: 'Content and Communication',
        professions: ['Technical Writer', 'Content Strategist', 'Public Relations Specialist'],
        reason: 'Linguistic intelligence supports writing, storytelling, and persuasion.'
      });
    }
    if (intelligences.includes('Spatial')) {
      recommendations.push({
        field: 'Product and Visual Design',
        professions: ['Industrial Designer', 'Animator', 'Architectural Visualizer'],
        reason: 'Spatial intelligence fits visualization-heavy careers.'
      });
    }
    if (intelligences.includes('Interpersonal')) {
      recommendations.push({
        field: 'People-Centered Roles',
        professions: ['HR Business Partner', 'Counselor', 'Account Manager'],
        reason: 'Interpersonal intelligence favors collaboration and facilitation.'
      });
    }
    if (intelligences.includes('Intrapersonal')) {
      recommendations.push({
        field: 'Research and Strategy',
        professions: ['User Researcher', 'Strategic Planner', 'Coach'],
        reason: 'Intrapersonal intelligence aligns with reflection, goal-setting, and strategy.'
      });
    }

    // Personality modifiers
    if (personality === 'Leader' || personality === 'Challenger' || personality === 'Achiever') {
      recommendations.unshift({
        field: 'Leadership Tracks',
        professions: ['Team Lead', 'Product Manager', 'Operations Manager', 'Executive'],
        reason: 'Your leadership drive suggests roles with ownership, decision-making, and influence.'
      });
    }
    if (personality === 'Nurturer' || personality === 'Helper' || personality === 'Protector') {
      recommendations.unshift({
        field: 'Education and Advisory',
        professions: ['Teacher', 'Learning Designer', 'Career Counselor', 'Social Worker'],
        reason: 'Your supportive orientation fits roles centered on growth and development of others.'
      });
    }
    if (personality === 'Philosopher' || personality === 'Observer' || personality === 'Intellectual') {
      recommendations.unshift({
        field: 'Research and Analysis',
        professions: ['Researcher', 'Analyst', 'Consultant', 'Academic'],
        reason: 'Your analytical nature and love for deep thinking align with research-oriented roles.'
      });
    }

    // Learning style notes (used later in guidance; small tweak here for coherence)
    if (learning === 'Kinesthetic' && !recommendations.find(r => r.field.includes('Apprenticeship'))) {
      recommendations.push({
        field: 'Apprenticeship/On-the-Job Tracks',
        professions: ['Technician Apprentice', 'Junior Mechanic', 'Field Assistant', 'Tradesperson'],
        reason: 'Kinesthetic learning thrives in practical environments with mentorship and immediate application.'
      });
    }

    // Deduplicate by field while preserving order
    const seen = new Set();
    const unique = recommendations.filter(r => (seen.has(r.field) ? false : seen.add(r.field)));

    return unique.slice(0, 5);
  };

  const generateStreamRecommendations = (aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs) => {
    // Calculate weighted scores for each stream
    const streams = {
      'Science': {
        weight: 0,
        subjects: ['Mathematics', 'Science'],
        aptitudes: ['numerical', 'logical', 'spatial'],
        interests: ['I', 'R'], // Investigative, Realistic
        reasoning: 'Strong in analytical thinking, problem-solving, and scientific inquiry.'
      },
      'Commerce': {
        weight: 0,
        subjects: ['Mathematics', 'English', 'Social Science'],
        aptitudes: ['numerical', 'verbal', 'logical'],
        interests: ['C', 'E'], // Conventional, Enterprising
        reasoning: 'Good with numbers, communication, and business-oriented thinking.'
      },
      'Arts/Humanities': {
        weight: 0,
        subjects: ['English', 'Social Science', 'Languages'],
        aptitudes: ['verbal', 'spatial', 'logical'],
        interests: ['A', 'S'], // Artistic, Social
        reasoning: 'Creative, communicative, and interested in human behavior and society.'
      }
    };

    // Calculate academic score (40% weight)
    Object.keys(streams).forEach(stream => {
      const streamSubjects = streams[stream].subjects;
      let academicScore = 0;
      streamSubjects.forEach(subject => {
        const subjectKey = subject.toLowerCase().replace(' ', '');
        const subjectData = academicPerformance[subjectKey];
        // Handle both number and object formats (for VHSC)
        const score = typeof subjectData === 'object' ? subjectData.score : subjectData;
        academicScore += score || 0;
      });
      streams[stream].academicScore = parseFloat((academicScore / streamSubjects.length).toFixed(2));
      streams[stream].weight += streams[stream].academicScore * 0.4;
    });

    // Calculate aptitude score (30% weight)
    Object.keys(streams).forEach(stream => {
      const streamAptitudes = streams[stream].aptitudes;
      let aptitudeScore = 0;
      streamAptitudes.forEach(aptitude => {
        aptitudeScore += aptitudeScores[aptitude] || 0;
      });
      streams[stream].aptitudeScore = parseFloat((aptitudeScore / streamAptitudes.length).toFixed(2));
      streams[stream].weight += streams[stream].aptitudeScore * 0.3;
    });

    // Calculate interest score (20% weight)
    Object.keys(streams).forEach(stream => {
      const streamInterests = streams[stream].interests;
      let interestScore = 0;
      streamInterests.forEach(interest => {
        interestScore += interestScores[interest] || 0;
      });
      streams[stream].interestScore = parseFloat((interestScore / streamInterests.length).toFixed(2));
      streams[stream].weight += streams[stream].interestScore * 0.2;
    });

    // Add contextual bonus (10% weight)
    const careerAwareness = contextualInputs.careerAwareness || 0;
    const resourceAccess = contextualInputs.resourceAccess || 0;
    const parentalSupport = contextualInputs.parentalSupport || 0;
    const contextualScore = parseFloat(((careerAwareness + resourceAccess + parentalSupport) / 3).toFixed(2));

    Object.keys(streams).forEach(stream => {
      streams[stream].weight += contextualScore * 0.1;
    });

    // Sort streams by weight
    const sortedStreams = Object.keys(streams).sort((a, b) => streams[b].weight - streams[a].weight);

    // Generate recommendations with abroad and high-demand factors
    const recommendations = sortedStreams.map(stream => ({
      stream: stream,
      score: parseFloat(streams[stream].weight.toFixed(2)),
      reasoning: streams[stream].reasoning,
      subjects: streams[stream].subjects,
      careerPaths: getStreamCareerPaths(stream),
      abroadStudyOptions: getAbroadStudyOptions(stream, aptitudeScores, academicPerformance, personalityTraits, contextualInputs),
      highDemandSectors: getHighDemandSectors(stream)
    }));

    return recommendations;
  };

  const getStreamCareerPaths = (stream) => {
    const careerPaths = {
      'Science': [
        'Engineering (Mechanical, Civil, Electrical, Computer)',
        'Medicine (Doctor, Dentist, Pharmacist)',
        'Research Scientist',
        'Information Technology',
        'Architecture',
        'Mathematics and Statistics'
      ],
      'Commerce': [
        'Chartered Accountancy (CA)',
        'Company Secretary (CS)',
        'Business Administration (BBA/MBA)',
        'Finance and Banking',
        'Economics',
        'Marketing and Sales',
        'Human Resources'
      ],
      'Arts/Humanities': [
        'Law (LLB)',
        'Journalism and Mass Communication',
        'Psychology',
        'Sociology',
        'Literature and Languages',
        'Fine Arts',
        'Teaching and Education',
        'Social Work'
      ]
    };
    return careerPaths[stream] || [];
  };

  const getAbroadStudyOptions = (stream, aptitudeScores, academicPerformance, personalityTraits, contextualInputs) => {
    const abroadOptions = [];

    // Base criteria for abroad studies
    const avgAcademic = Object.values(academicPerformance).reduce((a, b) => a + b, 0) / Object.values(academicPerformance).length;
    const openness = personalityTraits.openness || 0;
    const resourceAccess = contextualInputs.resourceAccess || 0;

    // Stream-specific abroad recommendations
    if (stream === 'Science') {
      if (avgAcademic >= 75 && openness >= 70) {
        abroadOptions.push({
          country: 'USA',
          universities: ['MIT', 'Stanford', 'Caltech'],
          programs: ['Engineering', 'Computer Science', 'Data Science'],
          requirements: 'High GPA, GRE scores, strong letters of recommendation'
        });
        abroadOptions.push({
          country: 'Germany',
          universities: ['TU Munich', 'RWTH Aachen'],
          programs: ['Engineering', 'Research Programs'],
          requirements: 'German language proficiency, competitive entrance exams'
        });
        abroadOptions.push({
          country: 'UK',
          universities: ['University of London', 'University of Manchester'],
          programs: ['Medical Laboratory Technology', 'Biomedical Sciences'],
          requirements: 'IELTS, relevant qualifications, clinical experience'
        });
        abroadOptions.push({
          country: 'Gulf Countries (UAE, Saudi Arabia, Qatar)',
          universities: ['University of Dubai', 'King Saud University', 'Carnegie Mellon University in Qatar'],
          programs: ['Medical Laboratory Science', 'Healthcare Management'],
          requirements: 'High academic scores, English proficiency, work visa sponsorship'
        });
        abroadOptions.push({
          country: 'European Countries (Netherlands, Sweden)',
          universities: ['University of Amsterdam', 'Karolinska Institute'],
          programs: ['Biomedical Laboratory Science', 'Clinical Research'],
          requirements: 'Bachelor\'s degree, language requirements, EU Blue Card'
        });
      }
    } else if (stream === 'Commerce') {
      if (avgAcademic >= 70 && resourceAccess >= 60) {
        abroadOptions.push({
          country: 'UK',
          universities: ['London School of Economics', 'University of Oxford'],
          programs: ['MBA', 'Finance', 'Business Analytics'],
          requirements: 'GMAT scores, work experience, English proficiency'
        });
        abroadOptions.push({
          country: 'Canada',
          universities: ['University of Toronto', 'McGill University'],
          programs: ['Business Administration', 'International Business'],
          requirements: 'Competitive GPA, language tests, financial proof'
        });
      }
    } else if (stream === 'Arts/Humanities') {
      if (openness >= 75 && avgAcademic >= 65) {
        abroadOptions.push({
          country: 'Australia',
          universities: ['University of Melbourne', 'University of Sydney'],
          programs: ['Media Studies', 'International Relations', 'Psychology'],
          requirements: 'Portfolio, English proficiency, competitive application'
        });
        abroadOptions.push({
          country: 'Netherlands',
          universities: ['University of Amsterdam', 'Utrecht University'],
          programs: ['Social Sciences', 'Cultural Studies'],
          requirements: 'Motivation letter, academic references'
        });
      }
    }

    return abroadOptions;
  };

  const getHighDemandSectors = (stream) => {
    const highDemandSectors = {
      'Science': [
        {
          sector: 'Artificial Intelligence & Machine Learning',
          growth: '35% annual growth',
          skills: ['Python', 'TensorFlow', 'Data Analysis'],
          careerPaths: ['AI Engineer', 'Data Scientist', 'ML Researcher'],
          jobOpportunities: 'Tech companies, research institutions, AI startups, government agencies'
        },
        {
          sector: 'Renewable Energy',
          growth: '28% annual growth',
          skills: ['Engineering', 'Sustainability', 'Project Management'],
          careerPaths: ['Solar Engineer', 'Wind Energy Specialist', 'Sustainability Consultant'],
          jobOpportunities: 'Energy companies, environmental agencies, renewable energy firms, consulting firms'
        },
        {
          sector: 'Biotechnology & Healthcare',
          growth: '22% annual growth',
          skills: ['Biology', 'Research', 'Medical Technology'],
          careerPaths: ['Biotech Researcher', 'Medical Scientist', 'Healthcare Analyst'],
          jobOpportunities: 'Hospitals, clinics, research centers, pharmaceutical companies, biotech firms, NGOs'
        }
      ],
      'Commerce': [
        {
          sector: 'FinTech & Digital Banking',
          growth: '32% annual growth',
          skills: ['Blockchain', 'Financial Analysis', 'Digital Marketing'],
          careerPaths: ['FinTech Analyst', 'Digital Banking Specialist', 'Investment Banker'],
          jobOpportunities: 'Banks, financial institutions, fintech startups, investment firms, consulting companies'
        },
        {
          sector: 'E-commerce & Digital Marketing',
          growth: '25% annual growth',
          skills: ['Digital Marketing', 'E-commerce Platforms', 'Analytics'],
          careerPaths: ['E-commerce Manager', 'Digital Marketing Specialist', 'Business Analyst'],
          jobOpportunities: 'E-commerce companies, marketing agencies, retail chains, digital media firms, startups'
        },
        {
          sector: 'Sustainable Finance',
          growth: '20% annual growth',
          skills: ['ESG Investing', 'Sustainable Finance', 'Risk Management'],
          careerPaths: ['ESG Analyst', 'Sustainable Investment Manager', 'Green Finance Consultant'],
          jobOpportunities: 'Investment banks, asset management firms, sustainability consulting, green finance institutions'
        }
      ],
      'Arts/Humanities': [
        {
          sector: 'Digital Media & Content Creation',
          growth: '30% annual growth',
          skills: ['Content Creation', 'Social Media', 'Digital Storytelling'],
          careerPaths: ['Content Creator', 'Social Media Manager', 'Digital Journalist'],
          jobOpportunities: 'Media companies, digital agencies, content platforms, entertainment industry, marketing firms'
        },
        {
          sector: 'Mental Health & Wellness',
          growth: '24% annual growth',
          skills: ['Psychology', 'Counseling', 'Wellness Coaching'],
          careerPaths: ['Mental Health Counselor', 'Wellness Coach', 'Therapist'],
          jobOpportunities: 'Hospitals, clinics, wellness centers, counseling services, NGOs, educational institutions'
        },
        {
          sector: 'Education Technology',
          growth: '18% annual growth',
          skills: ['Educational Technology', 'Online Learning', 'Curriculum Design'],
          careerPaths: ['EdTech Specialist', 'Online Educator', 'Learning Designer'],
          jobOpportunities: 'EdTech companies, educational institutions, training organizations, content development firms'
        }
      ]
    };

    return highDemandSectors[stream] || [];
  };

  // Guidance builder and PDF generator
  const buildGuidanceSections = (analysis) => {
    if (analysis.assessmentType === 'vhsc') {
      // Build guidance for VHSC assessment
      const { streamRecommendations } = analysis;

      const studyStrategies = [
        'Focus on core subjects relevant to your recommended stream',
        'Practice past question papers and mock tests regularly',
        'Join study groups and discuss concepts with peers',
        'Use online resources and educational platforms for additional learning'
      ];

      const skillRoadmap = [
        'Stream Selection: Choose your preferred stream based on assessment results',
        'Subject Focus: Strengthen foundation in stream-specific subjects',
        'Entrance Preparation: Prepare for relevant entrance examinations',
        'Career Planning: Research colleges and career options in your stream',
        'Skill Development: Build practical skills through projects and internships'
      ];

      const alignmentNotes = [
        `Top Recommended Stream: ${streamRecommendations[0]?.stream}`,
        `Academic Strengths: Based on your Grade 10 performance`,
        `Aptitude Profile: Aligned with stream requirements`,
        `Interest Alignment: Matches your RIASEC preferences`,
        `Abroad Study Options: ${streamRecommendations[0]?.abroadStudyOptions?.length > 0 ? 'Available based on your profile' : 'Consider improving academic scores for international opportunities'}`,
        `High-Demand Sectors: ${streamRecommendations[0]?.highDemandSectors?.length > 0 ? 'Multiple growing sectors identified' : 'Focus on skill development for emerging opportunities'}`
      ];

      const immediateActions = [
        'Review your stream recommendations carefully',
        'Discuss results with parents and teachers',
        'Research colleges offering your preferred stream',
        'Start preparing for stream-specific entrance exams'
      ];

      return { studyStrategies, skillRoadmap, alignmentNotes, immediateActions, recommendations: streamRecommendations };
    } else {
      // Regular assessment guidance - updated for comprehensive analysis
      const { interestScores, personalityType, topIntelligences, learningStyle, streamRecommendations, aptitudeScores, academicPerformance, personalityTraits, contextualInputs } = analysis;

      const riasecTop = Object.keys(interestScores).sort((a, b) => interestScores[b] - interestScores[a]).slice(0, 3);

      const studyStrategies = (() => {
        // Enhanced study strategies based on multiple factors
        const strategies = [];

        // Learning style based
        switch (learningStyle) {
          case 'Visual':
            strategies.push('Use visual aids like diagrams, charts, and infographics', 'Create mind maps and visual summaries', 'Watch educational videos and animations', 'Use color coding and highlighting techniques');
            break;
          case 'Auditory':
            strategies.push('Join study groups and engage in discussions', 'Record yourself explaining concepts and listen back', 'Use podcasts and audio lectures', 'Explain topics out loud to test understanding');
            break;
          case 'Kinesthetic':
            strategies.push('Do hands-on projects and practical exercises', 'Shadow practitioners and replicate their tasks', 'Use physical models and manipulatives', 'Take frequent breaks and move while studying');
            break;
          default:
            strategies.push('Blend visual, auditory, and kinesthetic methods', 'Weekly teach-back session to a peer', 'Use spaced repetition for retention', 'Adapt study methods based on the subject matter');
        }

        // Aptitude-based strategies
        if (aptitudeScores.logical > 70) {
          strategies.push('Focus on analytical problem-solving and logical reasoning exercises');
        }
        if (aptitudeScores.spatial > 70) {
          strategies.push('Incorporate spatial visualization techniques in your studies');
        }

        // Academic performance based
        const weakSubjects = Object.entries(academicPerformance).filter(([_, score]) => score < 60).map(([subject]) => subject);
        if (weakSubjects.length > 0) {
          strategies.push(`Dedicate extra time to improve in: ${weakSubjects.join(', ')}`);
        }

        return strategies.slice(0, 6); // Limit to 6 strategies
      })();

      const skillRoadmap = [
        'Stream Selection: Review your stream recommendations and choose your preferred path',
        'Subject Mastery: Strengthen foundation in stream-specific subjects',
        'Aptitude Development: Focus on improving key aptitude areas identified',
        'Career Exploration: Research colleges and career options in your chosen stream',
        'Skill Building: Develop practical skills through projects and internships',
        'Personal Growth: Work on personality traits that support your career goals'
      ];

      const alignmentNotes = [
        `Top Recommended Stream: ${streamRecommendations[0]?.stream} (Score: ${streamRecommendations[0]?.score}/100)`,
        `RIASEC Interests: ${riasecTop.join(', ')} - Shows your vocational preferences`,
        `Strongest Aptitudes: ${Object.entries(aptitudeScores).sort(([,a],[,b]) => b-a).slice(0,2).map(([type]) => type).join(', ')}`,
        `Academic Profile: ${Object.entries(academicPerformance).sort(([,a],[,b]) => b-a).slice(0,2).map(([subject]) => subject).join(', ')} are your strongest subjects`,
        `Personality Traits: ${Object.entries(personalityTraits).sort(([,a],[,b]) => b-a).slice(0,2).map(([trait]) => trait).join(', ')} are prominent`,
        `Contextual Support: ${Object.entries(contextualInputs).sort(([,a],[,b]) => b-a).slice(0,2).map(([factor]) => factor.replace(/([A-Z])/g, ' $1')).join(', ')}`
      ];

      const immediateActions = [
        'Review your comprehensive assessment results and identify your top stream choice',
        'Discuss results with parents, teachers, and career counselors',
        'Research colleges and entrance exams for your chosen stream',
        'Create a study plan focusing on your weaker subjects and aptitude areas',
        'Start building a portfolio of projects related to your interests',
        'Connect with professionals in your recommended career paths'
      ];

      return { studyStrategies, skillRoadmap, alignmentNotes, immediateActions, recommendations: streamRecommendations };
    }
  };

  const generateElaboratedReport = () => {
    if (!report) return '';
    const { careerScores, personalityType, topIntelligences, learningStyle } = report;
    const guidance = buildGuidanceSections(report);

    const lines = [];
    lines.push('NextU Career Guidance Report');
    lines.push('');
    lines.push('Profile Summary');
    lines.push(`- RIASEC Scores: ${Object.entries(careerScores).map(([k,v]) => `${k}:${v}`).join(' | ')}`);
    lines.push(`- Personality: ${personalityType}`);
    lines.push(`- Intelligences: ${topIntelligences.join(', ')}`);
    lines.push(`- Learning Style: ${learningStyle}`);
    lines.push('');
    lines.push('Recommendations');
    guidance.recommendations.forEach((r, idx) => {
      lines.push(`${idx + 1}. ${r.field}`);
      lines.push(`   Why: ${r.reason}`);
      lines.push(`   Roles: ${r.professions.join(', ')}`);
    });
    lines.push('');
    lines.push('Alignment Notes');
    guidance.alignmentNotes.forEach(n => lines.push(`- ${n}`));
    lines.push('');
    lines.push('Study Strategies');
    guidance.studyStrategies.forEach(s => lines.push(`- ${s}`));
    lines.push('');
    lines.push('Skill-Building Roadmap');
    guidance.skillRoadmap.forEach(s => lines.push(`- ${s}`));
    lines.push('');
    lines.push('Immediate Next Actions');
    guidance.immediateActions.forEach(a => lines.push(`- ${a}`));

    return lines.join('\n');
  };

  if (!tokenValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Access Your Report
            </h1>
            <p className="text-gray-600">
              Enter your access token to view your career assessment report
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="text"
                id="token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="Enter your access token"
                maxLength="8"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={validateToken}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Validating...' : 'Access Report'}
            </button>
          </div>

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
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Generating your career report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  const downloadReport = async () => {
    try {
      // Check if report data is available
      if (!report) {
        throw new Error('No report data available. Please wait for the report to load.');
      }

      const element = document.createElement("a");

      // Generate PDF from styled HTML representation of the report
      let pdfBlob;
      try {
        pdfBlob = await createStyledPDF();
      } catch (styledError) {
        console.warn('Styled PDF failed, using text fallback:', styledError);
        // Fallback: Create a simple text-based PDF
        pdfBlob = await createTextBasedPDF();
      }

      // Convert blob to base64 for sending to server
      const base64Pdf = await blobToBase64(pdfBlob);

      // Send PDF to server for storage
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
        alert("User not authenticated.");
        return;
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: userToken, pdfData: base64Pdf }),
      });

      if (!response.ok) {
        throw new Error('Failed to save PDF report');
      }

      // Trigger download of PDF
      element.href = URL.createObjectURL(pdfBlob);
      element.download = "career_report.pdf";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

    } catch (error) {
      console.error("Error generating or downloading PDF:", error);
      console.error("Report data:", report);
      alert(`Failed to generate or download PDF report. Error: ${error.message}`);
    }
  };

  // Helper to convert blob to base64 string
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Method to generate styled HTML for the report
  const generateStyledReportHTML = () => {
    if (!report) return '';
    const { careerScores, personalityType, topIntelligences, learningStyle, streamRecommendations } = report;
    const guidance = buildGuidanceSections(report);

    const riasecTop = Object.keys(careerScores).sort((a, b) => careerScores[b] - careerScores[a]).slice(0, 3);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: black;
              background: white;
              padding: 20px;
              margin: 0;
              max-width: 8.5in;
            }
            h1 {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 20px;
              text-align: center;
              color: #1e40af;
            }
            .user-info {
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border: 1px solid #e2e8f0;
            }
            .user-info h2 {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1e40af;
            }
            .user-detail {
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .grid {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
            }
            .card {
              flex: 1;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .blue-bg {
              background-color: #eff6ff;
            }
            .green-bg {
              background-color: #f0fdf4;
            }
            .yellow-bg {
              background-color: #fffbeb;
            }
            .purple-bg {
              background-color: #faf5ff;
            }
            h2 {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1e40af;
            }
            h3 {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 8px;
              color: #1e40af;
            }
            .score-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .rec-item {
              border-left: 4px solid #3b82f6;
              padding-left: 10px;
              margin-bottom: 15px;
            }
            .prof-list {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
              margin-top: 5px;
            }
            .prof-tag {
              background-color: #dbeafe;
              color: #1e3a8a;
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 10pt;
            }
            .guidance-grid {
              display: flex;
              gap: 20px;
            }
            .guidance-col {
              flex: 1;
            }
            ul, ol {
              margin-left: 20px;
            }
            li {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <h1>Your Career Report</h1>
          ${userDetails?.name ? `<h2 style="text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 20px; color: #374151;">${userDetails.name}</h2>` : ''}

          ${userDetails ? `
            <div class="user-info">
              <h2>User Information</h2>
              <div class="user-detail"><strong>Name:</strong> ${userDetails.name}</div>
              <div class="user-detail"><strong>Email:</strong> ${userDetails.email}</div>
              <div class="user-detail"><strong>Phone:</strong> ${userDetails.phoneNo}</div>
              <div class="user-detail"><strong>Current Qualification:</strong> ${userDetails.currentQualification}</div>
            </div>
          ` : ''}

          <div class="grid">
            <div class="card blue-bg">
              <h2>RIASEC Career Types</h2>
              <div>
                ${Object.entries(careerScores).map(([type, score]) => `<div class="score-item"><span>${type}:</span><span style="font-weight: bold;">${parseFloat(score).toFixed(2)}/15</span></div>`).join('')}
              </div>
            </div>

            <div class="card green-bg">
              <h2>Your Profile</h2>
              <p><strong>Personality:</strong> ${personalityType}</p>
              <p><strong>Top Intelligences:</strong> ${topIntelligences.join(', ')}</p>
              <p><strong>Learning Style:</strong> ${learningStyle}</p>
            </div>
          </div>

          <div class="card yellow-bg section">
            <h2 style="text-align: center;">Recommended Streams</h2>
            <div>
              ${streamRecommendations?.map((rec, index) => `
                <div class="rec-item">
                  <h3>${rec.stream} Stream (Score: ${parseFloat(rec.score).toFixed(2)}/100)</h3>
                  <p style="color: #374151; margin-bottom: 5px;"><strong>Reasoning:</strong> ${rec.reasoning}</p>
                  <p style="color: #6b7280; margin-bottom: 5px;"><strong>Key Subjects:</strong> ${rec.subjects.join(', ')}</p>
                  <div class="prof-list">
                    ${rec.careerPaths.slice(0, 4).map(path => `<span class="prof-tag">${path}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card indigo-bg section">
            <h2>How Stream Recommendations Are Calculated</h2>
            <p style="color: #374151; margin-bottom: 10px;">
              Stream recommendations are based on a weighted scoring algorithm that evaluates multiple assessment factors to provide holistic career guidance.
            </p>
            <div class="guidance-grid" style="margin-bottom: 15px;">
              <div class="guidance-col">
                <h3>Scoring Components</h3>
                <ul>
                  <li><strong>Academic Performance (40%):</strong> Performance in stream-relevant subjects</li>
                  <li><strong>Aptitude Scores (30%):</strong> Cognitive abilities aligned with each stream</li>
                  <li><strong>Interest Scores (20%):</strong> RIASEC model preferences</li>
                  <li><strong>Contextual Factors (10%):</strong> Career awareness, resource access, parental support</li>
                </ul>
              </div>
              <div class="guidance-col">
                <h3>Stream Profiles</h3>
                <ul>
                  <li><strong>Science:</strong> Analytical thinking, problem-solving, scientific inquiry</li>
                  <li><strong>Commerce:</strong> Numbers, communication, business-oriented thinking</li>
                  <li><strong>Arts/Humanities:</strong> Creative, communicative, interested in human behavior</li>
                </ul>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 10pt;">
              Streams are ranked by total weighted score (0-100) and presented in descending order, ensuring recommendations consider academic strengths, cognitive abilities, vocational interests, and environmental support factors.
            </p>
          </div>

          <div class="card purple-bg section">
            <h2>Personalized Guidance</h2>
            <div class="guidance-grid">
              <div class="guidance-col">
                <h3>Study Strategies</h3>
                <ul>
                  ${guidance.studyStrategies.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
              <div class="guidance-col">
                <h3>Alignment Notes</h3>
                <ul>
                  ${guidance.alignmentNotes.map(n => `<li>${n}</li>`).join('')}
                </ul>
              </div>
              <div class="guidance-col">
                <h3>Skill-Building Roadmap</h3>
                <ol>
                  ${guidance.skillRoadmap.map(s => `<li>${s}</li>`).join('')}
                </ol>
              </div>
              <div class="guidance-col">
                <h3>Immediate Next Actions</h3>
                <ul>
                  ${guidance.immediateActions.map(a => `<li>${a}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    return html;
  };

  // Method to create PDF from styled HTML
  const createStyledPDF = async () => {
    const htmlContent = generateStyledReportHTML();

    const opt = {
      margin: 0.5,
      filename: 'career_report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,         // higher resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate PDF from the styled HTML content
    const pdfBlob = await html2pdf().set(opt).from(htmlContent).outputPdf('blob');
    return pdfBlob;
  };

  // Fallback method to create a simple text-based PDF
  const createTextBasedPDF = async () => {
    const reportText = generateElaboratedReport();

    // Create a full HTML document for the iframe
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: black;
              background: white;
              padding: 20px;
              margin: 0;
            }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <pre>${reportText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '8.5in';
    iframe.style.height = '11in';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    iframe.srcdoc = htmlContent;

    try {
      await new Promise((resolve, reject) => {
        iframe.onload = () => setTimeout(resolve, 50);
        iframe.onerror = (e) => reject(e);
      });

      const opt = {
        margin: 0.5,
        filename: 'career_report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(iframe.contentWindow.document.body).outputPdf('blob');
      document.body.removeChild(iframe);
      return pdfBlob;
    } catch (error) {
      if (iframe && iframe.parentNode) document.body.removeChild(iframe);
      throw error;
    }
  };





  return (
    <div className="max-w-4xl mx-auto p-8">
      <div id="career-report-content">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {report?.assessmentType === 'vhsc' ? 'Your VHSC Stream Report' : 'Your Career Report'}
        </h1>
        {userDetails?.name && (
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-700">
            {userDetails.name}
          </h2>
        )}

        {userDetails && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Name:</strong> {userDetails.name}
              </div>
              <div>
                <strong>Email:</strong> {userDetails.email}
              </div>
              <div>
                <strong>Phone:</strong> {userDetails.phoneNo}
              </div>
              <div>
                <strong>Current Qualification:</strong> {userDetails.currentQualification}
              </div>
            </div>
          </div>
        )}

        {report?.assessmentType === 'vhsc' ? (
          // VHSC Assessment Display
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Assessment Scores Summary</h2>

              {/* Aptitude Scores Section */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-purple-800 mb-4">Aptitude Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.aptitudeScores || {}).map(([aptitude, score]) => (
                    <div key={aptitude} className="bg-white rounded-lg p-4 border border-purple-100">
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-purple-800 capitalize">{aptitude} Aptitude</h4>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">{formatNumber(score)}%</div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Performance Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Academic Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.academicPerformance || {}).map(([subject, data]) => {
                    const score = typeof data === 'object' ? data.score : data;
                    const selectedOption = typeof data === 'object' ? data.selectedOption : null;
                    return (
                      <div key={subject} className="bg-white rounded-lg p-4 border border-green-100">
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-green-800 capitalize">{subject}</h4>
                        </div>
                        <div className="text-2xl font-bold text-green-600 mb-1">{formatNumber(score)}%</div>
                        {selectedOption && (
                          <div className="text-xs text-gray-600 mb-2">Selected: {selectedOption}</div>
                        )}
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interest Scores Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-800 mb-4">Interest Scores (RIASEC)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.interestScores || {}).map(([interest, score]) => (
                    <div key={interest} className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-indigo-800">{interest} Interest</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">RIASEC</span>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 mb-1">{formatNumber(score)}/15</div>
                      <div className="text-sm text-gray-600 mb-2">({formatNumber((score / 15) * 100)}%)</div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(score / 15) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personality Traits Section */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-pink-800 mb-4">Personality Traits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.personalityTraits || {}).map(([trait, score]) => (
                    <div key={trait} className="bg-white rounded-lg p-4 border border-pink-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-pink-800 capitalize">{trait}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">Personality</span>
                      </div>
                      <div className="text-2xl font-bold text-pink-600 mb-1">{formatNumber(score)}%</div>
                      <div className="w-full bg-pink-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Factors Section */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">Contextual Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.contextualInputs || {}).map(([factor, score]) => (
                    <div key={factor} className="bg-white rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-orange-800 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Context</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">{formatNumber(score)}%</div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Recommended Streams</h2>
              <div className="space-y-6">
                {report.streamRecommendations?.slice(0, 2).map((rec, index) => (
                  <div key={index} className={`border-l-4 pl-4 ${index === 0 ? 'border-green-500' : 'border-blue-500'}`}>
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">{rec.stream} Stream</h3>
                    <p className="text-gray-600 mb-2">{rec.reasoning}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Key Subjects:</strong> {rec.subjects.join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rec.careerPaths.slice(0, 4).map((path, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {path}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Regular Assessment Display
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-purple-800">Assessment Scores Summary</h2>

              {/* Aptitude Scores Section */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-purple-800 mb-4">Aptitude Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.aptitudeScores || {}).map(([aptitude, data]) => (
                    <div key={aptitude} className="bg-white rounded-lg p-4 border border-purple-100">
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-purple-800 capitalize">{aptitude} Aptitude</h4>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">{formatNumber(data.score)}%</div>
                      <div className="text-sm text-gray-600 mb-2">Correct: {data.correct}/{data.total}</div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${data.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interest Scores Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-indigo-800 mb-4">Interest Scores (RIASEC)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.interestScores || {}).map(([type, score]) => (
                    <div key={type} className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-indigo-800">{type} Interest</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">RIASEC</span>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 mb-1">{formatNumber(score)}/15</div>
                      <div className="text-sm text-gray-600 mb-2">({formatNumber((score / 15) * 100)}%)</div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(score / 15) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Performance Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Academic Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.academicPerformance || {}).map(([subject, score]) => (
                    <div key={subject} className="bg-white rounded-lg p-4 border border-green-100">
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-green-800 capitalize">{subject.replace(/([A-Z])/g, ' $1')}</h4>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">{formatNumber(score)}%</div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personality Traits Section */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-pink-800 mb-4">Personality Traits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.personalityTraits || {}).map(([trait, score]) => (
                    <div key={trait} className="bg-white rounded-lg p-4 border border-pink-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-pink-800 capitalize">{trait}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">Personality</span>
                      </div>
                      <div className="text-2xl font-bold text-pink-600 mb-1">{formatNumber(score)}%</div>
                      <div className="w-full bg-pink-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Factors Section */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">Contextual Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.contextualInputs || {}).map(([factor, score]) => (
                    <div key={factor} className="bg-white rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-orange-800 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Context</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">{formatNumber(score)}%</div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Recommended Streams</h2>
              <div className="space-y-6">
                {report.streamRecommendations?.slice(0, 2).map((rec, index) => (
                  <div key={index} className={`border-l-4 pl-4 ${index === 0 ? 'border-green-500' : 'border-blue-500'}`}>
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">{rec.stream} Stream</h3>
                    <p className="text-gray-600 mb-2">{rec.reasoning}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Key Subjects:</strong> {rec.subjects.join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rec.careerPaths.slice(0, 4).map((path, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {path}
                        </span>
                      ))}
                    </div>
                    {rec.highDemandSectors && rec.highDemandSectors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-700 mb-2">High-Demand Sectors:</h4>
                        <div className="space-y-2">
                          {rec.highDemandSectors.map((sector, i) => (
                            <div key={i} className="bg-white p-3 rounded border">
                              <p className="font-medium text-green-600">{sector.sector}</p>
                              <p className="text-sm text-gray-600">Growth: {sector.growth}</p>
                              <p className="text-sm text-gray-600">Skills: {sector.skills.join(', ')}</p>
                              <p className="text-sm text-gray-600">Career Paths: {sector.careerPaths.join(', ')}</p>
                              <p className="text-sm text-gray-600">Job Opportunities: {sector.jobOpportunities}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold mb-4">How Stream Recommendations Are Calculated</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Stream recommendations are based on a weighted scoring algorithm that evaluates multiple assessment factors to provide holistic career guidance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Scoring Components</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Academic Performance (40%):</strong> Performance in stream-relevant subjects</li>
                      <li><strong>Aptitude Scores (30%):</strong> Cognitive abilities aligned with each stream</li>
                      <li><strong>Interest Scores (20%):</strong> RIASEC model preferences</li>
                      <li><strong>Contextual Factors (10%):</strong> Career awareness, resource access, parental support</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Stream Profiles</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Science:</strong> Analytical thinking, problem-solving, scientific inquiry</li>
                      <li><strong>Commerce:</strong> Numbers, communication, business-oriented thinking</li>
                      <li><strong>Arts/Humanities:</strong> Creative, communicative, interested in human behavior</li>
                    </ul>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Streams are ranked by total weighted score (0-100) and presented in descending order, ensuring recommendations consider academic strengths, cognitive abilities, vocational interests, and environmental support factors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Composite Scores</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Aptitude:</span>
                    <span className="font-medium">{formatNumber(report.compositeScores?.aptitude || 0)}/100 ({getGrade(report.compositeScores?.aptitude || 0)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Alignment:</span>
                    <span className="font-medium">{formatNumber(report.compositeScores?.interest || 0)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Academic Performance:</span>
                    <span className="font-medium">{formatNumber(report.compositeScores?.academic || 0)}/100 ({getGrade(report.compositeScores?.academic || 0)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personality Fit:</span>
                    <span className="font-medium">{formatNumber(report.compositeScores?.personality || 0)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contextual Support:</span>
                    <span className="font-medium">{formatNumber(report.compositeScores?.context || 0)}/100</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Weighted Score:</span>
                    <span className="font-bold text-lg">{formatNumber(report.weightedScore || 0)}/100 ({getGrade(report.weightedScore || 0)})</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Assessment Insights</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-800">Top Strengths:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {(() => {
                        const strengths = [];
                        const aptMax = Math.max(...Object.values(report.aptitudeScores || {}));
                        const aptTop = Object.keys(report.aptitudeScores || {}).find(k => report.aptitudeScores[k] === aptMax);
                        if (aptTop) strengths.push(`${aptTop} aptitude (${aptMax}%)`);

                        const interestMax = Math.max(...Object.values(report.interestScores || {}));
                        const interestTop = Object.keys(report.interestScores || {}).find(k => report.interestScores[k] === interestMax);
                        if (interestTop) strengths.push(`${interestTop} interests (${Math.round((interestMax / 15) * 100)}%)`);

                        const academicMax = Math.max(...Object.values(report.academicPerformance || {}));
                        const academicTop = Object.keys(report.academicPerformance || {}).find(k => report.academicPerformance[k] === academicMax);
                        if (academicTop) strengths.push(`${academicTop} academics (${academicMax}%)`);

                        return strengths.slice(0, 3).map(s => <li key={s}>{s}</li>);
                      })()}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Areas for Development:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {(() => {
                        const weaknesses = [];
                        const aptMin = Math.min(...Object.values(report.aptitudeScores || {}));
                        const aptLow = Object.keys(report.aptitudeScores || {}).find(k => report.aptitudeScores[k] === aptMin);
                        if (aptLow && aptMin < 60) weaknesses.push(`${aptLow} aptitude (${aptMin}%)`);

                        const academicMin = Math.min(...Object.values(report.academicPerformance || {}));
                        const academicLow = Object.keys(report.academicPerformance || {}).find(k => report.academicPerformance[k] === academicMin);
                        if (academicLow && academicMin < 60) weaknesses.push(`${academicLow} academics (${academicMin}%)`);

                        return weaknesses.length > 0 ? weaknesses.slice(0, 2).map(w => <li key={w}>{w}</li>) : [<li>No major areas identified</li>];
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-purple-50 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-semibold mb-4">Personalized Guidance</h2>
          {(() => {
            const g = buildGuidanceSections(report);
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Study Strategies</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {g.studyStrategies.map((s, i) => (<li key={i}>{s}</li>))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Alignment Notes</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {g.alignmentNotes.map((n, i) => (<li key={i}>{n}</li>))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skill-Building Roadmap</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {g.skillRoadmap.map((s, i) => (<li key={i}>{s}</li>))}
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Immediate Next Actions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {g.immediateActions.map((a, i) => (<li key={i}>{a}</li>))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Legacy Profile Section for backward compatibility */}
        {report.personalityType && (
          <div className="bg-gray-50 p-6 rounded-lg mt-8">
            <h2 className="text-2xl font-semibold mb-4">Additional Profile Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Personality Type</h3>
                <p>{report.personalityType}</p>
                <p className="text-sm text-gray-600 mt-1">{getPersonalityElaboration(report.personalityType)}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Top Intelligences</h3>
                <p>{report.topIntelligences?.join(', ') || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-1">{getIntelligencesElaboration(report.topIntelligences || [])}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Learning Style</h3>
                <p>{report.learningStyle || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-1">{getLearningStyleElaboration(report.learningStyle)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-8 flex flex-col items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Return to Home
        </button>
        <button
          onClick={downloadReport}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Download Report
        </button>
      </div>
    </div>
  );
};

const getPersonalityElaboration = (personality) => {
  const elaborations = {
    'Philosopher': 'You are thoughtful and introspective, seeking deeper meaning and understanding in life.',
    'Perfectionist': 'You value excellence and integrity, striving for high standards in everything you do.',
    'Achiever': 'You are driven and ambitious, balancing hard work with enjoyment and achievement.',
    'Balanced': 'You have a well-rounded personality with no dominant trait, maintaining stability and harmony.',
    'Mediator': 'You are diplomatic and help others find common ground, naturally resolving conflicts.',
    'Protector': 'You are caring and responsible, ensuring everyone around you is taken care of.',
    'Provider': 'You focus on supporting others through practical means and material resources.',
    'Nurturer': 'You are loving and supportive, creating healthy environments for growth and development.',
    'Intellectual': 'You value intelligence and honesty, preferring deep, meaningful connections.',
    'Leader': 'You have a strong presence and natural leadership abilities, taking charge when needed.',
    'Enthusiast': 'You are energetic and dynamic, bringing fun and excitement to situations.',
    'Loyalist': 'You are reliable and respectful, building strong, trustworthy relationships.',
    'Observer': 'You are analytical and thoughtful, preferring to observe and understand before acting.',
    'Challenger': 'You are assertive and direct, not afraid to confront issues and drive change.',
    'Helper': 'You are caring and supportive, naturally helping others and building community.',
    'Peacemaker': 'You are calm and composed, bringing balance and harmony to situations.',
    'Individualist': 'You are unique and expressive, valuing authenticity and personal expression.'
  };
  return elaborations[personality] || 'You have a unique personality that combines various traits.';
};

const getIntelligencesElaboration = (intelligences) => {
  const elaborations = {
    'Logical-Mathematical': 'You excel in reasoning, problem-solving, and understanding complex patterns.',
    'Linguistic': 'You have strong verbal skills and enjoy reading, writing, and storytelling.',
    'Spatial': 'You think in images and visualize well, useful in design and architecture.',
    'Musical': 'You have a good sense of rhythm and sound, often appreciating or creating music.',
    'Bodily-Kinesthetic': 'You are skilled in physical activities and hands-on tasks.',
    'Interpersonal': 'You understand and interact well with others, showing empathy and social skills.',
    'Intrapersonal': 'You have deep self-awareness and understand your own emotions and motivations.',
    'Naturalistic': 'You are attuned to nature and enjoy working with plants, animals, or the environment.'
  };

  return intelligences.map(intel => elaborations[intel] || '').join(' ');
};

const getLearningStyleElaboration = (learningStyle) => {
  const elaborations = {
    'Visual': 'You learn best through visual aids, diagrams, charts, and written materials.',
    'Auditory': 'You prefer learning through listening, discussions, and verbal explanations.',
    'Kinesthetic': 'You learn most effectively through hands-on experience and physical activities.',
    'Mixed': 'You have a versatile learning style, adapting to various methods as needed.'
  };

  return elaborations[learningStyle] || 'You have a flexible learning approach.';
};

export default CareerReport;
