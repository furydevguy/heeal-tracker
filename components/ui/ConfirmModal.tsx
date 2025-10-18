import { useTokens } from '@app/providers/ThemeProvider';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ConfirmModal({ message, show, onConfirm, onCancel }: { message: string; show: boolean; onConfirm: () => void; onCancel: () => void }) {
  const t = useTokens();
  const handleCancel = () => {
    onCancel();
  }
  const handleConfirm = () => {
    onConfirm();
  }
  return (
    <Modal transparent={true} animationType="fade" visible={show} onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={{ color: t.colors.text }}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable onPress={handleCancel} style={styles.button}>
              <Text style={{ color: t.colors.text }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.button}>
              <Text style={{ color: t.colors.text }}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
  },
  message: {
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
});