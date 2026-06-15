import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmojiPicker } from '@/components/emoji-picker';
import { MOOD_OPTIONS } from '@/constants/mood-data';

describe('EmojiPicker', () => {
  it('renders all options', async () => {
    const { getByText } = await render(
      <EmojiPicker options={MOOD_OPTIONS} selected={null} onSelect={jest.fn()} />,
    );
    MOOD_OPTIONS.forEach(opt => {
      expect(getByText(opt.label)).toBeTruthy();
      expect(getByText(opt.emoji)).toBeTruthy();
    });
  });

  it('calls onSelect with the correct value when an option is pressed', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(
      <EmojiPicker options={MOOD_OPTIONS} selected={null} onSelect={onSelect} />,
    );
    fireEvent.press(getByText('Happy'));
    expect(onSelect).toHaveBeenCalledWith(5);
  });

  it('calls onSelect with value 1 for the lowest option', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(
      <EmojiPicker options={MOOD_OPTIONS} selected={null} onSelect={onSelect} />,
    );
    fireEvent.press(getByText('Upset'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('renders with a pre-selected value without throwing', async () => {
    await expect(
      render(<EmojiPicker options={MOOD_OPTIONS} selected={3} onSelect={jest.fn()} />),
    ).resolves.toBeTruthy();
  });

  it('renders correctly with an empty options array', async () => {
    const { toJSON } = await render(
      <EmojiPicker options={[]} selected={null} onSelect={jest.fn()} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
