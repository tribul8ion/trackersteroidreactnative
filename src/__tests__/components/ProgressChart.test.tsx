import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgressChart } from '../../components/ProgressChart';

describe('ProgressChart', () => {
  const mockData = [
    { date: '2024-01-01', value: 100, label: 'Week 1' },
    { date: '2024-01-08', value: 120, label: 'Week 2' },
    { date: '2024-01-15', value: 110, label: 'Week 3' },
    { date: '2024-01-22', value: 130, label: 'Week 4' }
  ];

  const mockProps = {
    data: mockData,
    title: 'Test Progress',
    unit: 'kg',
    color: '#2196F3'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('должен отрендериться без ошибок', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('progress-chart')).toBeTruthy();
  });

  test('должен отобразить заголовок', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByText('Test Progress')).toBeTruthy();
  });

  test('должен отобразить график', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('chart-container')).toBeTruthy();
  });

  test('должен отобразить данные на графике', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('chart-data')).toBeTruthy();
  });

  test('должен отобразить оси графика', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('chart-x-axis')).toBeTruthy();
    expect(getByTestId('chart-y-axis')).toBeTruthy();
  });

  test('должен отобразить подписи осей', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByText('Дата')).toBeTruthy();
    expect(getByText('Значение (kg)')).toBeTruthy();
  });

  test('должен отобразить точки данных', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('data-point-0')).toBeTruthy();
    expect(getByTestId('data-point-1')).toBeTruthy();
    expect(getByTestId('data-point-2')).toBeTruthy();
    expect(getByTestId('data-point-3')).toBeTruthy();
  });

  test('должен отобразить линии между точками', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('chart-line')).toBeTruthy();
  });

  test('должен отобразить легенду', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('chart-legend')).toBeTruthy();
  });

  test('должен отобразить статистику', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('chart-stats')).toBeTruthy();
  });

  test('должен отобразить минимальное значение', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByText('100 kg')).toBeTruthy();
  });

  test('должен отобразить максимальное значение', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByText('130 kg')).toBeTruthy();
  });

  test('должен отобразить среднее значение', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByText('115 kg')).toBeTruthy();
  });

  test('должен отобразить тренд', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('trend-indicator')).toBeTruthy();
  });

  test('должен отобразить восходящий тренд', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByText('↗ Восходящий')).toBeTruthy();
  });

  test('должен отобразить нисходящий тренд', () => {
    const descendingData = [
      { date: '2024-01-01', value: 130, label: 'Week 1' },
      { date: '2024-01-08', value: 120, label: 'Week 2' },
      { date: '2024-01-15', value: 110, label: 'Week 3' },
      { date: '2024-01-22', value: 100, label: 'Week 4' }
    ];

    const { getByText } = render(
      <ProgressChart {...mockProps} data={descendingData} />
    );

    expect(getByText('↘ Нисходящий')).toBeTruthy();
  });

  test('должен отобразить стабильный тренд', () => {
    const stableData = [
      { date: '2024-01-01', value: 100, label: 'Week 1' },
      { date: '2024-01-08', value: 100, label: 'Week 2' },
      { date: '2024-01-15', value: 100, label: 'Week 3' },
      { date: '2024-01-22', value: 100, label: 'Week 4' }
    ];

    const { getByText } = render(
      <ProgressChart {...mockProps} data={stableData} />
    );

    expect(getByText('→ Стабильный')).toBeTruthy();
  });

  test('должен отобразить пустое состояние', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} data={[]} />
    );

    expect(getByTestId('empty-state')).toBeTruthy();
  });

  test('должен отобразить сообщение о пустых данных', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} data={[]} />
    );

    expect(getByText('Нет данных для отображения')).toBeTruthy();
  });

  test('должен отобразить кнопку обновления', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    expect(getByTestId('refresh-button')).toBeTruthy();
  });

  test('должен обновить данные при нажатии на кнопку обновления', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <ProgressChart {...mockProps} onRefresh={onRefresh} />
    );

    fireEvent.press(getByTestId('refresh-button'));

    expect(onRefresh).toHaveBeenCalled();
  });

  test('должен отобразить индикатор загрузки', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} loading={true} />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('должен отобразить ошибку', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} error="Test error" />
    );

    expect(getByTestId('error-message')).toBeTruthy();
  });

  test('должен отобразить сообщение об ошибке', () => {
    const { getByText } = render(
      <ProgressChart {...mockProps} error="Test error" />
    );

    expect(getByText('Test error')).toBeTruthy();
  });

  test('должен отобразить кнопку повтора при ошибке', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ProgressChart {...mockProps} error="Test error" onRetry={onRetry} />
    );

    expect(getByTestId('retry-button')).toBeTruthy();
  });

  test('должен повторить загрузку при нажатии на кнопку повтора', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ProgressChart {...mockProps} error="Test error" onRetry={onRetry} />
    );

    fireEvent.press(getByTestId('retry-button'));

    expect(onRetry).toHaveBeenCalled();
  });

  test('должен отобразить правильный цвет графика', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    const chartLine = getByTestId('chart-line');
    expect(chartLine).toHaveStyle({ stroke: '#2196F3' });
  });

  test('должен отобразить правильный цвет точек данных', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    const dataPoint = getByTestId('data-point-0');
    expect(dataPoint).toHaveStyle({ fill: '#2196F3' });
  });

  test('должен отобразить правильный размер точек данных', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    const dataPoint = getByTestId('data-point-0');
    expect(dataPoint).toHaveStyle({ r: '4' });
  });

  test('должен отобразить правильную толщину линии', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    const chartLine = getByTestId('chart-line');
    expect(chartLine).toHaveStyle({ strokeWidth: '2' });
  });

  test('должен отобразить правильные отступы', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} />
    );

    const chartContainer = getByTestId('chart-container');
    expect(chartContainer).toHaveStyle({ padding: 16 });
  });

  test('должен отобразить правильную высоту', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} height={300} />
    );

    const chartContainer = getByTestId('chart-container');
    expect(chartContainer).toHaveStyle({ height: 300 });
  });

  test('должен отобразить правильную ширину', () => {
    const { getByTestId } = render(
      <ProgressChart {...mockProps} width={400} />
    );

    const chartContainer = getByTestId('chart-container');
    expect(chartContainer).toHaveStyle({ width: 400 });
  });
});