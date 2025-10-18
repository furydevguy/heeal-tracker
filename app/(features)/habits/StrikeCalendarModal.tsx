import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  ColorValue,
} from 'react-native';
import { useTokens } from '../../providers/ThemeProvider';
import { Habit, getHabitEntries, HabitEntry } from '../../lib/firebaseHelpers';
import {ChevronLeft } from 'lucide-react-native';
import { HabitLog } from '../../types/habit';
interface StrikeCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  habit: Habit | null;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  completed: boolean | null;
  isToday: boolean;
  value: number | null;
}

const screenWidth = Dimensions.get('window').width;

export default function StrikeCalendarModal({ visible, onClose, habit }: StrikeCalendarModalProps) {
  const t = useTokens();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habitLogs, setHabitLogs] = useState<Record<string, HabitEntry>>({});
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Load habit logs when habit changes
  useEffect(() => {
    if (habit && visible) {
      loadHabitLogs();
    }
  }, [habit, visible]);

  const loadHabitLogs = async () => {
    if (!habit?.id) return;

    setLoading(true);
    try {
      // Get habit logs for the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const logs = await getHabitEntries(habit.id, startDate, endDate);
      
      // Convert logs to a map for quick lookup
      const logsMap: Record<string, HabitEntry> = {};
      logs.forEach(log => {
        logsMap[log.date] = log;
      });

      setHabitLogs(logsMap);
      calculateStreak(logs);
    } catch (error) {
      console.error('Error loading habit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (logs: any[]) => {
    if (!logs.length) {
      setStreak(0);
      return;
    }

    // Sort dates in descending order
    const sortedDates = logs
      .map(log => log.date)
      .sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today is completed
    if (sortedDates[0] === today) {
      currentStreak = 1;
    } else {
      // Check if yesterday is completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (sortedDates[0] === yesterdayStr) {
        currentStreak = 1;
      } else {
        setStreak(0);
        return;
      }
    }

    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i - 1]);
      const previousDate = new Date(sortedDates[i]);
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the first week
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // End at Saturday of the last week
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isCurrentMonth = d.getMonth() === month;
      const completed = habitLogs[dateStr]?.completed ?? null;
      const value = habitLogs[dateStr]?.value ?? 0;
      const isToday = d.toDateString() === today.toDateString();
      days.push({
        date: new Date(d),
        isCurrentMonth,
        completed,
        isToday,
        value
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const calendarDays = generateCalendarDays();

  if (!habit) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: t.colors.card }, t.shadows.medium]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ChevronLeft size={24} color={t.colors.text}/>
          </TouchableOpacity>
          
          <View style={styles.habitInfo}>
            <Text style={[styles.habitIcon, { color: t.colors.text }]}>{habit.icon}</Text>
            <View style={styles.habitDetails}>
              <Text style={[styles.habitName, { color: t.colors.text }]}>{habit.name}</Text>
              <Text style={[styles.streakText, { color: t.colors.primary }]}>
                🔥 {streak} day streak
              </Text>
            </View>
          </View>
        </View>
        {/* Calendar Navigation */}
        <View style={[styles.calendarHeader, { backgroundColor: t.colors.card }, t.shadows.small]}>
          <TouchableOpacity
            onPress={() => navigateMonth('prev')}
            style={[styles.navButton, { backgroundColor: t.colors.bg }]}
          >
            <Text style={[styles.navButtonText, { color: t.colors.primary }]}>‹</Text>
          </TouchableOpacity>
          
          <Text style={[styles.monthYear, { color: t.colors.text }]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigateMonth('next')}
            style={[styles.navButton, { backgroundColor: t.colors.bg }]}
          >
            <Text style={[styles.navButtonText, { color: t.colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <ScrollView style={styles.calendarContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={t.colors.primary} />
              <Text style={[styles.loadingText, { color: t.colors.muted }]}>
                Loading habit data...
              </Text>
            </View>
          ) : (
            <View style={[styles.calendar, { backgroundColor: t.colors.card }, t.shadows.small]}>
              {/* Day names header */}
              <View style={styles.dayNamesRow}>
                {dayNames.map((dayName) => (
                  <Text
                    key={dayName}
                    style={[styles.dayName, { color: t.colors.muted }]}
                  >
                    {dayName}
                  </Text>
                ))}
              </View>

              {/* Calendar days */}
              <View style={styles.daysGrid}>
                {calendarDays.map((day, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dayCell,
                      !day.isCurrentMonth && styles.dayCellOtherMonth,
                    ]}
                  >
                    <View
                      style={[
                        styles.dayContent,
                        day.completed && {
                          backgroundColor: t.colors.primary,
                          borderRadius: t.radius.md,
                        },
                          day.isToday && !day.completed && {
                          borderColor: t.colors.primary,
                          borderWidth: 2,
                          borderRadius: t.radius.md,
                        },
                        day.value != null && day.value > 0 &&{
                          opacity:day.value/(habit.goal ?? 1),
                          backgroundColor: t.colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: t.colors.text },
                          !day.isCurrentMonth && { color: t.colors.muted },
                          day.completed && { color: t.colors.bg },
                          day.isToday && !day.completed && { color: t.colors.primary },
                        ]}
                      >
                        {day.date.getDate()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View> 
          )}

          {/* Legend */}
          <View style={[styles.legend, { backgroundColor: t.colors.card }, t.shadows.small]}>
            <Text style={[styles.legendTitle, { color: t.colors.text }]}>Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: t.colors.primary }]} />
                <Text style={[styles.legendText, { color: t.colors.text }]}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: t.colors.primary, borderWidth: 2 }]} />
                <Text style={[styles.legendText, { color: t.colors.text }]}>Today</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.stats, { backgroundColor: t.colors.card }, t.shadows.small]}>
            <Text style={[styles.statsTitle, { color: t.colors.text }]}>This Month</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.colors.primary }]}>
                  {Object.keys(habitLogs).length}
                </Text>
                <Text style={[styles.statLabel, { color: t.colors.muted }]}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.colors.success }]}>
                  {streak}
                </Text>
                <Text style={[styles.statLabel, { color: t.colors.muted }]}>Current Streak</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,

    borderBottomColor: '#E6E6E6',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  habitDetails: {
    paddingTop: 12,
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  calendar: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `14.28%`,
    aspectRatio: 1,
   maxWidth:`14.28%`
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayContent: {
    flex: 1,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  legend: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  stats: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
});
