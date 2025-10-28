import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to analyze responses (moved from client-side)
const analyzeResponses = (responses) => {
  const sections = {};
  responses.forEach(resp => {
    sections[resp.section] = resp.answers;
  });

  // Analyze career preferences (RIASEC)
  const careerScores = calculateCareerScores(sections.career || {});

  // Analyze personality
  const personalityType = analyzePersonality(sections.personality || {});

  // Analyze intelligences
  const topIntelligences = analyzeIntelligences(sections.intelligences || {});

  // Analyze learning styles
  const learningStyle = analyzeLearning(sections.learning || {});

  // Generate recommendations
  const recommendations = generateRecommendations(careerScores, personalityType, topIntelligences, learningStyle);

  return {
    careerScores,
    personalityType,
    topIntelligences,
    learningStyle,
    recommendations
  };
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

  if (topCareers.includes('C') && topCareers.includes('E')) {
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

// POST /api/reports - Save PDF report
router.post('/', async (req, res) => {
  try {
    const { accessToken, pdfData } = req.body;
    const normalizedToken = typeof accessToken === 'string' ? accessToken.trim().toUpperCase() : accessToken;

    if (!normalizedToken || !pdfData) {
      return res.status(400).json({ error: 'accessToken and pdfData are required' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(pdfData, 'base64');

    const report = await prisma.report.create({
      data: {
        accessToken: normalizedToken,
        pdfData: buffer,
      },
    });

    res.status(201).json({ id: report.id });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// GET /api/reports/:token - Get assessment data
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;

    // First check if it's a VHSC assessment
    const vhscAssessment = await prisma.streamAssessment.findFirst({
      where: { accessToken: normalizedToken },
      orderBy: { createdAt: 'desc' },
    });

    if (vhscAssessment) {
      // Return VHSC assessment data with assessmentType
      return res.json({
        assessmentType: 'vhsc',
        aptitudeScores: vhscAssessment.aptitudeScores,
        interestScores: vhscAssessment.interestScores,
        academicPerformance: vhscAssessment.academicPerformance,
        personalityTraits: vhscAssessment.personalityTraits,
        contextualInputs: vhscAssessment.contextualInputs,
      });
    }

    // For regular assessments, fetch responses and analyze
    const responses = await prisma.response.findMany({
      where: { accessToken: normalizedToken },
    });

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No assessment data found' });
    }

    const analysis = analyzeResponses(responses);
    res.json(analysis);
  } catch (error) {
    console.error('Error retrieving report:', error);
    res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

export default router;
