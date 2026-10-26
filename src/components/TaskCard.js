/**
 * Componentă reutilizabilă pentru afișarea unui task în listă
 * Suportă swipe-to-complete și afișare vizuală a priorității
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTask } from '../context/TaskContext';

const PRIORITY_COLORS = {
  low: '#27AE60',
  medium: '#F5A623',
  high: '#E74C3C',
};

export default function TaskCard({ task, category, onPress }) {
  const { toggleTask } = useTask();

  const handleToggle = async () => {
    try {
      await toggleTask(task.id);
    } catch (error) {
      Alert.alert('Modificare eșuată', error.message || 'Task-ul nu a putut fi actualizat.');
    }
  };

  const isOverdue =
    !task.completed && task.dueDate && new Date(task.dueDate) < new Date();

  const formatDueDate = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Azi';
    if (date.toDateString() === tomorrow.toDateString()) return 'Mâine';
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        task.completed && styles.cardDone,
        isOverdue && styles.cardOverdue,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}, ${task.completed ? 'finalizat' : 'activ'}`}
    >
      {/* Indicator prioritate */}
      <View
        style={[
          styles.priorityBar,
          { backgroundColor: PRIORITY_COLORS[task.priority] || '#7B8AB8' },
        ]}
      />

      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, task.completed && styles.checkboxDone]}
        onPress={handleToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Marchează task ${task.completed ? 'ca nefinalizat' : 'ca finalizat'}`}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Conținut */}
      <View style={styles.content}>
        <Text
          style={[styles.title, task.completed && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}

        {/* Meta info */}
        <View style={styles.meta}>
          {category && (
            <View style={[styles.catBadge, { backgroundColor: category.color + '22' }]}>
              <Text style={styles.catBadgeText}>
                {category.icon} {category.name}
              </Text>
            </View>
          )}
          {task.dueDate && (
            <View style={[styles.dateBadge, isOverdue && styles.dateBadgeOverdue]}>
              <Text style={[styles.dateText, isOverdue && styles.dateTextOverdue]}>
                {isOverdue ? '⚠️ ' : '📅 '}
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          )}
          {task.hasReminder && (
            <Text style={styles.reminderIcon}>🔔</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  cardDone: { opacity: 0.65 },
  cardOverdue: {
    borderWidth: 1.5,
    borderColor: '#F5B7B1',
  },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D8F0',
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  content: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#2C3E6B', marginBottom: 2 },
  titleDone: { textDecorationLine: 'line-through', color: '#9BA8C0' },
  description: { fontSize: 12, color: '#7B8AB8', marginBottom: 6 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: '#4A5568' },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#E8EDFF',
  },
  dateBadgeOverdue: { backgroundColor: '#FDECEA' },
  dateText: { fontSize: 11, fontWeight: '600', color: '#4A6CF7' },
  dateTextOverdue: { color: '#E74C3C' },
  reminderIcon: { fontSize: 12 },
});
