import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { MoodOption } from '@/constants/mood-data';
import type { ThemePalette } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  options: MoodOption[];
  selected: number | null;
  onSelect: (value: number) => void;
};

function makeStyles(theme: ThemePalette) {
  return StyleSheet.create({
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
      borderColor: theme.tertiary,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
    },
    selectedTile: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    pressedTile: {
      backgroundColor: theme.tertiary,
    },
    emoji: {
      fontSize: 26,
      marginBottom: 4,
    },
    label: {
      fontSize: 10,
      color: theme.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    selectedLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
}

export function EmojiPicker({ options, selected, onSelect }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
