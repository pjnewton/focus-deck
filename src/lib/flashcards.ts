export type FlashcardDraft = {
  sourceId: string;
  question: string;
  answer: string;
  unit: string;
};

export type FlashcardRating = 'again' | 'hard' | 'got-it';

export type Flashcard = FlashcardDraft & {
  id: string;
  confidence: number;
  attempts: number;
  correct: number;
  lastRating?: FlashcardRating;
};

export type MultipleChoiceOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type MultipleChoiceQuestion = {
  cardId: string;
  sourceId: string;
  unit: string;
  question: string;
  options: MultipleChoiceOption[];
};

export type PdfTextItemLike = {
  str: string;
  transform: number[];
};

type PositionedText = {
  text: string;
  x: number;
  y: number;
};

type RowBucket = {
  front: PositionedText[];
  back: PositionedText[];
  label: PositionedText[];
};

const ROW_BANDS = [
  { min: 570, max: 780 },
  { min: 350, max: 570 },
  { min: 100, max: 350 },
] as const;

const COMMON_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'to',
  'with',
]);

function normalizeWhitespace(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/-\s+/g, '-')
    .replace(/\s+([,.;:?!])/g, '$1')
    .trim();
}

function joinPositionedText(items: PositionedText[]) {
  if (items.length === 0) return '';

  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: PositionedText[][] = [];
  for (const item of sorted) {
    const currentLine = lines.at(-1);
    if (!currentLine || Math.abs(currentLine[0].y - item.y) > 2) {
      lines.push([item]);
    } else {
      currentLine.push(item);
    }
  }

  return normalizeWhitespace(
    lines
      .map((line) =>
        line
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(' '),
      )
      .join(' '),
  );
}

function getRowIndex(y: number) {
  return ROW_BANDS.findIndex(({ min, max }) => y >= min && y < max);
}

function isLabelToken(text: string) {
  return /^\d+$/.test(text) || text === '-';
}

function makeSourceId(label: PositionedText[], pageNumber: number, rowIndex: number) {
  const printedId = label
    .sort((a, b) => a.x - b.x)
    .map(({ text }) => text)
    .join('')
    .replace(/-+/g, '-');

  return printedId || `${pageNumber}-${rowIndex + 1}`;
}

/**
 * Parses the three-row, fold-in-the-middle printable format used by the ACAMS
 * deck. Pages that do not match the format simply return no cards.
 */
export function parsePrintableFlashcardPage(
  items: PdfTextItemLike[],
  pageNumber: number,
): FlashcardDraft[] {
  const rows: RowBucket[] = ROW_BANDS.map(() => ({
    front: [],
    back: [],
    label: [],
  }));

  for (const item of items) {
    const text = item.str.trim();
    if (!text) continue;

    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    const rowIndex = getRowIndex(y);
    if (rowIndex === -1) continue;

    const positioned = { text, x, y };
    if (x >= 35 && x < 100 && isLabelToken(text)) {
      rows[rowIndex].label.push(positioned);
    } else if (x >= 35 && x < 280) {
      rows[rowIndex].front.push(positioned);
    } else if (x >= 280 && x < 525) {
      rows[rowIndex].back.push(positioned);
    }
  }

  return rows.flatMap((row, rowIndex) => {
    const question = joinPositionedText(row.front);
    const answer = joinPositionedText(row.back);
    if (!question || !answer) return [];

    const sourceId = makeSourceId(row.label, pageNumber, rowIndex);
    const unitNumber = sourceId.split('-')[0];

    return [
      {
        sourceId,
        question,
        answer,
        unit: /^\d+$/.test(unitNumber) ? `Unit ${unitNumber}` : 'Imported',
      },
    ];
  });
}

export function createFlashcards(drafts: FlashcardDraft[]): Flashcard[] {
  const usedIds = new Set<string>();

  return drafts.map((draft, index) => {
    const baseId = draft.sourceId || `card-${index + 1}`;
    let id = baseId;
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);
    return {
      ...draft,
      id,
      confidence: 0,
      attempts: 0,
      correct: 0,
    };
  });
}

export function parseDelimitedFlashcards(text: string): FlashcardDraft[] {
  return text
    .split(/\n\s*\n/)
    .map((block, index) => {
      const normalized = block.trim();
      if (!normalized) return null;

      const prefixed = normalized.match(
        /^(?:q(?:uestion)?\s*[:.-]\s*)?(.+?)\n(?:a(?:nswer)?\s*[:.-]\s*)(.+)$/is,
      );
      const delimited = normalized.split(/\s*(?:\t|::|=>)\s*/, 2);
      const pair = prefixed
        ? [prefixed[1], prefixed[2]]
        : delimited.length === 2
          ? delimited
          : null;

      if (!pair) return null;
      const [question, answer] = pair.map(normalizeWhitespace);
      if (!question || !answer) return null;

      return {
        sourceId: `manual-${index + 1}`,
        question,
        answer,
        unit: 'Manual import',
      };
    })
    .filter((card): card is FlashcardDraft => card !== null);
}

export function shuffleFlashcards<T>(items: T[]) {
  return shuffleWithRandom(items, Math.random);
}

function shuffleWithRandom<T>(items: T[], random: () => number) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function orderCardsForSprint(cards: Flashcard[]) {
  return shuffleFlashcards(cards).sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence - b.confidence;
    return a.attempts - b.attempts;
  });
}

function significantWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((word) => word.length > 2 && !COMMON_WORDS.has(word)) ?? [],
  );
}

function countSharedWords(first: Set<string>, second: Set<string>) {
  let shared = 0;
  for (const word of first) {
    if (second.has(word)) shared += 1;
  }
  return shared;
}

function scoreDistractor(target: Flashcard, candidate: Flashcard) {
  const targetQuestionWords = significantWords(target.question);
  const candidateQuestionWords = significantWords(candidate.question);
  const targetAnswerWords = significantWords(target.answer);
  const candidateAnswerWords = significantWords(candidate.answer);
  const longestAnswer = Math.max(target.answer.length, candidate.answer.length, 1);
  const lengthSimilarity = 1 - Math.abs(target.answer.length - candidate.answer.length) / longestAnswer;

  return (
    (target.unit === candidate.unit ? 30 : 0) +
    countSharedWords(targetQuestionWords, candidateQuestionWords) * 8 +
    countSharedWords(targetAnswerWords, candidateAnswerWords) * 4 +
    lengthSimilarity * 12
  );
}

/**
 * Creates a local multiple-choice test from an imported deck. Distractors are
 * answers from other cards, weighted toward nearby subject matter so the quiz
 * stays grounded in the source material.
 */
export function createMultipleChoiceQuestions(
  cards: Flashcard[],
  requestedSize: number,
  random: () => number = Math.random,
): MultipleChoiceQuestion[] {
  if (cards.length < 4 || requestedSize <= 0) return [];

  return shuffleWithRandom(cards, random)
    .slice(0, Math.min(requestedSize, cards.length))
    .map((card) => {
      const seenAnswers = new Set([normalizeWhitespace(card.answer).toLowerCase()]);
      const distractors = cards
        .filter((candidate) => candidate.id !== card.id)
        .map((candidate) => ({
          card: candidate,
          score: scoreDistractor(card, candidate),
          tieBreaker: random(),
        }))
        .sort((first, second) => second.score - first.score || first.tieBreaker - second.tieBreaker)
        .flatMap(({ card: candidate }) => {
          const normalizedAnswer = normalizeWhitespace(candidate.answer).toLowerCase();
          if (seenAnswers.has(normalizedAnswer)) return [];
          seenAnswers.add(normalizedAnswer);
          return [candidate.answer];
        })
        .slice(0, 3);

      return {
        cardId: card.id,
        sourceId: card.sourceId,
        unit: card.unit,
        question: card.question,
        options: shuffleWithRandom(
          [
            { id: `${card.id}:correct`, text: card.answer, isCorrect: true },
            ...distractors.map((answer, index) => ({
              id: `${card.id}:distractor-${index + 1}`,
              text: answer,
              isCorrect: false,
            })),
          ],
          random,
        ),
      };
    })
    .filter((question) => question.options.length === 4);
}
