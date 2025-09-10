import { LabsService } from '../../services/labs';
import { LocalStorageService } from '../../services/localStorage';

describe('LabsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await LabsService.initialize();
      expect(LocalStorageService.getItem).toHaveBeenCalledWith('labs');
    });
  });

  describe('Получение анализов', () => {
    test('должна получить все анализы', async () => {
      const mockLabs = [
        { 
          id: '1', 
          name: 'Testosterone', 
          value: 800, 
          unit: 'ng/dL',
          date: '2024-01-01',
          referenceRange: '300-1000'
        },
        { 
          id: '2', 
          name: 'Estradiol', 
          value: 30, 
          unit: 'pg/mL',
          date: '2024-01-01',
          referenceRange: '15-50'
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);

      const labs = await LabsService.getLabs();
      expect(labs).toEqual(mockLabs);
    });

    test('должна получить пустой массив если анализов нет', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const labs = await LabsService.getLabs();
      expect(labs).toEqual([]);
    });

    test('должна получить анализ по ID', async () => {
      const mockLab = { 
        id: '1', 
        name: 'Testosterone', 
        value: 800, 
        unit: 'ng/dL',
        date: '2024-01-01'
      };
      const mockLabs = [mockLab];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);

      const lab = await LabsService.getLabById('1');
      expect(lab).toEqual(mockLab);
    });

    test('должна вернуть null для несуществующего анализа', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const lab = await LabsService.getLabById('nonexistent');
      expect(lab).toBeNull();
    });

    test('должна фильтровать анализы по дате', async () => {
      const mockLabs = [
        { 
          id: '1', 
          name: 'Testosterone', 
          value: 800, 
          date: '2024-01-01'
        },
        { 
          id: '2', 
          name: 'Testosterone', 
          value: 900, 
          date: '2024-02-01'
        },
        { 
          id: '3', 
          name: 'Testosterone', 
          value: 850, 
          date: '2024-03-01'
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const filteredLabs = await LabsService.getLabs(undefined, startDate, endDate);
      expect(filteredLabs).toHaveLength(1);
      expect(filteredLabs[0].id).toBe('1');
    });
  });

  describe('Добавление анализа', () => {
    test('должна добавить новый анализ', async () => {
      const newLab = {
        name: 'Testosterone',
        value: 800,
        unit: 'ng/dL',
        date: '2024-01-01',
        referenceRange: '300-1000',
        notes: 'Good levels'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.addLab(newLab);
      expect(result.success).toBe(true);
      expect(result.lab).toMatchObject(newLab);
      expect(LocalStorageService.setItem).toHaveBeenCalled();
    });

    test('должна отклонить добавление анализа с неверными данными', async () => {
      const invalidLab = {
        name: '',
        value: -100,
        unit: '',
        date: 'invalid-date'
      };

      const result = await LabsService.addLab(invalidLab);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('должна добавить ID к новому анализу', async () => {
      const newLab = {
        name: 'Testosterone',
        value: 800,
        unit: 'ng/dL',
        date: '2024-01-01'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.addLab(newLab);
      expect(result.lab.id).toBeDefined();
      expect(typeof result.lab.id).toBe('string');
    });

    test('должна автоматически определить статус анализа', async () => {
      const newLab = {
        name: 'Testosterone',
        value: 800,
        unit: 'ng/dL',
        date: '2024-01-01',
        referenceRange: '300-1000'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.addLab(newLab);
      expect(result.lab.status).toBe('normal');
    });

    test('должна определить высокий статус для превышающих значений', async () => {
      const newLab = {
        name: 'Testosterone',
        value: 1200,
        unit: 'ng/dL',
        date: '2024-01-01',
        referenceRange: '300-1000'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.addLab(newLab);
      expect(result.lab.status).toBe('high');
    });

    test('должна определить низкий статус для заниженных значений', async () => {
      const newLab = {
        name: 'Testosterone',
        value: 200,
        unit: 'ng/dL',
        date: '2024-01-01',
        referenceRange: '300-1000'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.addLab(newLab);
      expect(result.lab.status).toBe('low');
    });
  });

  describe('Обновление анализа', () => {
    test('должна обновить существующий анализ', async () => {
      const existingLab = { 
        id: '1', 
        name: 'Testosterone', 
        value: 800, 
        unit: 'ng/dL',
        date: '2024-01-01'
      };
      const mockLabs = [existingLab];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.updateLab('1', { value: 900 });
      expect(result.success).toBe(true);
      expect(result.lab.value).toBe(900);
    });

    test('должна отклонить обновление несуществующего анализа', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const result = await LabsService.updateLab('nonexistent', { value: 900 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Удаление анализа', () => {
    test('должна удалить существующий анализ', async () => {
      const existingLab = { 
        id: '1', 
        name: 'Testosterone', 
        value: 800, 
        unit: 'ng/dL',
        date: '2024-01-01'
      };
      const mockLabs = [existingLab];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await LabsService.deleteLab('1');
      expect(result.success).toBe(true);
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('labs', []);
    });

    test('должна отклонить удаление несуществующего анализа', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const result = await LabsService.deleteLab('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Анализ результатов', () => {
    test('должна проанализировать результаты анализов', async () => {
      const mockLabs = [
        { 
          id: '1', 
          name: 'Testosterone', 
          value: 800, 
          unit: 'ng/dL',
          date: '2024-01-01',
          referenceRange: '300-1000',
          status: 'normal'
        },
        { 
          id: '2', 
          name: 'Estradiol', 
          value: 80, 
          unit: 'pg/mL',
          date: '2024-01-01',
          referenceRange: '15-50',
          status: 'high'
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);

      const analysis = await LabsService.analyzeResults();
      expect(analysis.totalLabs).toBe(2);
      expect(analysis.normalCount).toBe(1);
      expect(analysis.highCount).toBe(1);
      expect(analysis.lowCount).toBe(0);
      expect(analysis.criticalValues).toContain('Estradiol');
    });

    test('должна сгенерировать рекомендации', async () => {
      const mockLabs = [
        { 
          id: '1', 
          name: 'Estradiol', 
          value: 80, 
          unit: 'pg/mL',
          date: '2024-01-01',
          referenceRange: '15-50',
          status: 'high'
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockLabs);

      const analysis = await LabsService.analyzeResults();
      expect(analysis.recommendations).toContain('Снизить дозировку эстрогена');
    });
  });
});