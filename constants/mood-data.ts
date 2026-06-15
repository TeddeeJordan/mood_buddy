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
  { value: 1, label: 'Stressfree', emoji: '🤩' },
  { value: 2, label: 'Chill', emoji: '😌' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Stressed', emoji: '😤' },
  { value: 5, label: 'Overwhelmed', emoji: '😱' },
];

export const ANXIETY_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Calm', emoji: '😌' },
  { value: 2, label: 'Relaxed', emoji: '🙂' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Anxious', emoji: '😰' },
  { value: 5, label: 'Panicked', emoji: '😨' },
];
