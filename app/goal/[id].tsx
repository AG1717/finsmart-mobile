import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { goalsApi } from '../../src/services/api/goalsApi';
import { useAuthStore } from '../../src/store/authStore';
import { ProgressCircle } from '../../src/components/goal/ProgressCircle';
import { formatCurrency, formatDate } from '../../src/utils/helpers/formatters';
import { Button } from '../../src/components/common/Button';
import { ModalAlert } from '../../src/components/common/ModalAlert';
import { COLORS, CATEGORY_INFO, GOAL_ICONS } from '../../src/utils/constants';
import { Category, Timeframe } from '../../src/types';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [contributeLoading, setContributeLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'info' as const,
    primaryLabel: 'OK',
    secondaryLabel: undefined as undefined | string,
    onPrimary: undefined as undefined | (() => void),
    onSecondary: undefined as undefined | (() => void),
  });

  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    timeframe: 'short' as Timeframe,
    category: 'necessity' as Category,
    icon: 'star',
  });

  const { data: goal, isLoading } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsApi.getGoalById(id!),
    enabled: !!id,
  });

  const closeAlert = () => setAlertModal((prev) => ({ ...prev, visible: false }));

  const showAlert = (title: string, message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertModal({
      visible: true,
      title,
      message,
      variant,
      primaryLabel: t('common.confirm'),
      secondaryLabel: undefined,
      onPrimary: closeAlert,
      onSecondary: undefined,
    });
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setAlertModal({
      visible: true,
      title,
      message,
      variant: 'warning',
      primaryLabel: t('common.confirm'),
      secondaryLabel: t('common.cancel'),
      onPrimary: () => {
        closeAlert();
        onConfirm();
      },
      onSecondary: closeAlert,
    });
  };

  const handleDelete = () => {
    confirmAction('Delete Goal', 'Are you sure you want to delete this goal?', async () => {
      try {
        setDeleteLoading(true);
        await goalsApi.deleteGoal(id!);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        showAlert('Success', 'Goal deleted successfully', 'success');
        router.back();
      } catch (error: any) {
        showAlert('Error', error.response?.data?.error?.message || 'Failed to delete goal', 'error');
      } finally {
        setDeleteLoading(false);
      }
    });
  };

  const openEditModal = () => {
    if (!goal) return;
    setEditData({
      name: goal.name,
      description: goal.description || '',
      targetAmount: goal.amounts.target.toString(),
      currentAmount: goal.amounts.current.toString(),
      targetDate: goal.dates.target ? new Date(goal.dates.target).toISOString().split('T')[0] : '',
      timeframe: goal.timeframe,
      category: goal.category,
      icon: goal.icon || 'star',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) {
      showAlert('Error', 'Goal name is required', 'error');
      return;
    }
    const targetAmount = parseFloat(editData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      showAlert('Error', 'Target amount must be greater than 0', 'error');
      return;
    }

    try {
      setEditLoading(true);
      await goalsApi.updateGoal(id!, {
        name: editData.name.trim(),
        description: editData.description.trim() || undefined,
        category: editData.category,
        timeframe: editData.timeframe,
        amounts: {
          current: parseFloat(editData.currentAmount) || 0,
          target: targetAmount,
          currency: user?.preferences?.currency || { code: 'USD', symbol: '$' },
        },
        dates: editData.targetDate ? { target: editData.targetDate } : { target: null },
        icon: editData.icon,
      });

      queryClient.invalidateQueries({ queryKey: ['goal', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowEditModal(false);
      showAlert('Success', 'Goal updated successfully', 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error?.message || 'Failed to update goal', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleContribute = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Error', 'Please enter a valid amount', 'error');
      return;
    }

    try {
      setContributeLoading(true);
      await goalsApi.addContribution(id!, amount, contributionNote || undefined);

      queryClient.invalidateQueries({ queryKey: ['goal', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowContributeModal(false);
      setContributionAmount('');
      setContributionNote('');
      showAlert('Success', `Added ${user?.preferences?.currency?.symbol || '$'}${amount} to your goal!`, 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error?.message || 'Failed to add contribution', 'error');
    } finally {
      setContributeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Goal not found</Text>
      </View>
    );
  }

  const categoryInfo = CATEGORY_INFO[goal.category];
  const currency = goal.amounts.currency || { code: 'USD', symbol: '$' };

  return (
    <View style={styles.container}>
      <ModalAlert
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        primaryLabel={alertModal.primaryLabel}
        secondaryLabel={alertModal.secondaryLabel}
        onPrimary={alertModal.onPrimary}
        onSecondary={alertModal.onSecondary}
        onClose={closeAlert}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Goal Header */}
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={goal.icon as any} size={32} color={categoryInfo.color} />
          </View>
          <Text style={styles.goalName}>{goal.name}</Text>
          {goal.description && (
            <Text style={styles.goalDescription}>{goal.description}</Text>
          )}
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={[styles.badgeText, { color: categoryInfo.color }]}>
                {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: COLORS.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                {goal.timeframe === 'short' ? 'Short Term' : 'Long Term'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(goal.status) }]}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <ProgressCircle
            percentage={goal.progress.percentage}
            size={120}
            strokeWidth={10}
            color={categoryInfo.color}
          />
          <View style={styles.amountsContainer}>
            <Text style={styles.currentAmount}>
              {formatCurrency(goal.amounts.current, currency)}
            </Text>
            <Text style={styles.targetAmount}>
              of {formatCurrency(goal.amounts.target, currency)}
            </Text>
            {goal.dates.target && (
              <Text style={styles.targetDate}>
                Target: {formatDate(goal.dates.target, 'PP', i18n.language as any)}
              </Text>
            )}
          </View>
        </View>

        {/* Contribution History */}
        {goal.metadata?.contributions && goal.metadata.contributions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contributions</Text>
            {goal.metadata.contributions.slice(-5).reverse().map((contrib, index) => (
              <View key={index} style={styles.contributionItem}>
                <View>
                  <Text style={styles.contributionAmount}>
                    +{formatCurrency(contrib.amount, currency)}
                  </Text>
                  {contrib.note && (
                    <Text style={styles.contributionNote}>{contrib.note}</Text>
                  )}
                </View>
                <Text style={styles.contributionDate}>
                  {formatDate(contrib.date, 'PP', i18n.language as any)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Add Contribution"
            onPress={() => setShowContributeModal(true)}
            fullWidth
            size="large"
            style={{ marginBottom: 12 }}
          />
          <View style={styles.actionRow}>
            <Button
              title="Edit"
              onPress={openEditModal}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Delete"
              onPress={handleDelete}
              variant="danger"
              loading={deleteLoading}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Contribute Modal */}
      <Modal visible={showContributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contribution</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Amount ({currency.symbol}) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.gray[400]}
              keyboardType="decimal-pad"
              value={contributionAmount}
              onChangeText={setContributionAmount}
            />

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="What's this contribution for?"
              placeholderTextColor={COLORS.gray[400]}
              value={contributionNote}
              onChangeText={setContributionNote}
            />

            <Button
              title="Add"
              onPress={handleContribute}
              loading={contributeLoading}
              fullWidth
              size="large"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={false}>
        <View style={styles.editContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Goal</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.editScrollContent}>
            <Text style={styles.label}>Goal Name *</Text>
            <TextInput
              style={styles.input}
              value={editData.name}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
              placeholderTextColor={COLORS.gray[400]}
            />

            <Text style={styles.label}>Target Amount *</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={editData.targetAmount}
              onChangeText={(text) => setEditData({ ...editData, targetAmount: text })}
              placeholderTextColor={COLORS.gray[400]}
            />

            <Text style={styles.label}>Current Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={editData.currentAmount}
              onChangeText={(text) => setEditData({ ...editData, currentAmount: text })}
              placeholderTextColor={COLORS.gray[400]}
            />

            <Text style={styles.label}>Target Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              keyboardType="number-pad"
              maxLength={10}
              value={editData.targetDate}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^\d]/g, '');
                let formatted = '';
                if (cleaned.length > 0) {
                  formatted = cleaned.substring(0, 4);
                  if (cleaned.length >= 5) formatted += '-' + cleaned.substring(4, 6);
                  if (cleaned.length >= 7) formatted += '-' + cleaned.substring(6, 8);
                }
                setEditData({ ...editData, targetDate: formatted });
              }}
              placeholderTextColor={COLORS.gray[400]}
            />

            <Text style={styles.label}>Timeframe</Text>
            <View style={styles.buttonGroup}>
              {(['short', 'long'] as Timeframe[]).map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.optionButton, editData.timeframe === tf && styles.optionButtonActive]}
                  onPress={() => setEditData({ ...editData, timeframe: tf })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editData.timeframe === tf && styles.optionButtonTextActive,
                    ]}
                  >
                    {tf === 'short' ? 'Short Term' : 'Long Term'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.buttonGroup}>
              {(['survival', 'necessity', 'lifestyle'] as Category[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.optionButton, editData.category === cat && styles.optionButtonActive]}
                  onPress={() => setEditData({ ...editData, category: cat })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      editData.category === cat && styles.optionButtonTextActive,
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={[styles.iconButton, editData.icon === iconName && styles.iconButtonActive]}
                  onPress={() => setEditData({ ...editData, icon: iconName })}
                >
                  <Ionicons
                    name={iconName as any}
                    size={24}
                    color={editData.icon === iconName ? COLORS.white : COLORS.gray[600]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Save Changes"
              onPress={handleUpdate}
              loading={editLoading}
              fullWidth
              size="large"
              style={{ marginTop: 24, marginBottom: 32 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return COLORS.primary;
    case 'completed': return COLORS.success;
    case 'paused': return COLORS.warning;
    case 'cancelled': return COLORS.danger;
    default: return COLORS.gray[500];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  goalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
    textAlign: 'center',
  },
  goalDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountsContainer: {
    flex: 1,
    marginLeft: 24,
  },
  currentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  targetAmount: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  targetDate: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  contributionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  contributionNote: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  contributionDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  actions: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  editContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  editScrollContent: {
    paddingBottom: 48,
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
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
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
