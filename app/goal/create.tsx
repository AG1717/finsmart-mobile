import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { goalsApi } from '../../src/services/api/goalsApi';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/common/Button';
import { COLORS, GOAL_ICONS } from '../../src/utils/constants';
import { Category, Timeframe } from '../../src/types';

export default function CreateGoalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    timeframe: 'short' as Timeframe,
    category: 'necessity' as Category,
    icon: 'star',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDateInput = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 4);
      if (cleaned.length >= 5) {
        const month = cleaned.substring(4, 6);
        const monthNum = parseInt(month, 10);
        if (monthNum > 12) {
          formatted += '-12';
        } else {
          formatted += '-' + month;
        }
        if (cleaned.length >= 7) {
          const day = cleaned.substring(6, 8);
          const dayNum = parseInt(day, 10);
          if (dayNum > 31) {
            formatted += '-31';
          } else {
            formatted += '-' + day;
          }
        }
      }
    }

    setFormData({ ...formData, targetDate: formatted });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }

    if (formData.targetDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.targetDate)) {
        newErrors.targetDate = 'Use format YYYY-MM-DD';
      } else {
        const date = new Date(formData.targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          newErrors.targetDate = 'Date must be in the future';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await goalsApi.createGoal({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        timeframe: formData.timeframe,
        amounts: {
          current: parseFloat(formData.currentAmount) || 0,
          target: parseFloat(formData.targetAmount),
          currency: user?.preferences?.currency || { code: 'USD', symbol: '$' },
        },
        dates: formData.targetDate ? { target: formData.targetDate } : undefined,
        icon: formData.icon,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });

      const msg = 'Goal created successfully!';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Success', msg);
      }

      router.back();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to create goal';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert(t('common.error'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = user?.preferences?.currency?.symbol || '$';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Goal Name */}
        <Text style={styles.label}>Goal Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="E.g., New Car, Vacation..."
          placeholderTextColor={COLORS.gray[400]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional description..."
          placeholderTextColor={COLORS.gray[400]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={3}
        />

        {/* Target Amount */}
        <Text style={styles.label}>Target Amount * ({currencySymbol})</Text>
        <TextInput
          style={[styles.input, errors.targetAmount && styles.inputError]}
          placeholder="0.00"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="decimal-pad"
          value={formData.targetAmount}
          onChangeText={(text) => setFormData({ ...formData, targetAmount: text })}
        />
        {errors.targetAmount && <Text style={styles.errorText}>{errors.targetAmount}</Text>}

        {/* Current Amount */}
        <Text style={styles.label}>Current Amount ({currencySymbol})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="decimal-pad"
          value={formData.currentAmount}
          onChangeText={(text) => setFormData({ ...formData, currentAmount: text })}
        />

        {/* Target Date */}
        <Text style={styles.label}>Target Date</Text>
        <TextInput
          style={[styles.input, errors.targetDate && styles.inputError]}
          placeholder="YYYY-MM-DD (e.g., 2026-12-31)"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="number-pad"
          maxLength={10}
          value={formData.targetDate}
          onChangeText={handleDateInput}
        />
        {errors.targetDate && <Text style={styles.errorText}>{errors.targetDate}</Text>}
        <Text style={styles.helperText}>Optional - Format: YYYY-MM-DD</Text>

        {/* Timeframe */}
        <Text style={styles.label}>Timeframe *</Text>
        <View style={styles.buttonGroup}>
          {(['short', 'long'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.optionButton, formData.timeframe === tf && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, timeframe: tf })}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.timeframe === tf && styles.optionButtonTextActive,
                ]}
              >
                {tf === 'short' ? 'Short Term' : 'Long Term'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.buttonGroup}>
          {(['survival', 'necessity', 'lifestyle'] as Category[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.optionButton, formData.category === cat && styles.optionButtonActive]}
              onPress={() => setFormData({ ...formData, category: cat })}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.category === cat && styles.optionButtonTextActive,
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Icon */}
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {GOAL_ICONS.map((iconName) => (
            <TouchableOpacity
              key={iconName}
              style={[styles.iconButton, formData.icon === iconName && styles.iconButtonActive]}
              onPress={() => setFormData({ ...formData, icon: iconName })}
            >
              <Ionicons
                name={iconName as any}
                size={24}
                color={formData.icon === iconName ? COLORS.white : COLORS.gray[600]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <Button
          title="Create Goal"
          onPress={handleCreate}
          loading={loading}
          fullWidth
          size="large"
          style={{ marginTop: 24, marginBottom: 32 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  optionButtonTextActive: {
    color: COLORS.white,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
