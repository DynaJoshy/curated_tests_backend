import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get responses by access token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;
    const responses = await prisma.response.findMany({
      where: { accessToken: normalizedToken },
    });
    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Create new response
router.post('/', async (req, res) => {
  try {
    const { accessToken, section, answers } = req.body;
    const normalizedToken = typeof accessToken === 'string' ? accessToken.trim().toUpperCase() : accessToken;

    const response = await prisma.response.create({
      data: {
        accessToken: normalizedToken,
        section,
        answers,
      },
    });

    res.json(response);
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

// Calculate VHSC assessment scores and generate recommendations
router.post('/calculate-scores/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;

    // Fetch all responses for this token
    const responses = await prisma.response.findMany({
      where: { accessToken: normalizedToken },
    });

    if (responses.length === 0) {
      return res.status(400).json({ error: 'No responses found for this token' });
    }

    // Organize responses by section
    const sections = {};
    responses.forEach(resp => {
      sections[resp.section] = resp.answers;
    });

    // Calculate scores for each section
    const aptitudeScores = calculateAptitudeScores(sections.aptitude || {});
    const interestScores = calculateInterestScores(sections.career || {}); // RIASEC from career questions
    const academicPerformance = calculateAcademicScores(sections.academic || {});
    const personalityTraits = calculatePersonalityScores(sections.personality || {});
    const contextualInputs = calculateContextScores(sections.context || {});

    // Calculate composite scores with weights
    const compositeScores = {
      aptitude: (aptitudeScores.numerical + aptitudeScores.verbal + aptitudeScores.spatial + aptitudeScores.mechanical + aptitudeScores.logical) / 5,
      interest: (interestScores.R + interestScores.I + interestScores.A + interestScores.S + interestScores.E + interestScores.C) / 6,
      academic: (academicPerformance.maths + academicPerformance.science + academicPerformance.english + academicPerformance.socialScience + academicPerformance.languages) / 5,
      personality: (personalityTraits.openness + personalityTraits.conscientiousness + personalityTraits.extraversion + personalityTraits.agreeableness + personalityTraits.neuroticism) / 5,
      context: (contextualInputs.careerAwareness + contextualInputs.resourceAccess + contextualInputs.parentalSupport) / 3
    };

    // Weighted composite score (40% aptitude, 25% interest, 20% academic, 10% personality, 5% context)
    const weightedScore = (
      compositeScores.aptitude * 0.4 +
      compositeScores.interest * 0.25 +
      compositeScores.academic * 0.2 +
      compositeScores.personality * 0.1 +
      compositeScores.context * 0.05
    );

    // Generate stream recommendations
    const streamRecommendations = generateStreamRecommendations(aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs);

    // Save to StreamAssessment model
    const assessment = await prisma.streamAssessment.create({
      data: {
        accessToken: normalizedToken,
        aptitudeScores,
        interestScores,
        academicPerformance,
        personalityTraits,
        contextualInputs,
      },
    });

    res.json({
      assessmentId: assessment.id,
      aptitudeScores,
      interestScores,
      academicPerformance,
      personalityTraits,
      contextualInputs,
      compositeScores,
      weightedScore,
      streamRecommendations
    });
  } catch (error) {
    console.error('Error calculating scores:', error);
    res.status(500).json({ error: 'Failed to calculate scores' });
  }
});

// Get StreamAssessment by token
router.get('/assessment/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;

    const assessment = await prisma.streamAssessment.findFirst({
      where: { accessToken: normalizedToken },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Delete responses by access token
router.delete('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;
    await prisma.response.deleteMany({
      where: { accessToken: normalizedToken },
    });
    res.json({ message: 'Responses cleared' });
  } catch (error) {
    console.error('Error clearing responses:', error);
    res.status(500).json({ error: 'Failed to clear responses' });
  }
});

// Helper functions for score calculations
function calculateAptitudeScores(answers) {
  const scores = { numerical: 0, verbal: 0, spatial: 0, mechanical: 0, logical: 0 };

  // Map question indices to aptitude types (based on aptitudeQuestions.jsx)
  const aptitudeMapping = {
    0: 'numerical', 1: 'numerical', 2: 'numerical', 3: 'numerical', 4: 'numerical', // numerical
    5: 'verbal', 6: 'verbal', 7: 'verbal', 8: 'verbal', 9: 'verbal', // verbal
    10: 'spatial', 11: 'spatial', 12: 'spatial', 13: 'spatial', 14: 'spatial', // spatial
    15: 'mechanical', 16: 'mechanical', 17: 'mechanical', 18: 'mechanical', 19: 'mechanical', // mechanical
    20: 'logical', 21: 'logical', 22: 'logical', 23: 'logical', 24: 'logical' // logical
  };

  Object.entries(answers).forEach(([questionIndex, answer]) => {
    const index = parseInt(questionIndex.replace('q', '')) - 1;
    const aptitude = aptitudeMapping[index];
    if (aptitude && answer) {
      // Assuming correct answers give 20 points each (5 questions per type)
      scores[aptitude] += 20; // Simplified scoring
    }
  });

  return scores;
}

function calculateInterestScores(answers) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // RIASEC mapping from careerQuestions.jsx
  const riasecMapping = {
    0: 'R', 6: 'R', 8: 'R', 20: 'R', 21: 'R', 23: 'R', 29: 'R', 33: 'R', 36: 'R', 38: 'R',
    1: 'I', 10: 'I', 17: 'I', 19: 'I', 22: 'I', 25: 'I', 27: 'I', 34: 'I', 40: 'I',
    7: 'A', 16: 'A', 24: 'A', 26: 'A', 29: 'A', 32: 'A', 42: 'A',
    3: 'S', 11: 'S', 12: 'S', 14: 'S', 19: 'S', 37: 'S', 41: 'S',
    9: 'E', 18: 'E', 28: 'E', 30: 'E', 35: 'E', 37: 'E', 43: 'E',
    5: 'C', 8: 'C', 16: 'C', 24: 'C', 26: 'C', 36: 'C'
  };

  Object.entries(answers).forEach(([questionIndex, answer]) => {
    const index = parseInt(questionIndex.replace('q', '')) - 1;
    const category = riasecMapping[index];
    if (category && answer === 'Yes') {
      scores[category] += 1;
    }
  });

  // Convert to percentage (max 10 per category)
  Object.keys(scores).forEach(key => {
    scores[key] = Math.round((scores[key] / 10) * 100);
  });

  return scores;
}

function calculateAcademicScores(answers) {
  const scores = { maths: 0, science: 0, english: 0, socialScience: 0, languages: 0 };

  // Map academic questions to subjects
  const subjectMapping = {
    0: 'maths',
    1: 'science',
    2: 'english',
    3: 'socialScience',
    4: 'languages'
  };

  // Convert percentage ranges to scores
  const scoreMapping = {
    '0-40%': 20,
    '41-60%': 50,
    '61-80%': 70,
    '81-100%': 90
  };

  Object.entries(answers).forEach(([questionIndex, answer]) => {
    const index = parseInt(questionIndex.replace('q', '')) - 1;
    const subject = subjectMapping[index];
    if (subject && answer) {
      scores[subject] = scoreMapping[answer] || 0;
    }
  });

  return scores;
}

function calculatePersonalityScores(answers) {
  // Simplified Big Five calculation based on personality questions
  const scores = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };

  // This is a simplified mapping - in reality, this would require proper psychometric analysis
  Object.values(answers).forEach(answer => {
    // Adjust scores based on selected options (simplified)
    if (answer.includes('Values and wisdom') || answer.includes('Idealistic')) scores.openness += 10;
    if (answer.includes('Integrity') || answer.includes('Perfectionist')) scores.conscientiousness += 10;
    if (answer.includes('Fun and dynamic') || answer.includes('Passionate')) scores.extraversion += 10;
    if (answer.includes('Reliable') || answer.includes('Caring')) scores.agreeableness += 10;
    if (answer.includes('Moody') || answer.includes('Lazy')) scores.neuroticism += 10;
  });

  // Cap at 100
  Object.keys(scores).forEach(key => {
    scores[key] = Math.min(scores[key], 100);
  });

  return scores;
}

function calculateContextScores(answers) {
  const scores = { careerAwareness: 0, resourceAccess: 0, parentalSupport: 0 };

  // Map context questions
  const contextMapping = {
    0: 'careerAwareness',
    1: 'resourceAccess',
    2: 'parentalSupport'
  };

  const scoreMapping = {
    'Not aware at all': 20,
    'Somewhat aware': 40,
    'Moderately aware': 60,
    'Very aware': 80,
    'Limited access': 30,
    'Moderate access': 50,
    'Good access': 70,
    'Excellent access': 90,
    'Not supportive': 25,
    'Somewhat supportive': 50,
    'Moderately supportive': 75,
    'Very supportive': 100
  };

  Object.entries(answers).forEach(([questionIndex, answer]) => {
    const index = parseInt(questionIndex.replace('q', '')) - 1;
    const context = contextMapping[index];
    if (context && answer) {
      scores[context] = scoreMapping[answer] || 0;
    }
  });

  return scores;
}

function generateStreamRecommendations(aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs) {
  // Calculate weighted scores for each stream
  const streams = {
    'Science with PCM/PCB': {
      weight: 0,
      subjects: ['maths', 'science'],
      aptitudes: ['numerical', 'logical', 'spatial'],
      interests: ['I', 'R'], // Investigative, Realistic
      reasoning: 'Strong analytical skills, interest in science and mathematics, suitable for medical and engineering fields.'
    },
    'Science with MLT': {
      weight: 0,
      subjects: ['science', 'english'],
      aptitudes: ['logical', 'verbal', 'mechanical'],
      interests: ['I', 'S'], // Investigative, Social
      reasoning: 'Interest in healthcare sciences, good with practical applications and helping others.'
    },
    'Commerce': {
      weight: 0,
      subjects: ['maths', 'english', 'socialScience'],
      aptitudes: ['numerical', 'verbal', 'logical'],
      interests: ['C', 'E'], // Conventional, Enterprising
      reasoning: 'Strong in business-related subjects, interested in finance, management, and entrepreneurship.'
    },
    'Arts/Humanities': {
      weight: 0,
      subjects: ['english', 'socialScience', 'languages'],
      aptitudes: ['verbal', 'spatial', 'logical'],
      interests: ['A', 'S'], // Artistic, Social
      reasoning: 'Creative and communicative, interested in literature, social sciences, and human behavior.'
    },
    'Vocational/Technical': {
      weight: 0,
      subjects: ['maths', 'science'],
      aptitudes: ['mechanical', 'spatial', 'logical'],
      interests: ['R', 'C'], // Realistic, Conventional
      reasoning: 'Practical and hands-on, interested in technical skills and vocational training.'
    }
  };

  // Calculate academic score (40% weight)
  Object.keys(streams).forEach(stream => {
    const streamSubjects = streams[stream].subjects;
    let academicScore = 0;
    streamSubjects.forEach(subject => {
      academicScore += academicPerformance[subject] || 0;
    });
    streams[stream].academicScore = academicScore / streamSubjects.length;
    streams[stream].weight += streams[stream].academicScore * 0.4;
  });

  // Calculate aptitude score (30% weight)
  Object.keys(streams).forEach(stream => {
    const streamAptitudes = streams[stream].aptitudes;
    let aptitudeScore = 0;
    streamAptitudes.forEach(aptitude => {
      aptitudeScore += aptitudeScores[aptitude] || 0;
    });
    streams[stream].aptitudeScore = aptitudeScore / streamAptitudes.length;
    streams[stream].weight += streams[stream].aptitudeScore * 0.3;
  });

  // Calculate interest score (20% weight)
  Object.keys(streams).forEach(stream => {
    const streamInterests = streams[stream].interests;
    let interestScore = 0;
    streamInterests.forEach(interest => {
      interestScore += interestScores[interest] || 0;
    });
    streams[stream].interestScore = interestScore / streamInterests.length;
    streams[stream].weight += streams[stream].interestScore * 0.2;
  });

  // Add contextual bonus (10% weight)
  const careerAwareness = contextualInputs.careerAwareness || 0;
  const resourceAccess = contextualInputs.resourceAccess || 0;
  const parentalSupport = contextualInputs.parentalSupport || 0;
  const contextualScore = (careerAwareness + resourceAccess + parentalSupport) / 3;

  Object.keys(streams).forEach(stream => {
    streams[stream].weight += contextualScore * 0.1;
  });

  // Sort streams by weight
  const sortedStreams = Object.keys(streams).sort((a, b) => streams[b].weight - streams[a].weight);

  // Generate recommendations
  const recommendations = sortedStreams.map(stream => ({
    stream: stream,
    score: Math.round(streams[stream].weight),
    reasoning: streams[stream].reasoning,
    subjects: streams[stream].subjects,
    careerPaths: getStreamCareerPaths(stream)
  }));

  return recommendations;
}

function getStreamCareerPaths(stream) {
  const careerPaths = {
    'Science with PCM/PCB': [
      'Engineering (Mechanical, Civil, Electrical, Computer)',
      'Medicine (Doctor, Dentist, Pharmacist)',
      'Research Scientist',
      'Information Technology',
      'Architecture',
      'Mathematics and Statistics'
    ],
    'Science with MLT': [
      'Medical Laboratory Technology',
      'Nursing',
      'Biotechnology',
      'Pharmacy',
      'Allied Health Sciences',
      'Clinical Research'
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
    ],
    'Vocational/Technical': [
      'Automotive Technology',
      'Electrical Technology',
      'Construction Technology',
      'Information Technology Support',
      'Welding and Fabrication',
      'Culinary Arts'
    ]
  };
  return careerPaths[stream] || [];
}

export default router;
