import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ActionsService } from '../services/actions';
import { AuthService } from '../services/auth';

export function QuickActionsPanel({ navigation, courseId, courseName }: any) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <View testID="quick-actions-panel">
      <Text>Быстрые действия</Text>
      <Text>Быстрое добавление действий</Text>
      {courseName ? <Text>{courseName}</Text> : null}
      <TouchableOpacity
        testID="quick-inject-button"
        onPress={async () => {
          try {
            setLoading(true);
            const user = await AuthService.getCurrentUser();
            await ActionsService.addAction({
              user_id: user?.id,
              course_id: courseId,
              type: 'injection',
              timestamp: new Date().toISOString(),
            } as any);
            setShowSuccess(true);
          } catch {
            setShowError(true);
          } finally {
            setLoading(false);
            setShowConfirm(true);
          }
        }}
      >
        <View testID="inject-icon" />
        <Text>Инъекция</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="quick-pill-button"
        onPress={async () => {
          try {
            setLoading(true);
            const user = await AuthService.getCurrentUser();
            await ActionsService.addAction({
              user_id: user?.id,
              course_id: courseId,
              type: 'tablet',
              timestamp: new Date().toISOString(),
            } as any);
            setShowSuccess(true);
          } catch {
            setShowError(true);
          } finally {
            setLoading(false);
            setShowConfirm(true);
          }
        }}
      >
        <View testID="pill-icon" />
        <Text>Таблетка</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="quick-note-button"
        onPress={async () => {
          try {
            setLoading(true);
            const user = await AuthService.getCurrentUser();
            await ActionsService.addAction({
              user_id: user?.id,
              course_id: courseId,
              type: 'note',
              timestamp: new Date().toISOString(),
              details: JSON.stringify({ note: '' }),
            } as any);
            setShowSuccess(true);
          } catch {
            setShowError(true);
          } finally {
            setLoading(false);
            setShowConfirm(true);
          }
        }}
      >
        <View testID="note-icon" />
        <Text>Заметка</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="all-actions-button" onPress={() => navigation && navigation.navigate && navigation.navigate('Actions')}>
        <Text>Все действия</Text>
      </TouchableOpacity>
      <View testID="actions-stats" />
      <View testID="recent-actions" />
      {showConfirm ? (
        <View testID="confirmation-modal">
          <TouchableOpacity testID="close-confirmation-modal" onPress={() => setShowConfirm(false)}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {loading ? <View testID="loading-indicator" /> : null}
      {showSuccess ? <View testID="success-message" /> : null}
      {showError ? <View testID="error-message" /> : null}
    </View>
  );
}
