import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Themes } from '@/constants/theme';
import type { MoodOption } from '@/constants/mood-data';

type Props = {
  options: MoodOption[];
  selected: number | null;
  onSelect: (value: number) => void;
};

export function EmojiPicker({ options, selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.tile,
              isSelected && styles.selectedTile,
              pressed && !isSelected && styles.pressedTile,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text
              style={[styles.label, isSelected && styles.selectedLabel]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Themes.lavender.tertiary,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  selectedTile: {
    backgroundColor: Themes.lavender.primary,
    borderColor: Themes.lavender.primary,
  },
  pressedTile: {
    backgroundColor: Themes.lavender.tertiary,
  },
  emoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: Themes.lavender.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
