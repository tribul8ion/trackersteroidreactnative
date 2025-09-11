import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function AchievementCard({ achievement, onPress }: any) {
  const rarityColor = '#888';
  const received = !!achievement?.achieved;
  const progressPct = achievement?.required ? Math.round((achievement.progress / achievement.required) * 100) : 0;
  return (
    <TouchableOpacity testID="achievement-card" onPress={() => onPress && onPress(achievement)} style={{ borderLeftWidth: 4, borderLeftColor: rarityColor, opacity: received ? 1 : 0.6 }}>
      <View testID="achievement-icon" />
      <View testID="rarity-icon" />
      <View testID="achievement-status" />
      <View testID="achievement-category" />
      <View testID="category-icon" />
      <Text>{achievement?.name}</Text>
      <Text>{achievement?.description || (achievement?.isSecret ? 'Секретное достижение' : '')}</Text>
      {achievement?.isSecret ? <Text>Секретное достижение</Text> : null}
      <Text>{achievement?.points} очков</Text>
      {achievement?.required ? (
        <View>
          <View testID="progress-bar" style={{ width: `${progressPct}%` }} />
          <Text>{achievement.progress}/{achievement.required}</Text>
        </View>
      ) : null}
      {achievement?.meme ? <View testID="meme-badge" /> : null}
      {received ? <Text>Получено</Text> : null}
    </TouchableOpacity>
  );
}
