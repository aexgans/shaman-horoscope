// calculationService.js - исправленная версия с правильной логикой периодов
import yearData from '../data/yearData.json'
import yearPatterns from '../data/yearPatterns.json'

class CalculationService {
  constructor() {
    this.years = yearData.years
    this.patterns = yearPatterns
    this.yearCache = new Map()
  }

  // ==================== ОСНОВНОЙ МЕТОД ====================

  calculateAll(birthDateStr) {
    try {
      const birthDate = new Date(birthDateStr + 'T00:00:00')
      
      if (isNaN(birthDate.getTime())) {
        throw new Error('Некорректная дата')
      }

      // 1. Находим год
      const yearInfo = this.findYearInfo(birthDate)
      
      // 2. Характеристики года
      const yearCharacteristics = this.getYearCharacteristics(yearInfo)
      
      // 3. Определяем период (исправленная логика!)
      const periodInfo = this.findPeriod(birthDate, yearInfo.year)
      
      // 4. Проверяем пик и наложение
      const isPeak = this.isPeak(periodInfo.dayInPeriod)
      const isOverlap = this.isOverlap(periodInfo.dayInPeriod, periodInfo.duration)
      
      // 5. Форматируем результат
      return {
        // Основные данные
        birthDate: birthDateStr,
        formattedDate: this.formatDateDDMMYYYY(birthDate),
        
        // Информация о годе
        year: yearInfo.year,
        yearStartDate: yearInfo.startDate,
        yearStartDateFormatted: this.formatDateDDMMYYYY(new Date(yearInfo.startDate + 'T00:00:00')),
        yearDay: this.calculateYearDay(birthDate, yearInfo.startDate),
        
        // Характеристики года
        animal: yearCharacteristics.animal,
        character: yearCharacteristics.character,
        element: yearCharacteristics.element,
        mengi: yearCharacteristics.mengi,
        
        // Информация о периоде
        period: periodInfo.name,
        periodDay: periodInfo.dayInPeriod,
        periodDuration: periodInfo.duration,
        periodStart: periodInfo.startDate,
        periodEnd: periodInfo.endDate,
        periodStartFormatted: this.formatDateDDMMYYYY(new Date(periodInfo.startDate)),
        periodEndFormatted: this.formatDateDDMMYYYY(new Date(periodInfo.endDate)),
        
        // Специальные флаги
        isPeakPeriod: isPeak,
        isOverlapPeriod: isOverlap,
        
        // Следующий период (если есть наложение)
        nextPeriod: isOverlap ? this.getNextPeriod(periodInfo.index) : null,
        
        // Индексы
        indices: {
          animalIndex: yearInfo.animalIndex,
          characterIndex: yearInfo.characterIndex,
          elementIndex: yearInfo.elementIndex,
          mengiIndex: yearInfo.mengiIndex,
          periodIndex: periodInfo.index
        }
      }
    } catch (error) {
      console.error('Ошибка расчета:', error)
      throw error
    }
  }

  // ==================== ФОРМАТИРОВАНИЕ ДАТ ====================

  formatDateDDMMYYYY(date) {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  formatDateLong(date) {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // ==================== ПОИСК ГОДА ====================

  findYearInfo(date) {
    const cacheKey = date.toISOString().split('T')[0]
    if (this.yearCache.has(cacheKey)) {
      return this.yearCache.get(cacheKey)
    }

    const targetDate = new Date(date)
    
    // Сортируем года по дате начала для корректного поиска
    const sortedYears = [...this.years].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    )
    
    for (let i = 0; i < sortedYears.length; i++) {
      const currentYear = sortedYears[i]
      const nextYear = sortedYears[i + 1]
      
      const currentStart = new Date(currentYear.startDate + 'T00:00:00')
      
      if (!nextYear) {
        // Последний год в базе
        if (targetDate >= currentStart) {
          const result = { ...currentYear, startDateObj: currentStart }
          this.yearCache.set(cacheKey, result)
          return result
        }
      } else {
        const nextStart = new Date(nextYear.startDate + 'T00:00:00')
        
        if (targetDate >= currentStart && targetDate < nextStart) {
          const result = { ...currentYear, startDateObj: currentStart }
          this.yearCache.set(cacheKey, result)
          return result
        }
      }
    }
    
    // Если дата раньше самого раннего года
    const earliestYear = sortedYears[0]
    if (targetDate < new Date(earliestYear.startDate + 'T00:00:00')) {
      throw new Error(`Дата ${targetDate.toISOString().split('T')[0]} раньше самого раннего года в базе: ${earliestYear.startDate}`)
    }
    
    throw new Error(`Не найден год для даты: ${date.toISOString().split('T')[0]}`)
  }

  // ==================== ХАРАКТЕРИСТИКИ ГОДА ====================

  getYearCharacteristics(yearInfo) {
    return {
      animal: this.patterns.animals[yearInfo.animalIndex],
      character: this.patterns.characters[yearInfo.characterIndex],
      element: this.patterns.elements[yearInfo.elementIndex],
      mengi: this.patterns.mengi[yearInfo.mengiIndex]
    }
  }

  // ==================== ИСПРАВЛЕННЫЙ РАСЧЕТ ПЕРИОДОВ ====================

  /**
   * Находит период для указанной даты
   * date - JavaScript Date объект
   * currentYear - числовой год для расчета периодов
   */
  findPeriod(date, currentYear) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    console.log(`Поиск периода для даты: ${day}.${month}.${year}, текущий год в базе: ${currentYear}`)
    
    // Проверяем все периоды
    for (let i = 0; i < this.patterns.periods.length; i++) {
      const period = this.patterns.periods[i]
      
      console.log(`Проверяем период ${period.name}: ${period.startMonth}.${period.startDay} - ${period.endMonth}.${period.endDay}`)
      
      // Вариант 1: Период в пределах одного года
      let startDate, endDate
      
      if (!period.crossYear) {
        // Обычный период (без перехода через год)
        startDate = new Date(year, period.startMonth - 1, period.startDay)
        endDate = new Date(year, period.endMonth - 1, period.endDay)
        
        console.log(`Обычный период: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`)
      } else {
        // Период с переходом через год (например, декабрь-январь)
        // Вариант A: Начало в предыдущем году
        if (month < period.startMonth || (month === period.startMonth && day < period.startDay)) {
          startDate = new Date(year - 1, period.startMonth - 1, period.startDay)
          endDate = new Date(year, period.endMonth - 1, period.endDay)
          console.log(`Период с переходом (вариант A): ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`)
        } 
        // Вариант B: Начало в текущем году
        else {
          startDate = new Date(year, period.startMonth - 1, period.startDay)
          endDate = new Date(year + 1, period.endMonth - 1, period.endDay)
          console.log(`Период с переходом (вариант B): ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`)
        }
      }
      
      // Проверяем, попадает ли дата в период
      if (date >= startDate && date <= endDate) {
        const dayInPeriod = Math.floor((date - startDate) / (1000 * 60 * 60 * 24)) + 1
        const duration = period.duration
        
        console.log(`✅ Найден период: ${period.name}, день: ${dayInPeriod}/${duration}`)
        
        return {
          name: period.name,
          dayInPeriod,
          duration,
          startDate: startDate,
          endDate: endDate,
          startDateStr: startDate.toISOString().split('T')[0],
          endDateStr: endDate.toISOString().split('T')[0],
          index: i
        }
      }
    }
    
    // Если не нашли - специальная логика для граничных случаев
    console.log('Период не найден стандартным способом, пробуем граничные случаи...')
    
    // Проверяем периоды с переходом через год более тщательно
    for (let i = 0; i < this.patterns.periods.length; i++) {
      const period = this.patterns.periods[i]
      
      if (period.crossYear) {
        // Период "Хвост года" (декабрь-январь) или другие периоды с переходом
        // Пробуем оба варианта: с начала в предыдущем году и с начала в текущем
        
        // Вариант 1: Начало в предыдущем году
        let startDate1 = new Date(year - 1, period.startMonth - 1, period.startDay)
        let endDate1 = new Date(year, period.endMonth - 1, period.endDay)
        
        // Вариант 2: Начало в текущем году  
        let startDate2 = new Date(year, period.startMonth - 1, period.startDay)
        let endDate2 = new Date(year + 1, period.endMonth - 1, period.endDay)
        
        if (date >= startDate1 && date <= endDate1) {
          const dayInPeriod = Math.floor((date - startDate1) / (1000 * 60 * 60 * 24)) + 1
          console.log(`✅ Найден период (граничный случай 1): ${period.name}`)
          return {
            name: period.name,
            dayInPeriod,
            duration: period.duration,
            startDate: startDate1,
            endDate: endDate1,
            startDateStr: startDate1.toISOString().split('T')[0],
            endDateStr: endDate1.toISOString().split('T')[0],
            index: i
          }
        }
        
        if (date >= startDate2 && date <= endDate2) {
          const dayInPeriod = Math.floor((date - startDate2) / (1000 * 60 * 60 * 24)) + 1
          console.log(`✅ Найден период (граничный случай 2): ${period.name}`)
          return {
            name: period.name,
            dayInPeriod,
            duration: period.duration,
            startDate: startDate2,
            endDate: endDate2,
            startDateStr: startDate2.toISOString().split('T')[0],
            endDateStr: endDate2.toISOString().split('T')[0],
            index: i
          }
        }
      }
    }
    
    // Если всё еще не нашли, возвращаем последний период как fallback
    const lastPeriod = this.patterns.periods[this.patterns.periods.length - 1]
    console.warn(`Период не найден для даты ${date.toISOString().split('T')[0]}, возвращаем fallback: ${lastPeriod.name}`)
    
    const fallbackStart = new Date(year, lastPeriod.startMonth - 1, lastPeriod.startDay)
    const fallbackEnd = lastPeriod.crossYear 
      ? new Date(year + 1, lastPeriod.endMonth - 1, lastPeriod.endDay)
      : new Date(year, lastPeriod.endMonth - 1, lastPeriod.endDay)
    
    const dayInPeriod = Math.floor((date - fallbackStart) / (1000 * 60 * 60 * 24)) + 1
    
    return {
      name: lastPeriod.name,
      dayInPeriod,
      duration: lastPeriod.duration,
      startDate: fallbackStart,
      endDate: fallbackEnd,
      startDateStr: fallbackStart.toISOString().split('T')[0],
      endDateStr: fallbackEnd.toISOString().split('T')[0],
      index: this.patterns.periods.length - 1
    }
  }

  /**
   * Упрощенная версия поиска периода (альтернативный подход)
   */
  findPeriodSimple(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-12
    const day = date.getDate()
    
    // Преобразуем дату в день года (с 1 января)
    const dateObj = new Date(year, month - 1, day)
    const startOfYear = new Date(year, 0, 1)
    const dayOfYear = Math.floor((dateObj - startOfYear) / (1000 * 60 * 60 * 24)) + 1
    
    console.log(`День года для ${day}.${month}.${year}: ${dayOfYear}`)
    
    // Проходим по всем периодам
    for (let i = 0; i < this.patterns.periods.length; i++) {
      const period = this.patterns.periods[i]
      
      // Рассчитываем дни начала и конца периода
      const periodStartDay = this.calculateDayOfYear(period.startMonth, period.startDay, year)
      let periodEndDay = this.calculateDayOfYear(period.endMonth, period.endDay, year)
      
      // Для периодов с переходом через год
      if (period.crossYear && periodEndDay < periodStartDay) {
        periodEndDay += 365 + (this.isLeapYear(year) ? 1 : 0)
      }
      
      console.log(`Период ${period.name}: дни ${periodStartDay}-${periodEndDay}`)
      
      // Проверяем, попадает ли день года в период
      let adjustedDayOfYear = dayOfYear
      if (period.crossYear && dayOfYear < periodStartDay) {
        adjustedDayOfYear += 365 + (this.isLeapYear(year) ? 1 : 0)
      }
      
      if (adjustedDayOfYear >= periodStartDay && adjustedDayOfYear <= periodEndDay) {
        const dayInPeriod = adjustedDayOfYear - periodStartDay + 1
        
        // Рассчитываем реальные даты
        const startDate = this.dateFromDayOfYear(periodStartDay, year)
        let endDate = this.dateFromDayOfYear(periodEndDay, year)
        
        // Если периодEndDay больше 365/366, значит это следующий год
        if (periodEndDay > (365 + (this.isLeapYear(year) ? 1 : 0))) {
          endDate = this.dateFromDayOfYear(periodEndDay - (365 + (this.isLeapYear(year) ? 1 : 0)), year + 1)
        }
        
        console.log(`✅ Найден период: ${period.name}`)
        
        return {
          name: period.name,
          dayInPeriod,
          duration: period.duration,
          startDate: startDate,
          endDate: endDate,
          startDateStr: startDate.toISOString().split('T')[0],
          endDateStr: endDate.toISOString().split('T')[0],
          index: i
        }
      }
    }
    
    throw new Error(`Не удалось определить период для даты ${date.toISOString().split('T')[0]}`)
  }

  /**
   * Рассчитывает день года (1-365/366) для указанных месяца и дня
   */
  calculateDayOfYear(month, day, year) {
    const date = new Date(year, month - 1, day)
    const startOfYear = new Date(year, 0, 1)
    return Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24)) + 1
  }

  /**
   * Преобразует день года в дату
   */
  dateFromDayOfYear(dayOfYear, year) {
    const date = new Date(year, 0, 1) // 1 января
    date.setDate(dayOfYear)
    return date
  }

  /**
   * Проверяет високосный год
   */
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  }

  isPeak(dayInPeriod) {
    const [start, end] = this.patterns.rules.peakDays
    return dayInPeriod >= start && dayInPeriod <= end
  }

  isOverlap(dayInPeriod, periodDuration) {
    const overlapDays = this.patterns.rules.overlapDays
    const daysLeft = periodDuration - dayInPeriod
    return daysLeft <= overlapDays
  }

  getNextPeriod(currentPeriodIndex) {
    const nextIndex = (currentPeriodIndex + 1) % this.patterns.periods.length
    const nextPeriod = this.patterns.periods[nextIndex]
    const year = new Date().getFullYear()
    
    const startDate = new Date(year, nextPeriod.startMonth - 1, nextPeriod.startDay)
    let endDate = new Date(year, nextPeriod.endMonth - 1, nextPeriod.endDay)
    
    if (nextPeriod.crossYear && nextPeriod.endMonth < nextPeriod.startMonth) {
      endDate = new Date(year + 1, nextPeriod.endMonth - 1, nextPeriod.endDay)
    }
    
    return {
      name: nextPeriod.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateFormatted: this.formatDateDDMMYYYY(startDate),
      endDateFormatted: this.formatDateDDMMYYYY(endDate),
      index: nextIndex
    }
  }

  calculateYearDay(date, yearStartDateStr) {
    const startDate = new Date(yearStartDateStr + 'T00:00:00')
    const diffMs = date - startDate
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

  getYearByNumber(year) {
    const yearData = this.years.find(y => y.year === year)
    if (!yearData) return null
    
    return {
      ...yearData,
      animal: this.patterns.animals[yearData.animalIndex],
      character: this.patterns.characters[yearData.characterIndex],
      element: this.patterns.elements[yearData.elementIndex],
      mengi: this.patterns.mengi[yearData.mengiIndex],
      startDateFormatted: this.formatDateDDMMYYYY(new Date(yearData.startDate + 'T00:00:00'))
    }
  }

  getPeriodsForYear(targetYear) {
    return this.patterns.periods.map((period, index) => {
      let startDate, endDate
      
      if (!period.crossYear) {
        startDate = new Date(targetYear, period.startMonth - 1, period.startDay)
        endDate = new Date(targetYear, period.endMonth - 1, period.endDay)
      } else {
        // Для периода с переходом через год
        startDate = new Date(targetYear, period.startMonth - 1, period.startDay)
        endDate = new Date(targetYear + 1, period.endMonth - 1, period.endDay)
      }
      
      return {
        name: period.name,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        startDateFormatted: this.formatDateDDMMYYYY(startDate),
        endDateFormatted: this.formatDateDDMMYYYY(endDate),
        duration: period.duration,
        index: index
      }
    })
  }

  getStats() {
    return {
      totalYears: this.years.length,
      minYear: this.years[0]?.year || 0,
      maxYear: this.years[this.years.length - 1]?.year || 0,
      totalPeriods: this.patterns.periods.length
    }
  }
}

export const calculationService = new CalculationService()