import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    const processAssessment = async () => {
      const userToken = localStorage.getItem('userToken');
      const assessmentType = localStorage.getItem('assessmentType');

      if (assessmentType === 'vhsc' && userToken) {
        setIsProcessing(true);
        try {
          // Calculate scores and generate report for VHSC assessment
          const response = await fetch(`/api/responses/calculate-scores/${userToken}`, {
            method: 'POST',
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Assessment processed:', result);
            setProcessingComplete(true);
          } else {
            console.error('Failed to process assessment');
          }
        } catch (error) {
          console.error('Error processing assessment:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    processAssessment();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-cyan-300 to-cyan-900">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Thank You for Completing All Tests!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your responses have been recorded successfully. We appreciate your participation.
        </p>

        {isProcessing && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">Processing your assessment results...</p>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {processingComplete && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">✓ Assessment processed successfully!</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Return Home
          </button>
          <button
            onClick={() => navigate('/report')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={isProcessing}
          >
            This is a beautiful yet tragic story. I’ll turn it into a poem, filled with yearning, sorrow, and the ache of lost love. Here it goes:

---

**"The Weight of Forgotten Roads"**

She stood where the river meets the sky,
Her heart an anchor, pulled to where dreams lie.
He, the boy with a humble name,
Her world of wealth, but none to blame.

She was the wind, untamed and free,
He was the earth, steady as could be.
In his eyes, a warmth she'd never known,
Her soul, once cold, found a place to call home.

But the world saw gold, and they saw dust,
Her hands, adorned in diamonds, could never trust.
His hands, though empty, held a truth so pure,
A love so deep, it could endure.

Her parents spoke in voices cold,
Of castles built on silver, of stories untold.
"He's not your equal, daughter, don't you see?
He’s just a shadow—what could he be?"

Yet she danced in dreams where time would bend,
She painted futures with him, her heart's only friend.
But dreams are fragile, and hearts are frail,
When the world says "no," all love can fail.

The years slipped by like rain from skies,
Her joy turned to dust, and so did her sighs.
Her parents, with their hands tight and firm,
Gripped her fate—her life, they'd affirm.

And so, she cried, her soul undone,
For the boy who once had been the sun.
Each tear was a river, each sob was the sea,
As she mourned the love that was never to be.

She walked through days with eyes that knew,
The weight of a world she could not undo.
No path remained, no road to roam,
For without him, she was not whole—no home.

She had been the dreamer, the fire’s spark,
But now, alone, she wanders in the dark.
Her heart—an ember, still burning bright,
Yet without him, it's just an endless night.

**"How could they ask her to forget?"**
She thought with every tear she wept.
In silence, she begged the stars to return
The warmth of love, the flame that burned.

Now, her dreams lie heavy in a forgotten sky,
A love once simple, now a whispered sigh.
She seeks him still, through time’s cruel maze—
For without him, she’s lost in a world of gray.

---

This poem tries to capture the pain of unfulfilled dreams, lost love, and the haunting emptiness she feels in his absence. Let me know if you’d like any changes!

            View & Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
