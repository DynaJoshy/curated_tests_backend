import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { accessToken, mode, studentDetails } = req.body;
      const normalizedToken = typeof accessToken === 'string' ? accessToken.trim().toUpperCase() : accessToken;

      if (!normalizedToken) {
        return res.status(400).json({ error: 'accessToken is required' });
      }

      if (mode === 'auto') {
        // Fetch assessment and compute recommendations + generate PDF
        const assessment = await prisma.streamAssessment.findFirst({
          where: { accessToken: normalizedToken },
          orderBy: { createdAt: 'desc' },
        });

        if (!assessment) {
          return res.status(404).json({ error: 'Assessment not found for token' });
        }

        // Build recommendations similarly to server route
        const recommendations = buildRecommendations(
          assessment.aptitudeScores,
          assessment.interestScores,
          assessment.academicPerformance,
          assessment.personalityTraits,
          assessment.contextualInputs
        );

        // Generate PDF
        const { pdfBuffer } = await generatePdf({
          studentDetails: studentDetails || {},
          assessment,
          recommendations,
        });

        const report = await prisma.report.create({
          data: {
            accessToken: normalizedToken,
            pdfData: pdfBuffer,
          },
        });

        return res.status(201).json({ id: report.id });
      }

      // Fallback: accept base64 pdfData for manual save
      const { pdfData } = req.body;
      if (!pdfData) {
        return res.status(400).json({ error: 'pdfData is required for manual mode' });
      }
      const buffer = Buffer.from(pdfData, 'base64');
      const report = await prisma.report.create({
        data: {
          accessToken: normalizedToken,
          pdfData: buffer,
        },
      });
      return res.status(201).json({ id: report.id });
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ error: 'Failed to save report' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function buildRecommendations(aptitudeScores, interestScores, academicPerformance, personalityTraits, contextualInputs) {
  // Reuse logic similar to server/routes/responses.js generateStreamRecommendations
  const streams = {
    'Science with PCM/PCB': {
      weight: 0,
      subjects: ['maths', 'science'],
      aptitudes: ['numerical', 'logical', 'spatial'],
      interests: ['I', 'R'],
      reasoning: 'Strong analytical skills, interest in science and mathematics.'
    },
    'Science with MLT': {
      weight: 0,
      subjects: ['science', 'english'],
      aptitudes: ['logical', 'verbal', 'mechanical'],
      interests: ['I', 'S'],
      reasoning: 'Interest in healthcare sciences with practical application.'
    },
    'Commerce': {
      weight: 0,
      subjects: ['maths', 'english', 'socialScience'],
      aptitudes: ['numerical', 'verbal', 'logical'],
      interests: ['C', 'E'],
      reasoning: 'Business-oriented, finance and management interests.'
    },
    'Arts/Humanities': {
      weight: 0,
      subjects: ['english', 'socialScience', 'languages'],
      aptitudes: ['verbal', 'spatial', 'logical'],
      interests: ['A', 'S'],
      reasoning: 'Creative and communicative, interest in literature and society.'
    },
    'Vocational/Technical': {
      weight: 0,
      subjects: ['maths', 'science'],
      aptitudes: ['mechanical', 'spatial', 'logical'],
      interests: ['R', 'C'],
      reasoning: 'Hands-on, practical technical skills inclination.'
    }
  };

  Object.keys(streams).forEach(stream => {
    const s = streams[stream];
    const academicScore = parseFloat((s.subjects.reduce((sum, sub) => sum + (academicPerformance[sub] || 0), 0) / s.subjects.length).toFixed(2));
    s.weight += academicScore * 0.4; // 40%
    const aptitudeScore = parseFloat((s.aptitudes.reduce((sum, ap) => sum + (aptitudeScores[ap] || 0), 0) / s.aptitudes.length).toFixed(2));
    s.weight += aptitudeScore * 0.3; // 30%
    const interestScore = parseFloat((s.interests.reduce((sum, it) => sum + (interestScores[it] || 0), 0) / s.interests.length).toFixed(2));
    s.weight += interestScore * 0.2; // 20%
    const personalityAvg = parseFloat(((personalityTraits.openness + personalityTraits.conscientiousness + personalityTraits.extraversion + personalityTraits.agreeableness + personalityTraits.neuroticism) / 5).toFixed(2));
    s.weight += personalityAvg * 0.1; // 10%
    const contextAvg = parseFloat(((contextualInputs.careerAwareness + contextualInputs.resourceAccess + contextualInputs.parentalSupport) / 3).toFixed(2));
    s.weight += contextAvg * 0.05; // 5%
  });

  const sorted = Object.keys(streams).sort((a, b) => streams[b].weight - streams[a].weight);
  return sorted.map(stream => ({ stream, score: parseFloat(streams[stream].weight.toFixed(2)), reasoning: streams[stream].reasoning }));
}

async function generatePdf({ studentDetails, assessment, recommendations }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve({ pdfBuffer: Buffer.concat(chunks) }));
    doc.on('error', reject);

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    // Title
    doc.fontSize(20).text('VHSC Stream Recommendation Report', { align: 'center' });
    doc.moveDown();

    // Student details
    doc.fontSize(12).text(`Name: ${studentDetails?.name || ''}`);
    doc.text(`Class: ${studentDetails?.currentQualification || ''}`);
    doc.text(`Token: ${studentDetails?.accessToken || ''}`);
    doc.moveDown();

    // Scores summary
    doc.fontSize(14).text('Scores Summary');
    const a = assessment;
    doc.fontSize(12).text(`Aptitude: numerical ${a.aptitudeScores.numerical}, verbal ${a.aptitudeScores.verbal}, spatial ${a.aptitudeScores.spatial}, mechanical ${a.aptitudeScores.mechanical}, logical ${a.aptitudeScores.logical}`);
    doc.text(`Interest (RIASEC): R ${a.interestScores.R}, I ${a.interestScores.I}, A ${a.interestScores.A}, S ${a.interestScores.S}, E ${a.interestScores.E}, C ${a.interestScores.C}`);
    doc.text(`Academic: maths ${a.academicPerformance.maths}, science ${a.academicPerformance.science}, english ${a.academicPerformance.english}, socialScience ${a.academicPerformance.socialScience}, languages ${a.academicPerformance.languages}`);
    doc.text(`Personality: openness ${a.personalityTraits.openness}, conscientiousness ${a.personalityTraits.conscientiousness}, extraversion ${a.personalityTraits.extraversion}, agreeableness ${a.personalityTraits.agreeableness}, neuroticism ${a.personalityTraits.neuroticism}`);
    doc.text(`Context: awareness ${a.contextualInputs.careerAwareness}, resources ${a.contextualInputs.resourceAccess}, support ${a.contextualInputs.parentalSupport}`);
    doc.moveDown();

    // Recommendations
    doc.fontSize(14).text('Top Recommendations');
    recommendations.slice(0, 3).forEach((rec, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${rec.stream} - Score: ${rec.score}`);
      doc.fontSize(10).text(rec.reasoning);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}
