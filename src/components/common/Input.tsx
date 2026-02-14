import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  style,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={[
            styles.input,
            secureTextEntry && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeText}>
              {isPasswordVisible ? 'Masquer' : 'Voir'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  required: {
    color: COLORS.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  inputWithIcon: {
    paddingRight: 8,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  eyeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
});
