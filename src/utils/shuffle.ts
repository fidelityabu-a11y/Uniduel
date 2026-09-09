import { Question } from '../types';

/**
 * Returns a cryptographically secure uniform random integer in [0, max - 1].
 * Falls back to high-entropy Math.random() if crypto is unavailable.
 */
function getSecureRandomInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const uint32 = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % max);
    let rand = 0;
    do {
      window.crypto.getRandomValues(uint32);
      rand = uint32[0];
    } while (rand >= limit);
    return rand % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * High-entropy Fisher-Yates (Knuth) shuffle algorithm powered by
 * cryptographically secure random values and dual-pass permutation.
 * Guarantees maximum statistical unpredictability and uniform spread.
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  if (!array || array.length <= 1) return [...(array || [])];
  const arr = [...array];

  // Pass 1: Cryptographically seeded Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  // Pass 2: Random offset cut & interleaved riffle for enhanced dispersion
  const cutIndex = getSecureRandomInt(arr.length);
  const part1 = arr.slice(0, cutIndex);
  const part2 = arr.slice(cutIndex);
  const interleaved: T[] = [];
  let p1 = 0;
  let p2 = 0;
  while (p1 < part1.length || p2 < part2.length) {
    if (p1 < part1.length && (p2 >= part2.length || getSecureRandomInt(2) === 0)) {
      interleaved.push(part1[p1++]);
    } else if (p2 < part2.length) {
      interleaved.push(part2[p2++]);
    }
  }

  // Final rapid pass
  for (let i = interleaved.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = interleaved[i];
    interleaved[i] = interleaved[j];
    interleaved[j] = temp;
  }

  return interleaved;
}

/**
 * Shuffles the four options of a question while accurately maintaining
 * the index pointer to the correct answer.
 */
export function shuffleQuestionOptions(q: Question): Question {
  const correctText = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

/**
 * Shuffles both the list of questions and the internal options of each question.
 * Optionally limits the returned questions to `limit` items.
 */
export function shuffleQuestionsDeep(questions: readonly Question[], limit?: number): Question[] {
  const shuffledList = shuffleArray(questions);
  const sliced = typeof limit === 'number' && limit > 0 ? shuffledList.slice(0, limit) : shuffledList;
  return sliced.map((q) => shuffleQuestionOptions(q));
}
