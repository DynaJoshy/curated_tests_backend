import { PrismaClient } from '@prisma/client';

// Reuse PrismaClient across lambda invocations to avoid connection exhaustion on serverless platforms
const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

// Inline aptitude questions data to avoid import issues in Vercel serverless functions
const aptitudeQuestions = {
  numerical: [
    { text: "What is 15% of 200?", options: ["20", "25", "30", "35"], correct: "30" },
    { text: "If 3 apples cost $1.50, how much do 9 apples cost?", options: ["$3.00", "$4.50", "$5.00", "$6.00"], correct: "$4.50" },
    { text: "What is the next number in the sequence: 2, 4, 8, 16, ...?", options: ["24", "32", "28", "20"], correct: "32" },
    { text: "A train travels 120 km in 2 hours. What is its speed?", options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"], correct: "60 km/h" },
    { text: "If x + 5 = 12, what is x?", options: ["5", "6", "7", "8"], correct: "7" }
  ],
  verbal: [
    { text: "Choose the word that is most similar to 'Happy':", options: ["Sad", "Joyful", "Angry", "Tired"], correct: "Joyful" },
    { text: "Complete the analogy: Book is to Library as Painting is to:", options: ["Museum", "School", "Hospital", "Market"], correct: "Museum" },
    { text: "Which word does NOT belong: Apple, Banana, Carrot, Orange?", options: ["Apple", "Banana", "Carrot", "Orange"], correct: "Carrot" },
    { text: "What is the opposite of 'Brave'?", options: ["Cowardly", "Strong", "Smart", "Fast"], correct: "Cowardly" },
    { text: "Choose the correct spelling:", options: ["Recieve", "Receive", "Receeve", "Recive"], correct: "Receive" }
  ],
  spatial: [
    { text: "Which shape can be folded into a cube?", options: ["Net A", "Net B", "Net C", "Net D"], correct: "Net A" },
    { text: "If you rotate a square 90 degrees clockwise, what happens?", options: ["It becomes a circle", "It stays the same", "It becomes a triangle", "It disappears"], correct: "It stays the same" },
    { text: "Which of these is a 3D shape?", options: ["Square", "Cube", "Line", "Point"], correct: "Cube" },
    { text: "How many faces does a tetrahedron have?", options: ["3", "4", "5", "6"], correct: "4" },
    { text: "Which pattern completes the sequence?", options: ["Pattern A", "Pattern B", "Pattern C", "Pattern D"], correct: "Pattern B" }
  ],
  mechanical: [
    { text: "What happens when you pull a spring?", options: ["It gets shorter", "It gets longer", "It breaks", "It stays the same"], correct: "It gets longer" },
    { text: "Which tool is used to measure length?", options: ["Thermometer", "Ruler", "Scale", "Compass"], correct: "Ruler" },
    { text: "What principle explains why boats float?", options: ["Gravity", "Buoyancy", "Magnetism", "Electricity"], correct: "Buoyancy" },
    { text: "How does a lever work?", options: ["By pushing", "By multiplying force", "By heating", "By cooling"], correct: "By multiplying force" },
    { text: "What is needed to create electricity in a circuit?", options: ["Water", "Battery", "Paper", "Wood"], correct: "Battery" }
  ],
  logical: [
    { text: "If all roses are flowers, and some flowers are red, are all roses red?", options: ["Yes", "No", "Maybe", "Sometimes"], correct: "No" },
    { text: "Complete the pattern: 1, 3, 6, 10, 15, ...", options: ["20", "21", "22", "25"], correct: "21" },
    { text: "Which conclusion follows: All scientists are curious. John is curious. Therefore:", options: ["John is a scientist", "John might be a scientist", "John is not a scientist", "No conclusion"], correct: "No conclusion" },
    { text: "If A > B and B > C, then:", options: ["A > C", "A < C", "A = C", "Cannot determine"], correct: "A > C" },
    { text: "Which number is missing: 2, 5, 10, 17, 26, ?", options: ["35", "37", "39", "41"], correct: "37" }
  ]
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { accessToken, section, answers, assessmentType } = req.body;

      // Validate required fields
      if (!accessToken || !section || !answers) {
        return res.status(400).json({ error: 'accessToken, section, and answers are required' });
      }

      // Check if this is a VHSC assessment
      if (assessmentType === 'vhsc') {
        // For VHSC, we need to aggregate responses and save to StreamAssessment
        let existingAssessment;
        try {
          existingAssessment = await prisma.streamAssessment.findFirst({
            where: { accessToken: accessToken },
          });
        } catch (dbError) {
          console.error('Database error querying existing streamAssessment:', dbError);
          throw new Error('Failed to check existing assessment data');
        }

        // Collect all existing VHSC responses for this token to build the assessment
        let allResponses;
        try {
          allResponses = await prisma.response.findMany({
            where: {
              accessToken: accessToken,
              section: {
                startsWith: 'vhsc-'
              }
            },
          });
        } catch (dbError) {
          console.error('Database error querying existing responses:', dbError);
          throw new Error('Failed to retrieve existing responses');
        }

        // Add the current response to the collection
        const currentResponse = { section, answers };
        const allVHSCResponses = [...allResponses, currentResponse];

        // Build the assessment data from all VHSC responses
        const assessmentData = buildStreamAssessmentData(allVHSCResponses);

        if (existingAssessment) {
          // Update existing assessment
          let updatedAssessment;
          try {
            updatedAssessment = await prisma.streamAssessment.update({
              where: { accessToken: accessToken },
              data: assessmentData,
            });
          } catch (dbError) {
            console.error('Database error updating streamAssessment:', dbError);
            throw new Error('Failed to update assessment data');
          }
          res.status(200).json(updatedAssessment);
        } else {
          // Create new assessment
          let newAssessment;
          try {
            newAssessment = await prisma.streamAssessment.create({
              data: {
                accessToken: accessToken,
                ...assessmentData,
              },
            });
          } catch (dbError) {
            console.error('Database error creating streamAssessment:', dbError);
            throw new Error('Failed to create assessment data');
          }
          res.status(200).json(newAssessment);
        }

        // Save individual response to Response table for VHSC as well
        try {
          await prisma.response.create({
            data: {
              accessToken: accessToken,
              section,
              answers,
            },
          });
        } catch (dbError) {
          console.error('Database error saving individual response:', dbError);
          // Don't throw here as the main assessment was saved successfully
        }
      } else {
        // Regular assessment - save to Response table
        let response;
        try {
          response = await prisma.response.create({
            data: {
              accessToken: accessToken,
              section,
              answers,
            },
          });
        } catch (dbError) {
          console.error('Database error creating response:', dbError);
          throw new Error('Failed to save response');
        }
        res.status(200).json(response);
      }
    } catch (error) {
      console.error('Error creating response:', error);
      const payload = { error: 'Failed to save response' };
      if (process.env.NODE_ENV !== 'production') {
        payload.details = error?.message;
        payload.code = error?.code;
      }
      res.status(500).json(payload);
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to build stream assessment data from responses
function buildStreamAssessmentData(responses) {
  const assessmentData = {
    aptitudeScores: {},
    interestScores: {},
    academicPerformance: {},
    personalityTraits: {},
    contextualInputs: {},
  };

  responses.forEach(response => {
    const { section, answers } = response;

    switch (section) {
      case 'vhsc-aptitude':
        // Process aptitude answers and calculate scores
        assessmentData.aptitudeScores = calculateAptitudeScores(answers);
        break;
      case 'vhsc-academic':
        // Process academic performance
        assessmentData.academicPerformance = calculateAcademicScores(answers);
        break;
      case 'vhsc-career':
        // Process RIASEC interests
        assessmentData.interestScores = calculateRIASEC(answers);
        break;
      case 'vhsc-personality':
        // Process personality traits
        assessmentData.personalityTraits = calculatePersonality(answers);
        break;
      case 'vhsc-intelligences':
        // Multiple intelligences (can be part of personality or separate)
        break;
      case 'vhsc-context':
        // Process contextual inputs
        assessmentData.contextualInputs = calculateContextual(answers);
        break;
    }
  });

  return assessmentData;
}

// Helper functions to calculate scores
function calculateAptitudeScores(answers) {
  // Validate and calculate scores based on correct answers
  const scores = { numerical: 0, verbal: 0, spatial: 0, mechanical: 0, logical: 0 };
  const counts = { numerical: 0, verbal: 0, spatial: 0, mechanical: 0, logical: 0 };

  // Map question indices to aptitude types (1-based indexing for q1, q2, etc.)
  const aptitudeMapping = {
    // Numerical: questions 1-5
    1: 'numerical', 2: 'numerical', 3: 'numerical', 4: 'numerical', 5: 'numerical',
    // Verbal: questions 6-10
    6: 'verbal', 7: 'verbal', 8: 'verbal', 9: 'verbal', 10: 'verbal',
    // Spatial: questions 11-15
    11: 'spatial', 12: 'spatial', 13: 'spatial', 14: 'spatial', 15: 'spatial',
    // Mechanical: questions 16-20
    16: 'mechanical', 17: 'mechanical', 18: 'mechanical', 19: 'mechanical', 20: 'mechanical',
    // Logical: questions 21-25
    21: 'logical', 22: 'logical', 23: 'logical', 24: 'logical', 25: 'logical'
  };

  Object.entries(answers).forEach(([questionIndex, answer]) => {
    const index = parseInt(questionIndex.replace('q', ''));
    const type = aptitudeMapping[index];
    if (type && aptitudeQuestions[type]) {
      const questionList = aptitudeQuestions[type];
      const questionIndexInType = (index - 1) % 5; // 0-4 for each type
      const question = questionList[questionIndexInType];
      if (question && answer) {
        const isCorrect = answer === question.correct;
        const score = isCorrect ? 100 : 0;
        scores[type] += score;
        counts[type] += 1;
      }
    }
  });

  // Calculate averages and round to one decimal place
  Object.keys(scores).forEach(type => {
    if (counts[type] > 0) {
      scores[type] = Math.round((scores[type] / counts[type]) * 10) / 10;
    }
  });

  return scores;
}

function calculateAcademicScores(answers) {
  const scores = {};
  // Map question indices to subjects
  const subjectMapping = {
    0: 'Mathematics',
    1: 'Science',
    2: 'English',
    3: 'Social Science',
    4: 'Languages'
  };

  // Map percentage ranges to numerical scores
  const gradeMapping = {
    '81-100%': 90,
    '61-80%': 70,
    '41-60%': 50,
    '0-40%': 20
  };

  // Validate and calculate numerical scores
  Object.keys(answers).forEach(key => {
    const answer = answers[key];
    const index = parseInt(key.replace('q', '')) - 1;
    const subject = subjectMapping[index];
    if (subject && answer && gradeMapping[answer] !== undefined) {
      scores[subject] = gradeMapping[answer];
    }
  });
  return scores;
}

function calculateRIASEC(answers) {
  // RIASEC calculation logic - count Yes answers for each category
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // RIASEC mapping based on question indices
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
}

function calculatePersonality(answers) {
  // Big Five personality calculation - count responses for each trait
  const traitCounts = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0
  };

  // Map personality answers to Big Five traits
  const personalityMapping = {
    'Values and wisdom': 'openness',
    'Integrity and perfection': 'conscientiousness',
    'Work hard play hard': 'conscientiousness',
    'Stability and balance': 'agreeableness',
    'I am comfortable dealing with conflict and helping people find middle ground. My role is the mediator.': 'agreeableness',
    'I make sure everything and everyone is taken care of. My role is the protector.': 'agreeableness',
    'I help my family understand work ethic, hustle, and the value of having resources. My role is material support.': 'conscientiousness',
    'I focus on nurturing and wanting a healthy and content family.': 'agreeableness',
    'Honest and smart': 'openness',
    'Strong presence and power': 'extraversion',
    'Fun and dynamic': 'extraversion',
    'Reliable and respectful': 'conscientiousness',
    'Documentaries, biographies, human observation': 'openness',
    'Entertainment, politics, current affairs': 'extraversion',
    'Comedy, sport, drama, motivational stories': 'extraversion',
    'Soap operas, reality TV, family, gossip, daytime shows': 'neuroticism',
    'Calm, composed, balanced': 'agreeableness',
    'Irritated, frustrated, angry': 'neuroticism',
    'Moody, loud, restless': 'neuroticism',
    'Lazy, depressed, worried': 'neuroticism'
  };

  Object.values(answers).forEach(answer => {
    if (answer && personalityMapping[answer]) {
      const trait = personalityMapping[answer];
      traitCounts[trait] += 1;
    }
  });

  // Convert counts to percentage scores (0-100) and round to one decimal place
  const totalAnswers = Object.values(traitCounts).reduce((sum, count) => sum + count, 0);
  const scores = {};
  Object.keys(traitCounts).forEach(trait => {
    scores[trait] = totalAnswers > 0 ? Math.round((traitCounts[trait] / totalAnswers) * 1000) / 10 : 0;
  });

  return scores;
}

function calculateContextual(answers) {
  const scores = {};
  Object.keys(answers).forEach(key => {
    const answer = answers[key];
    if (answer) {
      if (answer.includes('Very') || answer.includes('Excellent')) scores[key] = 90;
      else if (answer.includes('Moderately') || answer.includes('Good')) scores[key] = 70;
      else if (answer.includes('Somewhat')) scores[key] = 50;
      else scores[key] = 30;
    }
  });
  return scores;
}


