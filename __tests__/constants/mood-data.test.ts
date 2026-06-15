import {
  MOOD_OPTIONS,
  STRESS_OPTIONS,
  ANXIETY_OPTIONS,
  type MoodOption,
} from '@/constants/mood-data';

function isValidMoodArray(options: MoodOption[]) {
  expect(options).toHaveLength(5);
  options.forEach((opt, i) => {
    expect(opt.value).toBe(i + 1);
    expect(typeof opt.label).toBe('string');
    expect(opt.label.length).toBeGreaterThan(0);
    expect(typeof opt.emoji).toBe('string');
    expect(opt.emoji.length).toBeGreaterThan(0);
  });
}

describe('MOOD_OPTIONS', () => {
  it('has 5 options with values 1-5', () => {
    isValidMoodArray(MOOD_OPTIONS);
  });

  it('lowest value is Upset', () => {
    expect(MOOD_OPTIONS[0].label).toBe('Upset');
  });

  it('highest value is Happy', () => {
    expect(MOOD_OPTIONS[4].label).toBe('Happy');
  });
});

describe('STRESS_OPTIONS', () => {
  it('has 5 options with values 1-5', () => {
    isValidMoodArray(STRESS_OPTIONS);
  });

  it('lowest value is Overwhelmed', () => {
    expect(STRESS_OPTIONS[0].label).toBe('Overwhelmed');
  });

  it('highest value is Stressfree', () => {
    expect(STRESS_OPTIONS[4].label).toBe('Stressfree');
  });
});

describe('ANXIETY_OPTIONS', () => {
  it('has 5 options with values 1-5', () => {
    isValidMoodArray(ANXIETY_OPTIONS);
  });

  it('lowest value is Panicked', () => {
    expect(ANXIETY_OPTIONS[0].label).toBe('Panicked');
  });

  it('highest value is Calm', () => {
    expect(ANXIETY_OPTIONS[4].label).toBe('Calm');
  });
});
