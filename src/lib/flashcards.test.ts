import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createMultipleChoiceQuestions,
  createFlashcards,
  parseDelimitedFlashcards,
  parsePrintableFlashcardPage,
  type PdfTextItemLike,
} from './flashcards';

function item(str: string, x: number, y: number): PdfTextItemLike {
  return { str, transform: [1, 0, 0, 1, x, y] };
}

describe('parsePrintableFlashcardPage', () => {
  it('extracts three front/back rows and their printed ids', () => {
    const cards = parsePrintableFlashcardPage(
      [
        item('What is layering?', 50, 660),
        item('Moving funds through transactions', 314, 720),
        item('1', 43, 723),
        item('-', 49, 723),
        item('1', 55, 723),
        item('What is placement?', 50, 440),
        item('Introducing funds into the system', 314, 500),
        item('1', 43, 503),
        item('-', 49, 503),
        item('2', 55, 503),
        item('What is integration?', 50, 220),
        item('Returning funds to the economy', 314, 280),
        item('1', 43, 283),
        item('-', 49, 283),
        item('3', 55, 283),
        item('Version 7.02', 209, 22),
      ],
      3,
    );

    assert.deepEqual(cards, [
      {
        sourceId: '1-1',
        question: 'What is layering?',
        answer: 'Moving funds through transactions',
        unit: 'Unit 1',
      },
      {
        sourceId: '1-2',
        question: 'What is placement?',
        answer: 'Introducing funds into the system',
        unit: 'Unit 1',
      },
      {
        sourceId: '1-3',
        question: 'What is integration?',
        answer: 'Returning funds to the economy',
        unit: 'Unit 1',
      },
    ]);
  });

  it('returns no cards for cover content without answers', () => {
    assert.deepEqual(
      parsePrintableFlashcardPage([item('FLASHCARDS', 50, 660)], 1),
      [],
    );
  });

  it('falls back to a page-row id when a supported row has no printed label', () => {
    assert.deepEqual(
      parsePrintableFlashcardPage(
        [item('Question without label?', 50, 660), item('Answer without label', 314, 720)],
        8,
      ),
      [
        {
          sourceId: '8-1',
          question: 'Question without label?',
          answer: 'Answer without label',
          unit: 'Unit 8',
        },
      ],
    );
  });
});

describe('manual flashcard parsing', () => {
  it('accepts Q/A blocks and de-duplicates ids', () => {
    const cards = createFlashcards(
      parseDelimitedFlashcards('Q: First question\nA: First answer\n\nSecond::Second answer'),
    );

    assert.equal(cards.length, 2);
    assert.equal(cards[0].question, 'First question');
    assert.equal(cards[1].answer, 'Second answer');
  });
});

describe('multiple-choice test generation', () => {
  const cards = createFlashcards([
    {
      sourceId: '1-1',
      unit: 'Unit 1',
      question: 'What is placement?',
      answer: 'Introducing illicit funds into the financial system',
    },
    {
      sourceId: '1-2',
      unit: 'Unit 1',
      question: 'What is layering?',
      answer: 'Moving funds through transactions to obscure their origin',
    },
    {
      sourceId: '1-3',
      unit: 'Unit 1',
      question: 'What is integration?',
      answer: 'Returning laundered funds to the economy as apparently legitimate assets',
    },
    {
      sourceId: '1-4',
      unit: 'Unit 1',
      question: 'What is structuring?',
      answer: 'Breaking transactions into smaller amounts to avoid reporting requirements',
    },
    {
      sourceId: '2-1',
      unit: 'Unit 2',
      question: 'What is a risk assessment?',
      answer: 'Evaluating exposure to identified financial crime risks',
    },
  ]);

  it('creates four distinct options with exactly one correct answer', () => {
    const questions = createMultipleChoiceQuestions(cards, 3, () => 0.5);

    assert.equal(questions.length, 3);
    for (const question of questions) {
      assert.equal(question.options.length, 4);
      assert.equal(question.options.filter((option) => option.isCorrect).length, 1);
      assert.equal(new Set(question.options.map((option) => option.text)).size, 4);
      assert.equal(
        question.options.find((option) => option.isCorrect)?.text,
        cards.find((card) => card.id === question.cardId)?.answer,
      );
    }
  });

  it('does not create an incomplete test from fewer than four cards', () => {
    assert.deepEqual(createMultipleChoiceQuestions(cards.slice(0, 3), 3), []);
  });
});
