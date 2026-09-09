import { Question, SectionId } from '../types';

export const SYLLABUS_SECTIONS: { id: SectionId; name: string; description: string; icon: string; topics: string[] }[] = [
  {
    id: 'data_analysis',
    name: 'Data Analysis',
    description: 'Descriptive statistics, probabilities, combinations, quartiles & graphical data interpretations.',
    icon: 'BarChart3',
    topics: [
      'Mean, Median, Mode & Range',
      'Standard Deviation & Variance',
      'Quartiles & Interquartile Range (IQR)',
      'Boxplots, Scatterplots & Histograms',
      'Elementary & Conditional Probability',
      'Permutations & Combinations',
      'Venn Diagrams & Set Counting'
    ]
  },
  {
    id: 'applied_math',
    name: 'Applied Mathematics',
    description: 'Real-world modeling, calculus, vectors, mechanics, chemical stoichiometry & logarithms.',
    icon: 'Calculator',
    topics: [
      'Rates of Change & Applied Calculus',
      'Vectors & Dot/Cross Products',
      'Dilutions & Stoichiometric Calculations',
      'pH, Decibels & Logarithmic Scales',
      'Kinematics, Work & Power Mechanics',
      'Trigonometry & Elevation Angles',
      'Complex Numbers & De Moivre Theorem'
    ]
  },
  {
    id: 'general_knowledge',
    name: 'General Knowledge',
    description: 'African heritage, innovation, Nollywood, Afrobeats, geography, literature & socio-politics.',
    icon: 'Globe2',
    topics: [
      'Music, Film & Nollywood Culture',
      'Pan-African History & Pre-colonial Empires',
      'Indigenous Textiles (Adire, Kente, Aso-Oke)',
      'Geographical Landmarks & African Union',
      'African Literature (Soyinka, Achebe, Ba)',
      'Green Innovations & African Mega-Infrastructures',
      'Traditional African Strategy Games'
    ]
  },
  {
    id: 'verbal_reasoning',
    name: 'Verbal & Logical Reasoning',
    description: 'Analogies, syllogisms, blood relations, letter coding, assumptions & deduction puzzles.',
    icon: 'BrainCircuit',
    topics: [
      'Blood Relations & Family Trees',
      'Coded Statements & Operators',
      'Syllogism & Logical Deduction',
      'Statement & Assumption / Conclusion',
      'Word Analogies & Odd-One-Out',
      'Alphabet & Letter Group Series',
      'Direction Sense & Displacement'
    ]
  }
];

export const QUESTION_BANK: Question[] = [
  // ================= DATA ANALYSIS (Including Syllabus Samples) =================
  {
    id: 'da-01',
    section: 'data_analysis',
    topic: 'Elementary Probability',
    question: 'Two silver coins are tossed 400 times, and we observe: Two heads - 115 times, One head - 185 times, No heads - 100 times. What is the empirical probability of getting exactly two heads?',
    options: ['1.000', '0.2500', '0.2875', '0.4625'],
    correctIndex: 2,
    explanation: 'Probability = (Favorable outcomes) / (Total trials) = 115 / 400 = 0.2875 (or 28.75%).',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q1'
  },
  {
    id: 'da-02',
    section: 'data_analysis',
    topic: 'Elementary Probability',
    question: 'What is the probability that a pair of fair standard six-sided dice rolled together will turn up a sum of three?',
    options: ['1/18', '1/9', '1/3', '1/36'],
    correctIndex: 0,
    explanation: 'Total outcomes for two dice = 6 × 6 = 36. Outcomes with sum = 3 are (1,2) and (2,1) — exactly 2 outcomes. Thus P(sum = 3) = 2/36 = 1/18.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q2'
  },
  {
    id: 'da-03',
    section: 'data_analysis',
    topic: 'Counting Methods (Permutations)',
    question: "How many distinct ways can the letters of the word 'LEADERS' be arranged?",
    options: ['1260', '5040', '360', '2520'],
    correctIndex: 3,
    explanation: "'LEADERS' has 7 letters with the letter 'E' repeated twice. Distinct permutations = 7! / 2! = 5040 / 2 = 2520.",
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q3'
  },
  {
    id: 'da-04',
    section: 'data_analysis',
    topic: 'Basic Descriptive Statistics',
    question: 'What is the median of the following 14 test scores: 7, 3, 2, 5, 4, 3, 9, 9, 8, 4, 5, 5, 4, 3?',
    options: ['5.5', '5.0', '4.0', '4.5'],
    correctIndex: 3,
    explanation: 'Arranging the 14 numbers in ascending order: 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 7, 8, 9, 9. Since n = 14 (even), the median is the mean of the 7th and 8th scores: (4 + 5) / 2 = 4.5.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q4'
  },
  {
    id: 'da-05',
    section: 'data_analysis',
    topic: 'Quartiles & Percentiles',
    question: 'Find the first quartile (Q1) for the marks of eight students: 21, 49, 28, 53, 24, 64, 33, 56.',
    options: ['28.0', '24.25', '26.0', '25.0'],
    correctIndex: 2,
    explanation: 'Sorted data: 21, 24, 28, 33, 49, 53, 56, 64. The lower half of the 8 scores is [21, 24, 28, 33]. The median of this lower half (Q1) is (24 + 28) / 2 = 26.0.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q5'
  },
  {
    id: 'da-06',
    section: 'data_analysis',
    topic: 'Basic Descriptive Statistics',
    question: 'For a moderately skewed distribution, the Mean = 15 and the Mode = 6. Using Pearson’s empirical relationship, find the value of the Median.',
    options: ['10', '15', '24', '12'],
    correctIndex: 3,
    explanation: "Pearson's empirical rule states: Mode = 3(Median) - 2(Mean). Substituting: 6 = 3(Median) - 2(15) => 6 = 3(Median) - 30 => 36 = 3(Median) => Median = 12.",
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q6'
  },
  {
    id: 'da-07',
    section: 'data_analysis',
    topic: 'Probability of Independent Events',
    question: 'If events A and B are independent events in a sample space, what is the formula for P(A and B)?',
    options: ['P(A) + P(B)', 'P(A) - P(B)', 'P(A) / P(B)', 'P(A) × P(B)'],
    correctIndex: 3,
    explanation: 'By the multiplication rule of independent events, P(A ∩ B) = P(A) × P(B).',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q7'
  },
  {
    id: 'da-08',
    section: 'data_analysis',
    topic: 'Arithmetic Sequences in Counting',
    question: 'A man ate 500 bananas over 10 days, each day eating 10 more than the previous day. How many bananas did he eat on the first day?',
    options: ['20 bananas', '15 bananas', '10 bananas', '5 bananas'],
    correctIndex: 3,
    explanation: 'Sum of arithmetic progression: S_n = (n/2)[2a + (n - 1)d]. Here n = 10, d = 10, S_10 = 500. So 500 = 5[2a + 9(10)] => 100 = 2a + 90 => 2a = 10 => a = 5 bananas.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 2 Sample Q8'
  },
  {
    id: 'da-09',
    section: 'data_analysis',
    topic: 'Descriptive Statistics (Dispersion)',
    question: 'In a dataset where each observation is multiplied by a constant factor of 3 and then 5 is added, how does the standard deviation change?',
    options: [
      'It increases by 5',
      'It triples (multiplied by 3)',
      'It is multiplied by 3 and increased by 5',
      'It remains unchanged'
    ],
    correctIndex: 1,
    explanation: 'Adding a constant does not change the spread/variance. Multiplying every value by a constant k scales the standard deviation by |k|. Hence, the new standard deviation is multiplied by 3.',
    difficulty: 'Medium'
  },
  {
    id: 'da-10',
    section: 'data_analysis',
    topic: 'Venn Diagrams & Sets',
    question: 'In a university cohort of 120 students, 70 study Python, 55 study R, and 25 study both. How many students study neither Python nor R?',
    options: ['15', '20', '25', '30'],
    correctIndex: 1,
    explanation: '|Python ∪ R| = 70 + 55 - 25 = 100 students. Those studying neither = 120 - 100 = 20 students.',
    difficulty: 'Easy'
  },
  {
    id: 'da-11',
    section: 'data_analysis',
    topic: 'Normal Distribution',
    question: 'Under a standard normal distribution curve, approximately what percentage of data falls within 2 standard deviations (μ ± 2σ) of the mean?',
    options: ['68.2%', '90.0%', '95.4%', '99.7%'],
    correctIndex: 2,
    explanation: 'According to the Empirical Rule (68-95-99.7 rule), approximately 95.4% (commonly rounded to 95%) of values lie within 2 standard deviations of the mean.',
    difficulty: 'Easy'
  },
  {
    id: 'da-12',
    section: 'data_analysis',
    topic: 'Combinations & Selection',
    question: 'In how many ways can a duel quiz team of 3 students be selected from a pool of 8 eligible candidates?',
    options: ['24', '56', '336', '120'],
    correctIndex: 1,
    explanation: 'Selection without order is a combination: 8C3 = 8! / (3! × 5!) = (8 × 7 × 6) / (3 × 2 × 1) = 56 ways.',
    difficulty: 'Easy'
  },
  {
    id: 'da-13',
    section: 'data_analysis',
    topic: 'Interquartile Range & Outliers',
    question: 'A dataset has a lower quartile Q1 = 34 and an upper quartile Q3 = 62. Using the standard 1.5 × IQR rule, any data point above what threshold is classified as an outlier?',
    options: ['90', '104', '97', '100'],
    correctIndex: 1,
    explanation: 'IQR = Q3 - Q1 = 62 - 34 = 28. The upper outlier fence = Q3 + (1.5 × IQR) = 62 + (1.5 × 28) = 62 + 42 = 104.',
    difficulty: 'Medium'
  },
  {
    id: 'da-14',
    section: 'data_analysis',
    topic: 'Conditional Probability',
    question: 'Given P(A) = 0.6, P(B) = 0.5, and P(A ∩ B) = 0.3. What is the conditional probability P(A | B)?',
    options: ['0.50', '0.60', '0.30', '0.18'],
    correctIndex: 1,
    explanation: 'By Bayes/Conditional formula: P(A | B) = P(A ∩ B) / P(B) = 0.3 / 0.5 = 0.60.',
    difficulty: 'Easy'
  },
  {
    id: 'da-15',
    section: 'data_analysis',
    topic: 'Permutations with Constraints',
    question: 'In how many ways can 5 contest debaters be seated in a straight row if two specific rivals refuse to sit next to each other?',
    options: ['48', '72', '120', '96'],
    correctIndex: 1,
    explanation: 'Total unrestricted arrangements = 5! = 120. Number of arrangements where they sit together: treat them as 1 block -> 4! × 2! = 24 × 2 = 48. Refusing to sit together = 120 - 48 = 72.',
    difficulty: 'Hard'
  },
  {
    id: 'am-13',
    section: 'applied_math',
    topic: 'Exponential Growth & Doubling',
    question: 'A culture of bacteria doubles in count every 40 minutes. If initially there are 500 bacteria cells, what will be the bacterial population after 2 hours?',
    options: ['2,000', '3,000', '4,000', '8,000'],
    correctIndex: 2,
    explanation: '2 hours = 120 minutes. Number of doubling periods = 120 / 40 = 3 doublings. Population = 500 × 2³ = 500 × 8 = 4,000 cells.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 13 Logarithms and Exponentials'
  },
  {
    id: 'am-14',
    section: 'applied_math',
    topic: 'Kinematics & Work/Energy',
    question: 'A motor exerts a constant net force of 250 N on a competition cart, moving it through a displacement of 16 meters in the direction of the force in 4 seconds. What is the mechanical power delivered?',
    options: ['1,000 Watts', '4,000 Watts', '250 Watts', '500 Watts'],
    correctIndex: 0,
    explanation: 'Work = Force × Displacement = 250 N × 16 m = 4,000 Joules. Power = Work / Time = 4,000 J / 4 s = 1,000 Watts.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Basic Mechanics'
  },
  {
    id: 'am-15',
    section: 'applied_math',
    topic: 'Complex Numbers & Modulus',
    question: 'Given the complex number z = 3 - 4i, what is its modulus |z| and complex conjugate z*?',
    options: [
      '|z| = 5, z* = 3 + 4i',
      '|z| = 25, z* = 3 + 4i',
      '|z| = 5, z* = -3 - 4i',
      '|z| = 7, z* = 3 + 4i'
    ],
    correctIndex: 0,
    explanation: 'Modulus |z| = √(3² + (-4)²) = √(9 + 16) = √25 = 5. Conjugate z* flips imaginary sign: 3 + 4i.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Complex Numbers'
  },
  {
    id: 'am-16',
    section: 'applied_math',
    topic: 'Trigonometry & Elevation',
    question: 'From an observation point on flat ground 50 meters away from the base of a university tower, the angle of elevation to the top is 45°. How tall is the tower?',
    options: ['25 meters', '50 meters', '50√3 meters', '70.7 meters'],
    correctIndex: 1,
    explanation: 'tan(45°) = Opposite / Adjacent = Height / 50. Since tan(45°) = 1, Height = 50 × 1 = 50 meters.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 14 Trigonometry'
  },
  {
    id: 'gk-13',
    section: 'general_knowledge',
    topic: 'African Geography & Landmarks',
    question: 'Which volcano in Tanzania is the highest peak in Africa and the highest single free-standing mountain in the world above sea level?',
    options: ['Mount Kenya', 'Mount Kilimanjaro', 'Mount Stanley', 'Mount Cameroon'],
    correctIndex: 1,
    explanation: 'Mount Kilimanjaro stands at 5,895 meters (19,341 ft) above sea level, located in north-eastern Tanzania.',
    difficulty: 'Easy'
  },
  {
    id: 'gk-14',
    section: 'general_knowledge',
    topic: 'Cinema & Cultural Festivals',
    question: 'Held biennially in Ouagadougou, Burkina Faso since 1969, which is the largest and most prestigious pan-African film festival?',
    options: ['AFRIFF', 'FESPACO', 'Durban International', 'Carthage Film Festival'],
    correctIndex: 1,
    explanation: 'FESPACO (Panafrican Film and Television Festival of Ouagadougou) is Africa’s premier film festival where winners are awarded the coveted Étalon de Yennenga.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Cinema Cultural Impact'
  },
  {
    id: 'gk-15',
    section: 'general_knowledge',
    topic: 'Indigenous Textiles',
    question: 'The colorful handwoven geometric strip cloth historically associated with the Ashanti Kingdom of Ghana is called:',
    options: ['Kente', 'Aso Oke', 'Kitenge', 'Bògòlanfini'],
    correctIndex: 0,
    explanation: 'Kente cloth is historically produced in Bonwire and surrounding towns in Ghana, woven in strips of silk and cotton with symbolic color patterns.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Fashion and Cultural Identity'
  },
  {
    id: 'vr-11',
    section: 'verbal_reasoning',
    topic: 'Letter & Number Series',
    question: 'Find the next element in the duel series: B2D, D4G, F8K, H16P, ?',
    options: ['J32V', 'J24V', 'I32U', 'J32W'],
    correctIndex: 0,
    explanation: 'First letter advances by +2: B(2), D(4), F(6), H(8) -> J(10). Middle number doubles: 2, 4, 8, 16 -> 32. Third letter gap increases: D(+3)=G, G(+4)=K, K(+5)=P, P(+6)=V. Next is J32V.',
    difficulty: 'Hard',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 5 Alphabet Test'
  },
  {
    id: 'vr-12',
    section: 'verbal_reasoning',
    topic: 'Clock & Direction Reasoning',
    question: 'At 3:15 PM, if the minute hand points precisely East, in what direction does the hour hand point at that exact moment?',
    options: ['Slightly South of East', 'Due East', 'Slightly North of East', 'Due South'],
    correctIndex: 0,
    explanation: 'At 3:15, the minute hand is at 15 minutes (pointing at 3 o’clock = East). The hour hand has moved past 3 towards 4 by 15/60 = 0.25 of an hour (7.5° clockwise / southward). Thus it points slightly South of East.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 5 Direction & Clock'
  },

  // ================= APPLIED MATHEMATICS (Including Syllabus Samples) =================
  {
    id: 'am-01',
    section: 'applied_math',
    topic: 'Logarithms & pH Chemistry',
    question: 'What is the hydrogen ion concentration [H⁺] of an acid solution whose pH is 6.8? (Given 10^0.2 ≈ 1.58)',
    options: ['2.26 × 10⁻⁷ M', '3.02 × 10⁻⁷ M', '2.63 × 10⁻⁷ M', '1.58 × 10⁻⁷ M'],
    correctIndex: 3,
    explanation: 'By definition, pH = -log10[H⁺], so [H⁺] = 10^(-6.8) = 10^(0.2 - 7) = 10^0.2 × 10⁻⁷ ≈ 1.58 × 10⁻⁷ M.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Sample Q1'
  },
  {
    id: 'am-02',
    section: 'applied_math',
    topic: 'Units & Dimensional Conversions',
    question: 'If a vehicle travels 210 miles in 3 hours, what is its average speed converted to miles per second (mps)?',
    options: ['0.0056 mps', '0.0023 mps', '0.012 mps', '0.019 mps'],
    correctIndex: 3,
    explanation: 'Speed = 210 miles / 3 hours = 70 miles/hour. Converting hours to seconds: 70 / 3600 ≈ 0.0194 miles per second.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Sample Q2'
  },
  {
    id: 'am-03',
    section: 'applied_math',
    topic: 'Rates of Change & Volume',
    question: 'A swimming pool is 12m long, 8m wide and 5m deep. It is 60% full of water and drains at a constant rate of 4 kiloliters per minute. How long will it take to drain completely?',
    options: ['87 mins', '50 mins', '71 mins', '72 mins'],
    correctIndex: 3,
    explanation: 'Total volume = 12 × 8 × 5 = 480 m³. Water present = 60% of 480 = 288 m³. Since 1 m³ = 1,000 liters = 1 kiloliter, the volume is 288 kL. Time to drain = 288 kL / (4 kL/min) = 72 minutes.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Sample Q3'
  },
  {
    id: 'am-04',
    section: 'applied_math',
    topic: 'Units & Dimensional Analysis',
    question: 'The elevation at the summit of Mount Whitney is 5,448 meters. Climbers start at a trailhead at 3,050 meters. What is the elevation gain to the nearest foot? (1 foot = 0.3048 meters)',
    options: ['731 feet', '730 feet', '7866 feet', '7867 feet'],
    correctIndex: 3,
    explanation: 'Elevation difference in meters = 5448 - 3050 = 2398 meters. Converting to feet: 2398 / 0.3048 = 7867.45 feet ≈ 7867 feet.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Sample Q4'
  },
  {
    id: 'am-05',
    section: 'applied_math',
    topic: 'Differentials & Approximation',
    question: 'A spherical ball of ice melts such that its radius decreases from 10 cm to 9.92 cm. Using calculus differentials (V = 4/3 π r³), approximately how much does the volume decrease?',
    options: ['101 cm³', '100 cm³', '31 cm³', '32 cm³'],
    correctIndex: 0,
    explanation: 'dV = 4πr² dr. Here r = 10 cm and |dr| = 0.08 cm. dV ≈ 4 × π × (10)² × 0.08 = 32π ≈ 32 × 3.1416 ≈ 100.53 cm³ ≈ 101 cm³.',
    difficulty: 'Hard',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 15 Sample Q5'
  },
  {
    id: 'am-06',
    section: 'applied_math',
    topic: 'Vectors in Mechanics',
    question: 'In triangle DEF, vertex D has position vector d = 3i + 2j, E has vector e = 8i + 12j, and F has vector f = 12i + 15j. In terms of unit vectors i and j, what is the displacement vector EF?',
    options: ['9i + 13j', '6i + 7j', '5i + 10j', '4i + 3j'],
    correctIndex: 3,
    explanation: 'Displacement vector EF = f - e = (12i + 15j) - (8i + 12j) = (12 - 8)i + (15 - 12)j = 4i + 3j.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 12 Sample Q1'
  },
  {
    id: 'am-07',
    section: 'applied_math',
    topic: 'Algebra & Quadratic Equations',
    question: 'Solve the quadratic equation for d: d² – 8d – 33 = 0.',
    options: ['d = 11 and 3', 'd = -1 and 33', 'd = 1 and 33', 'd = 11 and -3'],
    correctIndex: 3,
    explanation: 'Factoring: (d - 11)(d + 3) = 0. Thus the roots are d = 11 and d = -3.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 12 Sample Q3'
  },
  {
    id: 'am-08',
    section: 'applied_math',
    topic: 'Rational Functions & Domain',
    question: 'The rational expression (2g² - 3g - 1) ÷ (mg - 6) is undefined when g = 4. What is the value of m?',
    options: ['3/4', '1/3', '1/2', '3/2'],
    correctIndex: 3,
    explanation: 'A rational expression is undefined when the denominator is zero. At g = 4: m(4) - 6 = 0 => 4m = 6 => m = 6/4 = 3/2.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 12 Sample Q5'
  },
  {
    id: 'am-09',
    section: 'applied_math',
    topic: 'Algebraic Factorization',
    question: 'Factorize the difference of fourth powers: p⁴ - (p - q)⁴.',
    options: [
      'q(2p + q)(2p² - 2pq + q²)',
      'q(2p - q)(2p - 2pq - q²)',
      'q(2p + q)(2p² + 2pq + q²)',
      'q(2p - q)(2p² - 2pq + q²)'
    ],
    correctIndex: 3,
    explanation: 'Using difference of squares: [p² - (p-q)²][p² + (p-q)²]. Note [p - (p-q)][p + (p-q)] = q(2p - q). Expanding the second bracket: p² + p² - 2pq + q² = 2p² - 2pq + q². Product = q(2p - q)(2p² - 2pq + q²).',
    difficulty: 'Hard',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 12 Sample Q6'
  },
  {
    id: 'am-10',
    section: 'applied_math',
    topic: 'Composition of Functions',
    question: 'If f(x) = 2x and g(x) = 3x² + 5, what is the composite function (g ∘ f)(x)?',
    options: ['3x² + 2x + 3', '3x² + 2x + 5', '6x² + 8', '12x² + 5'],
    correctIndex: 3,
    explanation: '(g ∘ f)(x) = g(f(x)) = g(2x) = 3(2x)² + 5 = 3(4x²) + 5 = 12x² + 5.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 12 Sample Q8'
  },
  {
    id: 'am-11',
    section: 'applied_math',
    topic: 'Polynomial Remainder Theorem',
    question: 'Given f(x) = mx³ - x² - 5x + n. When f(x) is divided by (x - 3), the remainder is 36; when divided by (x + 3), the remainder is 40. Find the value of constant n.',
    options: ['42', '1', '13/27', '47'],
    correctIndex: 3,
    explanation: 'f(3) = 27m - 9 - 15 + n = 27m + n - 24 = 36 => 27m + n = 60. f(-3) = -27m - 9 + 15 + n = -27m + n + 6 = 40 => -27m + n = 34. Adding the two equations: 2n = 94 => n = 47.',
    difficulty: 'Hard',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 12 Sample Q9'
  },
  {
    id: 'am-12',
    section: 'applied_math',
    topic: 'Stoichiometry & Dilutions',
    question: 'What volume of a 5.0 M stock HCl solution is required to prepare 500 mL of a 0.50 M HCl solution?',
    options: ['25 mL', '50 mL', '100 mL', '250 mL'],
    correctIndex: 1,
    explanation: 'Using the dilution equation M1 × V1 = M2 × V2: (5.0 M)(V1) = (0.50 M)(500 mL) => V1 = 250 / 5.0 = 50 mL.',
    difficulty: 'Easy'
  },

  // ================= GENERAL KNOWLEDGE (UDuel African Focus) =================
  {
    id: 'gk-01',
    section: 'general_knowledge',
    topic: 'Music & Cultural Icons',
    question: 'Which legendary Nigerian musician and multi-instrumentalist pioneered the Afrobeat musical genre and founded the Kalakuta Republic?',
    options: ['King Sunny Ade', 'Fela Anikulapo Kuti', 'Femi Kuti', 'Victor Uwaifo'],
    correctIndex: 1,
    explanation: 'Fela Kuti created Afrobeat in the late 1960s by fusing traditional Yoruba rhythms, highlife, jazz, and funk with socio-political commentary.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Music & Film'
  },
  {
    id: 'gk-02',
    section: 'general_knowledge',
    topic: 'Nollywood History',
    question: 'Which 1992 direct-to-video drama directed by Chris Obi Rapu is widely recognized as marking the boom and genesis of the modern Nollywood movie industry?',
    options: ['Living in Bondage', 'Osuofia in London', 'The Figurine', 'Saworoide'],
    correctIndex: 0,
    explanation: "'Living in Bondage' (1992), produced by Kenneth Nnebue, sold hundreds of thousands of VHS copies and sparked the modern Nollywood commercial renaissance.",
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Nollywood Cinema'
  },
  {
    id: 'gk-03',
    section: 'general_knowledge',
    topic: 'Indigenous Textiles & Heritage',
    question: "The traditional indigo resist-dyed textile famous among the Yoruba people of southwestern Nigeria is known as what?",
    options: ['Kente', 'Bogolanfini (Mudcloth)', 'Adire', 'Shweshwe'],
    correctIndex: 2,
    explanation: "Adire is the Yoruba resist-dyed cloth using cassava starch paste (Adire Eleko) or tying/stitching techniques (Adire Oniko) with natural indigo dyes.",
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Indigenous Fabrics'
  },
  {
    id: 'gk-04',
    section: 'general_knowledge',
    topic: 'Pan-Africanism & Governance',
    question: 'In which African capital city is the permanent headquarters of the African Union (AU) located?',
    options: ['Nairobi, Kenya', 'Cairo, Egypt', 'Addis Ababa, Ethiopia', 'Accra, Ghana'],
    correctIndex: 2,
    explanation: 'The African Union (and its predecessor, the OAU founded in 1963) is headquartered in Addis Ababa, Ethiopia.',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Pan-Africanism'
  },
  {
    id: 'gk-05',
    section: 'general_knowledge',
    topic: 'Literature & Nobel Laureates',
    question: 'Who was the first African writer to be awarded the Nobel Prize in Literature in 1986?',
    options: ['Chinua Achebe', 'Wole Soyinka', 'Ngũgĩ wa Thiong’o', 'Naguib Mahfouz'],
    correctIndex: 1,
    explanation: 'Wole Soyinka was awarded the Nobel Prize in Literature in 1986 "in a wide cultural perspective and with poetic overtones fashioning the drama of existence."',
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Literature & Authors'
  },
  {
    id: 'gk-06',
    section: 'general_knowledge',
    topic: 'Green Innovations & Climate',
    question: 'The multinational African-led initiative aiming to restore 100 million hectares of degraded land across the Sahel from Senegal to Djibouti is known as:',
    options: [
      'The Great Green Wall',
      'The Sahara Oasis Project',
      'The Green Belt Movement',
      'The Congo Rainforest Accord'
    ],
    correctIndex: 0,
    explanation: 'The Great Green Wall for the Sahara and the Sahel Initiative is an AU flagship partnership to combat desertification, drought, and climate change.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Climate & Green Innovations'
  },
  {
    id: 'gk-07',
    section: 'general_knowledge',
    topic: 'Renewable Mega-Projects',
    question: 'The Noor Ouarzazate Solar Complex, one of the world’s largest concentrated solar power (CSP) facilities, is located in which African country?',
    options: ['South Africa', 'Egypt', 'Morocco', 'Kenya'],
    correctIndex: 2,
    explanation: 'The Noor Complex is situated in the Drâa-Tafilalet region of Morocco, covering thousands of hectares and utilizing molten salt storage.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Solar & Green Innovations'
  },
  {
    id: 'gk-08',
    section: 'general_knowledge',
    topic: 'Traditional African Games',
    question: 'What is the Yoruba name for the ancient traditional board game played with 48 seeds across two rows of six carved pits?',
    options: ['Ayo Olopon', 'Damer', 'Senet', 'Morabaraba'],
    correctIndex: 0,
    explanation: 'Ayo Olopon ("game of the wooden tray") is the traditional Yoruba mancala game requiring mathematical calculation, strategic traps, and fast fingers.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 16 Traditional Games'
  },
  {
    id: 'gk-09',
    section: 'general_knowledge',
    topic: 'Historical & Political Development',
    question: 'The ancient pre-colonial civilization renowned for its massive stone curved enclosure walls constructed without mortar in Southern Africa is:',
    options: ['Great Zimbabwe', 'Axum', 'Kingdom of Kush', 'Kongo Empire'],
    correctIndex: 0,
    explanation: 'Great Zimbabwe was a flourishing medieval Shona kingdom between the 11th and 15th centuries, renowned for its towering dry-stone masonry.',
    difficulty: 'Medium'
  },
  {
    id: 'gk-10',
    section: 'general_knowledge',
    topic: 'Science & Environmental Leadership',
    question: 'Who founded the Green Belt Movement in Kenya, mobilizing thousands of women to plant trees, and became the first African woman to win the Nobel Peace Prize (2004)?',
    options: ['Graça Machel', 'Ellen Johnson Sirleaf', 'Wangari Maathai', 'Ngozi Okonjo-Iweala'],
    correctIndex: 2,
    explanation: 'Professor Wangari Maathai was awarded the 2004 Nobel Peace Prize for her persistent contribution to sustainable development, democracy, and peace.',
    difficulty: 'Easy'
  },
  {
    id: 'gk-11',
    section: 'general_knowledge',
    topic: 'African Literature',
    question: "Chinua Achebe's internationally acclaimed 1958 masterpiece 'Things Fall Apart' derives its title from which W.B. Yeats poem?",
    options: ['The Wild Swans at Coole', 'The Second Coming', 'Sailing to Byzantium', 'Easter, 1916'],
    correctIndex: 1,
    explanation: "The title is taken directly from W.B. Yeats' poem 'The Second Coming': 'Turning and turning in the widening gyre / The falcon cannot hear the falconer; / Things fall apart; the centre cannot hold.'",
    difficulty: 'Medium'
  },
  {
    id: 'gk-12',
    section: 'general_knowledge',
    topic: 'African Economy & Institutions',
    question: 'Who became the first woman and the first African to serve as Director-General of the World Trade Organization (WTO) in 2021?',
    options: ['Amina J. Mohammed', 'Ngozi Okonjo-Iweala', 'Samia Suluhu Hassan', 'Oby Ezekwesili'],
    correctIndex: 1,
    explanation: 'Dr. Ngozi Okonjo-Iweala was confirmed as WTO Director-General on March 1, 2021, representing historic global leadership from Nigeria.',
    difficulty: 'Easy'
  },

  // ================= VERBAL & LOGICAL REASONING =================
  {
    id: 'vr-01',
    section: 'verbal_reasoning',
    topic: 'Blood Relations',
    question: 'BASHIR said to NEEMAH: "That boy playing with the football is the younger of the two brothers of the daughter of my father’s wife." How is the boy playing football related to BASHIR?',
    options: ['Cousin', 'Brother-in-Law', 'Son', 'Brother'],
    correctIndex: 3,
    explanation: "Breakdown: 'My father's wife' is Bashir's mother. 'The daughter of my mother' is Bashir's sister. 'The brother of Bashir's sister' is Bashir's brother. Therefore, the boy is Bashir's brother.",
    difficulty: 'Easy',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 6 Sample Q1'
  },
  {
    id: 'vr-02',
    section: 'verbal_reasoning',
    topic: 'Coded Relations',
    question: 'Let A + B mean A is sister of B; A × B mean A is wife of B; A % B mean A is father of B; A - B mean A is brother of B. Which expression proves that T is the daughter of P?',
    options: [
      'P × Q % R + S + T',
      'P × Q % R - T + Q',
      'P × Q % R - S - T',
      'P × Q % R - T + S'
    ],
    correctIndex: 3,
    explanation: "In 'P × Q % R - T + S': P is wife of Q (so Q is husband). Q % R means Q is father of R. R - T means R is brother of T (so T is also Q's child). T + S means T is sister of S (so T is female). Since T is female and child of Q & P, T is the daughter of P!",
    difficulty: 'Hard',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 6 Sample Q2'
  },
  {
    id: 'vr-03',
    section: 'verbal_reasoning',
    topic: 'Alphabet Test & Word Formation',
    question: 'Using only the exact available letters in the word "ALPHABET" (each letter used at most as many times as it appears), which valid word can be formed?',
    options: ['PLEAT', 'BREATHE', 'BREADTH', 'BALLET'],
    correctIndex: 0,
    explanation: 'Letters in ALPHABET: A(2), B(1), E(1), H(1), L(1), P(1), T(1). "PLEAT" uses P, L, E, A, T — all are present in ALPHABET. (BREATHE needs R, BREADTH needs R and D, BALLET requires two L\'s).',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 6 Sample Q3'
  },
  {
    id: 'vr-04',
    section: 'verbal_reasoning',
    topic: 'Statement and Conclusion',
    question: 'Statement: In a one-day cricket match, the total runs made by a team were 300. Out of these, 240 runs were made by spinners.\nConclusions:\nI. 80% of the team consists of spinners.\nII. The opening batsmen were spinners.\nWhich conclusion logically follows?',
    options: [
      'Only conclusion I follows',
      'Only conclusion II follows',
      'Both I and II follow',
      'Neither I nor II follows'
    ],
    correctIndex: 3,
    explanation: 'The statement solely discloses the distribution of runs scored; it gives no information about the total number of players who are spinners in the 11-man squad, nor who opened the batting. Therefore, neither conclusion follows.',
    difficulty: 'Medium',
    fromSyllabus: true,
    referenceSource: 'UDuel Syllabus - Page 6 Sample Q4'
  },
  {
    id: 'vr-05',
    section: 'verbal_reasoning',
    topic: 'Syllogism',
    question: 'Statements:\n1. All scientists are thinkers.\n2. Some thinkers are poets.\nWhich conclusion is guaranteed valid?',
    options: [
      'All scientists are poets',
      'Some poets are scientists',
      'Some thinkers are scientists',
      'No poet is a scientist'
    ],
    correctIndex: 2,
    explanation: "If 'All scientists are thinkers' is true, then by subalternation/conversion, 'Some thinkers are scientists' must necessarily be true.",
    difficulty: 'Medium'
  },
  {
    id: 'vr-06',
    section: 'verbal_reasoning',
    topic: 'Direction Sense Test',
    question: 'A student walks 20 meters North, turns right and walks 15 meters, then turns right again and walks 20 meters. How far and in what direction is the student from the starting point?',
    options: ['15 meters East', '15 meters West', '20 meters South', '35 meters North-East'],
    correctIndex: 0,
    explanation: 'Starting at (0,0): 20m North -> (0, 20). Turn right (East) 15m -> (15, 20). Turn right (South) 20m -> (15, 0). The student is 15 meters due East of the starting point.',
    difficulty: 'Easy'
  },
  {
    id: 'vr-07',
    section: 'verbal_reasoning',
    topic: 'Coding & Decoding',
    question: 'If in a duel cipher code, "LAGOS" is encoded as "NCIQU", how is "ABUJA" encoded under the same rule?',
    options: ['CDWLC', 'CDWKB', 'BCWKA', 'DEVKC'],
    correctIndex: 0,
    explanation: 'Letter shift: L(+2)=N, A(+2)=C, G(+2)=I, O(+2)=Q, S(+2)=U. Applying +2 to ABUJA: A(+2)=C, B(+2)=D, U(+2)=W, J(+2)=L, A(+2)=C => CDWLC.',
    difficulty: 'Easy'
  },
  {
    id: 'vr-08',
    section: 'verbal_reasoning',
    topic: 'Analogies',
    question: 'Thermometer is to Temperature as Hygrometer is to:',
    options: ['Pressure', 'Humidity', 'Wind Speed', 'Altitude'],
    correctIndex: 1,
    explanation: 'A thermometer measures temperature; a hygrometer measures humidity (water vapor content of the atmosphere).',
    difficulty: 'Easy'
  },
  {
    id: 'vr-09',
    section: 'verbal_reasoning',
    topic: 'Statement & Assumption',
    question: 'Statement: "Enroll in the University Duel masterclass to sharpen your quick-fire problem-solving skills."\nAssumptions:\nI. Quick-fire problem-solving skills can be improved with structured training.\nII. Students desire to perform better in academic duel competitions.\nWhich assumption(s) is/are implicit?',
    options: ['Only assumption I is implicit', 'Only assumption II is implicit', 'Neither is implicit', 'Both I and II are implicit'],
    correctIndex: 3,
    explanation: 'Any advertisement or invitation assumes both that the offered skill can be cultivated through the training, and that the audience has interest in the intended outcome.',
    difficulty: 'Medium'
  },
  {
    id: 'vr-10',
    section: 'verbal_reasoning',
    topic: 'Classifications / Odd One Out',
    question: 'Choose the word which is least like the other three in the group:',
    options: ['Kano', 'Nairobi', 'Accra', 'Dakar'],
    correctIndex: 0,
    explanation: 'Nairobi (Kenya), Accra (Ghana), and Dakar (Senegal) are sovereign national capitals. Kano is a historic commercial state capital city within Nigeria.',
    difficulty: 'Medium'
  }
];

export const TIMER_PRESETS = [
  { id: 'blitz', label: '10s Lightning Duel', seconds: 10, description: 'Simulates the live buzzer pressure on the UDuel stage', badge: 'Stage Buzzer' },
  { id: 'tournament', label: '20s Tournament', seconds: 20, description: 'Official competition pace balancing speed & precision', badge: 'UDuel Standard' },
  { id: 'standard', label: '30s Duel Pace', seconds: 30, description: 'Generous time to calculate multi-step math problems', badge: 'Recommended' },
  { id: 'study', label: '60s Deliberate Drill', seconds: 60, description: 'Focused learning pace for comprehensive review', badge: 'Deep Prep' },
  { id: 'untimed', label: 'Untimed Practice', seconds: null, description: 'No countdown timer. Solve at your own comfortable pace', badge: 'Zen Study' }
];

export const INITIAL_LEADERBOARD = [
  {
    id: 'lb-1',
    rank: 1,
    name: 'Chukwuemeka Okonkwo',
    university: 'University of Ibadan (UI)',
    rating: 2480,
    duelsWon: 89,
    accuracy: 94.2,
    bestSection: 'Applied Mathematics',
    badge: 'Championship Grandmaster',
    avatarSeed: 'Emeka'
  },
  {
    id: 'lb-2',
    rank: 2,
    name: 'Fatima Abdullahi',
    university: 'Ahmadu Bello University (ABU)',
    rating: 2415,
    duelsWon: 76,
    accuracy: 92.5,
    bestSection: 'Data Analysis',
    badge: 'Master Duelist',
    avatarSeed: 'Fatima'
  },
  {
    id: 'lb-3',
    rank: 3,
    name: 'Tunde Adebayo',
    university: 'University of Lagos (UNILAG)',
    rating: 2380,
    duelsWon: 68,
    accuracy: 90.8,
    bestSection: 'Verbal & Logical Reasoning',
    badge: 'Buzzer Virtuoso',
    avatarSeed: 'Tunde'
  },
  {
    id: 'lb-4',
    rank: 4,
    name: 'Ngozi Okafor',
    university: 'University of Nigeria Nsukka (UNN)',
    rating: 2320,
    duelsWon: 59,
    accuracy: 89.4,
    bestSection: 'General Knowledge',
    badge: 'Trivia Titan',
    avatarSeed: 'Ngozi'
  },
  {
    id: 'lb-5',
    rank: 5,
    name: 'Segun Adeleke',
    university: 'Obafemi Awolowo University (OAU)',
    rating: 2275,
    duelsWon: 51,
    accuracy: 88.0,
    bestSection: 'Applied Mathematics',
    badge: 'Duel Ace',
    avatarSeed: 'Segun'
  },
  {
    id: 'lb-6',
    rank: 6,
    name: 'Blessing Kalu',
    university: 'Covenant University',
    rating: 2210,
    duelsWon: 45,
    accuracy: 87.1,
    bestSection: 'Data Analysis',
    badge: 'Stats Specialist',
    avatarSeed: 'Blessing'
  },
  {
    id: 'lb-7',
    rank: 7,
    name: 'Ibrahim Danjuma',
    university: 'Federal Univ of Tech Akure (FUTA)',
    rating: 2185,
    duelsWon: 42,
    accuracy: 86.4,
    bestSection: 'Applied Mathematics',
    badge: 'Calculus Champion',
    avatarSeed: 'Ibrahim'
  }
];

export const NIGERIAN_UNIVERSITIES = [
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'Ahmadu Bello University (ABU)',
  'University of Nigeria Nsukka (UNN)',
  'University of Benin (UNIBEN)',
  'Federal University of Technology Akure (FUTA)',
  'Covenant University',
  'Lagos State University (LASU)',
  'University of Ilorin (UNILORIN)',
  'Babcock University',
  'Federal University of Agriculture Abeokuta (FUNAAB)',
  'Pan-Atlantic University',
  'Nnamdi Azikiwe University (UNIZIK)'
];
