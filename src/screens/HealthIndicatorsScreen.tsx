import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const indicators = [
  {
    name: 'Тестостерон',
    value: '24.5',
    unit: 'нмоль/л',
    status: 'В норме',
    statusColor: colors.success,
    bgColor: '#1E2F23',
    norm: 'Норма: 8.4 - 28.7 нмоль/л',
  },
  {
    name: 'Эстрадиол',
    value: '45.2',
    unit: 'пг/мл',
    status: 'Требует внимания',
    statusColor: colors.warning,
    bgColor: '#2D241C',
    norm: 'Норма: 20 - 40 пг/мл',
  },
  {
    name: 'АЛТ',
    value: '65.0',
    unit: 'Ед/л',
    status: 'Требует внимания',
    statusColor: colors.warning,
    bgColor: '#2D241C',
    norm: 'Норма: 0 - 45 Ед/л',
  },
];

const HealthIndicatorsScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>ПОКАЗАТЕЛИ ЗДОРОВЬЯ</Text>
        {indicators.map((item, idx) => (
          <View key={item.name} style={[styles.card, { backgroundColor: item.bgColor }]}> 
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.value}>{item.value} <Text style={styles.unit}>{item.unit}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
              <Text style={[styles.status, { color: item.statusColor }]}>{item.status}</Text>
              <Text style={styles.norm}>{item.norm}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>ДИНАМИКА ТЕСТОСТЕРОНА</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={{ color: '#B3B3B3' }}>[График будет здесь]</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: '#D0BCFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
    marginTop: 16,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  unit: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: 'normal',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 8,
  },
  norm: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  chartPlaceholder: {
    height: 160,
    backgroundColor: '#1C1B1F',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});

export default HealthIndicatorsScreen; 