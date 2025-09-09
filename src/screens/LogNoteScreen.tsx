import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addAction } from '../services/actions';
import { getUser } from '../services/auth';
import { colors } from '../theme/colors';

const LogNoteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params as { courseId: string };
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLog = async () => {
    if (!note) return;
    setLoading(true);
    try {
      const { data } = await getUser();
      const user_id = data?.user?.id;
      await addAction({
        user_id: String(user_id),
        course_id: courseId,
        type: 'note',
        timestamp: new Date().toISOString(),
        details: JSON.stringify({ note }),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
        <View style={styles.modalBackground} />
      </TouchableWithoutFeedback>
      <View style={styles.modalCard}>
        <Text style={styles.title}>Заметка</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите текст заметки"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity
          style={[styles.button, !note && styles.buttonDisabled]}
          onPress={handleLog}
          disabled={!note || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Сохраняю...' : 'Сохранить'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalCard: { backgroundColor: '#23232a', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400, alignItems: 'stretch' },
  title: { color: '#FB923C', fontSize: 20, marginBottom: 16, alignSelf: 'center' },
  input: { backgroundColor: '#23232a', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 80 },
  button: { backgroundColor: '#FB923C', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#FB923C80' },
  buttonText: { color: '#23232a', fontWeight: 'bold', fontSize: 16 },
});

export default LogNoteScreen; 