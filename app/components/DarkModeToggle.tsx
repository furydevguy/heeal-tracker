import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react-native';

interface DarkModeToggleProps {
  size?: number;
  style?: any;
}

export function DarkModeToggle({ size = 24, style }: DarkModeToggleProps) {
  const { scheme, toggleScheme } = useTheme();
  const isDark = scheme === 'dark';

  return (
    <TouchableOpacity
      onPress={toggleScheme}
      style={[styles.toggle, style]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      {isDark ? (
        <Sun size={size} color="#F2F2F2" />
      ) : (
        <Moon size={size} color="#111111" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
