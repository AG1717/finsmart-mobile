import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface ModalAlertProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: AlertVariant;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
}

const variantConfig: Record<AlertVariant, { color: string; icon: string }> = {
  success: { color: '#2F8AC1', icon: 'checkmark-circle' },
  error: { color: '#D64545', icon: 'close-circle' },
  warning: { color: '#F4A261', icon: 'warning' },
  info: { color: '#2F8AC1', icon: 'information-circle' },
};

export const ModalAlert: React.FC<ModalAlertProps> = ({
  visible,
  title,
  message,
  variant = 'info',
  primaryLabel = 'OK',
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}) => {
  const config = variantConfig[variant];

  const handlePrimary = () => {
    if (onPrimary) onPrimary();
    if (onClose) onClose();
  };

  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    if (onClose) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: `${config.color}1A` }]}>
            <Ionicons name={config.icon as any} size={28} color={config.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {secondaryLabel && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleSecondary}>
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: config.color }]} onPress={handlePrimary}>
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: '#F6F7FB',
  },
  secondaryText: {
    color: COLORS.gray[700],
    fontWeight: '600',
    fontSize: 14,
  },
});
