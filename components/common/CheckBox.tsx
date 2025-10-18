import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CheckBoxProps {
  checked: boolean;
  onPress: () => void;
  theme: any;
  size?: number;
  children?: React.ReactNode;
  disabled?: boolean;
  style?: any;
  checkboxStyle?: any;
}

const CheckBox: React.FC<CheckBoxProps> = ({ 
  checked, 
  onPress, 
  theme,
  size = 20,
  children,
  disabled = false,
  style,
  checkboxStyle
}) => {
  const styles = createStyles(theme, size);

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox, 
        checked && styles.checked,
        disabled && styles.disabled,
        checkboxStyle
      ]}>
        {checked && <View style={styles.checkmark} />}
      </View>
      {children && (
        <View style={styles.childrenContainer}>
          {children}
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: any, size: number) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: size,
    height: size,
    borderWidth: 2,
    borderColor: theme.colors.gray300 || '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checked: {
    backgroundColor: theme.colors.blue500 || '#3B82F6',
    borderColor: theme.colors.blue500 || '#3B82F6',
  },
  disabled: {
    opacity: 0.5,
  },
  checkmark: {
    width: size * 0.4,
    height: size * 0.2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
    marginTop: -size * 0.1,
  },
  childrenContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    marginTop: 2,
  },
});

export default CheckBox;