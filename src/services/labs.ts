import { LocalStorageService } from './localStorage';
import { Lab } from './types';

export class LabsService {
  // Получение всех анализов
  static async getLabs(): Promise<Lab[]> {
    return await LocalStorageService.getLabs();
  }

  // Получение анализа по ID
  static async getLabById(id: string): Promise<Lab | null> {
    const labs = await this.getLabs();
    return labs.find(lab => lab.id === id) || null;
  }

  // Получение анализов по категории
  static async getLabsByCategory(category: Lab['category']): Promise<Lab[]> {
    const labs = await this.getLabs();
    return labs.filter(lab => lab.category === category);
  }

  // Получение анализов за период
  static async getLabsByDateRange(startDate: string, endDate: string): Promise<Lab[]> {
    const labs = await this.getLabs();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return labs.filter(lab => {
      const labDate = new Date(lab.date);
      return labDate >= start && labDate <= end;
    });
  }

  // Получение последних анализов
  static async getRecentLabs(limit: number = 10): Promise<Lab[]> {
    const labs = await this.getLabs();
    return labs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // Добавление анализа
  static async addLab(labData: Omit<Lab, 'id' | 'created_at'>): Promise<{ success: boolean; lab?: Lab; error?: string }> {
    try {
      const newLab: Lab = {
        ...labData,
        id: this.generateLabId(),
        created_at: new Date().toISOString(),
      };

      const success = await LocalStorageService.addLab(newLab);
      if (success) {
        return { success: true, lab: newLab };
      } else {
        return { success: false, error: 'Ошибка сохранения анализа' };
      }
    } catch (error) {
      console.error('Ошибка добавления анализа:', error);
      return { success: false, error: 'Ошибка добавления анализа' };
    }
  }

  // Обновление анализа
  static async updateLab(id: string, updates: Partial<Lab>): Promise<{ success: boolean; lab?: Lab; error?: string }> {
    try {
      const labs = await this.getLabs();
      const index = labs.findIndex(lab => lab.id === id);
      
      if (index === -1) {
        return { success: false, error: 'Анализ не найден' };
      }

      labs[index] = { ...labs[index], ...updates };
      
      const success = await LocalStorageService.saveLabs(labs);
      if (success) {
        return { success: true, lab: labs[index] };
      } else {
        return { success: false, error: 'Ошибка обновления анализа' };
      }
    } catch (error) {
      console.error('Ошибка обновления анализа:', error);
      return { success: false, error: 'Ошибка обновления анализа' };
    }
  }

  // Удаление анализа
  static async deleteLab(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const labs = await this.getLabs();
      const filteredLabs = labs.filter(lab => lab.id !== id);
      
      const success = await LocalStorageService.saveLabs(filteredLabs);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Ошибка удаления анализа' };
      }
    } catch (error) {
      console.error('Ошибка удаления анализа:', error);
      return { success: false, error: 'Ошибка удаления анализа' };
    }
  }

  // Получение статистики анализов
  static async getLabsStatistics(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    thisMonth: number;
    thisYear: number;
    averageValue: Record<string, number>;
    trends: Record<string, Array<{ date: string; value: number }>>;
  }> {
    const labs = await this.getLabs();
    const now = new Date();
    
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);
    
    const stats = {
      total: labs.length,
      byCategory: {} as Record<string, number>,
      thisMonth: 0,
      thisYear: 0,
      averageValue: {} as Record<string, number>,
      trends: {} as Record<string, Array<{ date: string; value: number }>>,
    };

    // Подсчет по категориям и периодам
    const categoryValues: Record<string, number[]> = {};
    
    labs.forEach(lab => {
      const labDate = new Date(lab.date);
      
      // По категориям
      stats.byCategory[lab.category] = (stats.byCategory[lab.category] || 0) + 1;
      
      // По периодам
      if (labDate >= thisMonth) stats.thisMonth++;
      if (labDate >= thisYear) stats.thisYear++;
      
      // Для расчета средних значений
      if (!categoryValues[lab.name]) {
        categoryValues[lab.name] = [];
      }
      categoryValues[lab.name].push(lab.value);
    });

    // Средние значения
    Object.entries(categoryValues).forEach(([name, values]) => {
      stats.averageValue[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    // Тренды (последние 6 месяцев)
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const recentLabs = labs.filter(lab => new Date(lab.date) >= sixMonthsAgo);
    
    recentLabs.forEach(lab => {
      if (!stats.trends[lab.name]) {
        stats.trends[lab.name] = [];
      }
      stats.trends[lab.name].push({
        date: lab.date,
        value: lab.value,
      });
    });

    // Сортировка трендов по дате
    Object.keys(stats.trends).forEach(name => {
      stats.trends[name].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return stats;
  }

  // Получение здоровья по показателям
  static async getHealthScore(): Promise<{
    overall: number;
    byCategory: Record<string, number>;
    recommendations: string[];
  }> {
    const labs = await this.getLabs();
    const recentLabs = labs.filter(lab => {
      const labDate = new Date(lab.date);
      const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000);
      return labDate >= threeMonthsAgo;
    });

    const healthScore = {
      overall: 0,
      byCategory: {} as Record<string, number>,
      recommendations: [] as string[],
    };

    // Группировка по категориям
    const categoryLabs: Record<string, Lab[]> = {};
    recentLabs.forEach(lab => {
      if (!categoryLabs[lab.category]) {
        categoryLabs[lab.category] = [];
      }
      categoryLabs[lab.category].push(lab);
    });

    // Расчет оценки по категориям
    Object.entries(categoryLabs).forEach(([category, categoryLabList]) => {
      const scores = categoryLabList.map(lab => {
        const { min, max } = lab.referenceRange;
        const value = lab.value;
        
        if (value >= min && value <= max) {
          return 100; // В норме
        } else if (value < min) {
          return Math.max(0, 100 - ((min - value) / min) * 50); // Ниже нормы
        } else {
          return Math.max(0, 100 - ((value - max) / max) * 50); // Выше нормы
        }
      });
      
      healthScore.byCategory[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Общая оценка
    const categoryScores = Object.values(healthScore.byCategory);
    healthScore.overall = categoryScores.length > 0 
      ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length 
      : 0;

    // Рекомендации
    if (healthScore.overall < 70) {
      healthScore.recommendations.push('Рекомендуется консультация с врачом');
    }
    if (healthScore.byCategory.liver < 80) {
      healthScore.recommendations.push('Обратите внимание на показатели печени');
    }
    if (healthScore.byCategory.kidney < 80) {
      healthScore.recommendations.push('Проверьте работу почек');
    }
    if (healthScore.byCategory.hormone < 80) {
      healthScore.recommendations.push('Гормональный профиль требует внимания');
    }

    return healthScore;
  }

  // Поиск анализов
  static async searchLabs(query: string): Promise<Lab[]> {
    const labs = await this.getLabs();
    const lowercaseQuery = query.toLowerCase();
    
    return labs.filter(lab => 
      lab.name.toLowerCase().includes(lowercaseQuery) ||
      lab.category.toLowerCase().includes(lowercaseQuery) ||
      lab.notes?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Получение референсных значений
  static getReferenceRanges(): Record<string, { min: number; max: number; unit: string; category: string }> {
    return {
      'testosterone': { min: 2.4, max: 8.3, unit: 'ng/ml', category: 'hormone' },
      'estradiol': { min: 7.6, max: 42.6, unit: 'pg/ml', category: 'hormone' },
      'lh': { min: 1.7, max: 8.6, unit: 'mIU/ml', category: 'hormone' },
      'fsh': { min: 1.5, max: 12.4, unit: 'mIU/ml', category: 'hormone' },
      'shbg': { min: 16.5, max: 55.9, unit: 'nmol/l', category: 'hormone' },
      'prolactin': { min: 2.1, max: 17.7, unit: 'ng/ml', category: 'hormone' },
      
      'alt': { min: 7, max: 56, unit: 'U/L', category: 'liver' },
      'ast': { min: 10, max: 40, unit: 'U/L', category: 'liver' },
      'ggt': { min: 8, max: 61, unit: 'U/L', category: 'liver' },
      'alp': { min: 44, max: 147, unit: 'U/L', category: 'liver' },
      'bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dl', category: 'liver' },
      
      'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dl', category: 'kidney' },
      'bun': { min: 6, max: 24, unit: 'mg/dl', category: 'kidney' },
      'egfr': { min: 90, max: 120, unit: 'ml/min/1.73m²', category: 'kidney' },
      
      'total_cholesterol': { min: 0, max: 200, unit: 'mg/dl', category: 'lipid' },
      'ldl': { min: 0, max: 100, unit: 'mg/dl', category: 'lipid' },
      'hdl': { min: 40, max: 100, unit: 'mg/dl', category: 'lipid' },
      'triglycerides': { min: 0, max: 150, unit: 'mg/dl', category: 'lipid' },
      
      'hemoglobin': { min: 13.8, max: 17.2, unit: 'g/dl', category: 'blood' },
      'hematocrit': { min: 40.7, max: 50.3, unit: '%', category: 'blood' },
      'rbc': { min: 4.5, max: 5.9, unit: 'M/μL', category: 'blood' },
      'wbc': { min: 4.5, max: 11.0, unit: 'K/μL', category: 'blood' },
      'platelets': { min: 150, max: 450, unit: 'K/μL', category: 'blood' },
      
      'vitamin_d': { min: 30, max: 100, unit: 'ng/ml', category: 'vitamin' },
      'b12': { min: 200, max: 900, unit: 'pg/ml', category: 'vitamin' },
      'folate': { min: 3, max: 20, unit: 'ng/ml', category: 'vitamin' },
      
      'ck': { min: 38, max: 174, unit: 'U/L', category: 'muscle' },
      'ldh': { min: 140, max: 280, unit: 'U/L', category: 'muscle' },
    };
  }

  // Валидация анализа
  static validateLab(labData: Partial<Lab>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!labData.name || labData.name.trim().length === 0) {
      errors.push('Название анализа обязательно');
    }

    if (!labData.value || labData.value <= 0) {
      errors.push('Значение анализа должно быть больше 0');
    }

    if (!labData.unit || labData.unit.trim().length === 0) {
      errors.push('Единица измерения обязательна');
    }

    if (!labData.category) {
      errors.push('Категория анализа обязательна');
    }

    if (!labData.date) {
      errors.push('Дата анализа обязательна');
    }

    if (labData.referenceRange) {
      const { min, max } = labData.referenceRange;
      if (min >= max) {
        errors.push('Минимальное значение должно быть меньше максимального');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Генерация ID анализа
  private static generateLabId(): string {
    return 'lab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}