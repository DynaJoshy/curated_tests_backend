// Aptitude Questions for VHSC Stream Assessment
// Numerical, Verbal, Spatial, Mechanical, Logical/Abstract Reasoning

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
    { text: "Which shape can be folded into a cube?", options: ["Net A", "Net B", "Net C", "Net D"], correct: "Net A" }, // Would need visual options
    { text: "If you rotate a square 90 degrees clockwise, what happens?", options: ["It becomes a circle", "It stays the same", "It becomes a triangle", "It disappears"], correct: "It stays the same" },
    { text: "Which of these is a 3D shape?", options: ["Square", "Cube", "Line", "Point"], correct: "Cube" },
    { text: "How many faces does a tetrahedron have?", options: ["3", "4", "5", "6"], correct: "4" },
    { text: "Which pattern completes the sequence?", options: ["Pattern A", "Pattern B", "Pattern C", "Pattern D"], correct: "Pattern B" } // Would need visual
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

export default aptitudeQuestions;
