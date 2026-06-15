export type MoodOption = {
  value: number;
  label: string;
  emoji: string;
};

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Upset', emoji: '😭' },
  { value: 2, label: 'Unhappy', emoji: '😟' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Content', emoji: '😊' },
  { value: 5, label: 'Happy', emoji: '😄' },
];

export const STRESS_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Overwhelmed', emoji: '😱' },
  { value: 2, label: 'Stressed', emoji: '😤' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Chill', emoji: '😌' },
  { value: 5, label: 'Stressfree', emoji: '🤩' },
];

export const ANXIETY_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Panicked', emoji: '😨' },
  { value: 2, label: 'Anxious', emoji: '😰' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Relaxed', emoji: '🙂' },
  { value: 5, label: 'Calm', emoji: '😌' },
];
