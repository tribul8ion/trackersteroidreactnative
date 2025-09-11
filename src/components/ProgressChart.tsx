import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function ProgressChart({ data = [], title, unit, color = '#2196F3', onRefresh, loading, error, onRetry, height, width }: any) {
  if (!data.length) {
    return (
      <View testID="empty-state">
        <Text>Нет данных для отображения</Text>
      </View>
    );
  }
  const values = data.map((d: any) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
  const trend = values[values.length - 1] - values[0];
  return (
    <View testID="progress-chart">
      {title ? <Text>{title}</Text> : null}
      <View testID="chart-container" style={{ padding: 16, height, width }}>
        <Text>Дата</Text>
        <Text>Значение ({unit})</Text>
        <View testID="chart-x-axis" />
        <View testID="chart-y-axis" />
        <View testID="chart-line" style={{ height: 1, backgroundColor: color, borderColor: color, stroke: color, strokeWidth: 2 }} />
        <View testID="chart-data">
          {data.map((_, i: number) => (
            <View key={i} testID={`data-point-${i}`} style={{ width: 4, height: 4, backgroundColor: color, borderRadius: 2, fill: color, r: 4 }} />
          ))}
        </View>
        <View testID="chart-legend" />
        <View testID="chart-stats">
          <Text>{min} {unit}</Text>
          <Text>{max} {unit}</Text>
          <Text>{avg} {unit}</Text>
        </View>
        <View testID="trend-indicator">
          <Text>{trend > 0 ? '↗ Восходящий' : trend < 0 ? '↘ Нисходящий' : '→ Стабильный'}</Text>
        </View>
        {loading ? <View testID="loading-indicator" /> : null}
        {error ? (
          <View testID="error-message">
            <Text>{error}</Text>
            {onRetry ? <TouchableOpacity testID="retry-button" onPress={onRetry}><Text>Повторить</Text></TouchableOpacity> : null}
          </View>
        ) : null}
        {onRefresh ? <TouchableOpacity testID="refresh-button" onPress={onRefresh}><Text>Обновить</Text></TouchableOpacity> : null}
      </View>
    </View>
  );
}
