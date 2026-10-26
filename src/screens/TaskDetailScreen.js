/**
 * Ecranul de detaliu al unui task — vizualizare completă, marcare, ștergere
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTask } from '../context/TaskContext';

const PRIORITY_CONFIG = {
  low: { label: 'Scăzută', color: '#27AE60', bg: '#E8F8EF', icon: '🟢' },
  medium: { label: 'Medie', color: '#F5A623', bg: '#FEF5E7', icon: '🟡' },
  high: { label: 'Ridicată', color: '#E74C3C', bg: '#FDECEA', icon: '🔴' },
};

export default function TaskDetailScreen({ navigation, route }) {
  const { taskId } = route.params;
  const { tasks, categories, toggleTask, deleteTask } = useTask();

  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Task-ul nu a fost găsit.</Text>
      </View>
    );
  }

  const category = categories.find((c) => c.id === task.categoryId);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const isOverdue =
    !task.completed && task.dueDate && new Date(task.dueDate) < new Date();

  const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Șterge task',
      `Ești sigur că vrei să ștergi "${task.title}"?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Ștergere eșuată', error.message || 'Task-ul nu a putut fi șters.');
            }
          },
        },
      ]
    );
  };

  const handleToggle = async () => {
    try {
      await toggleTask(task.id);
    } catch (error) {
      Alert.alert('Modificare eșuată', error.message || 'Task-ul nu a putut fi actualizat.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status badge */}
      <View style={[styles.statusBadge, task.completed ? styles.statusDone : styles.statusActive]}>
        <Text style={styles.statusText}>
          {task.completed ? '✅ Finalizat' : isOverdue ? '⚠️ Depășit' : '⏳ În desfășurare'}
        </Text>
      </View>

      {/* Titlu */}
      <Text style={[styles.title, task.completed && styles.titleDone]}>{task.title}</Text>

      {/* Descriere */}
      {task.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📝 Descriere</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      ) : null}

      {/* Info grid */}
      <View style={styles.infoGrid}>
        {/* Prioritate */}
        <View style={[styles.infoCard, { backgroundColor: priority.bg }]}>
          <Text style={styles.infoCardIcon}>{priority.icon}</Text>
          <Text style={styles.infoCardLabel}>Prioritate</Text>
          <Text style={[styles.infoCardValue, { color: priority.color }]}>{priority.label}</Text>
        </View>

        {/* Categorie */}
        {category && (
          <View style={[styles.infoCard, { backgroundColor: category.color + '22' }]}>
            <Text style={styles.infoCardIcon}>{category.icon}</Text>
            <Text style={styles.infoCardLabel}>Categorie</Text>
            <Text style={[styles.infoCardValue, { color: category.color }]}>{category.name}</Text>
          </View>
        )}

        {/* Data scadentă */}
        {task.dueDate && (
          <View style={[styles.infoCard, isOverdue ? styles.overdueCard : styles.normalCard]}>
            <Text style={styles.infoCardIcon}>{isOverdue ? '⚠️' : '📅'}</Text>
            <Text style={styles.infoCardLabel}>Scadent</Text>
            <Text style={[styles.infoCardValue, isOverdue && { color: '#E74C3C' }]}>
              {formatDate(task.dueDate)}
            </Text>
          </View>
        )}

        {/* Creat la */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardIcon}>🕐</Text>
          <Text style={styles.infoCardLabel}>Creat</Text>
          <Text style={styles.infoCardValue}>{formatDate(task.createdAt)}</Text>
        </View>
      </View>

      {/* Finalizat la */}
      {task.completed && task.completedAt && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>
            🎉 Finalizat pe {formatDate(task.completedAt)}
          </Text>
        </View>
      )}

      {/* Reminder */}
      {task.hasReminder && (
        <View style={styles.reminderBadge}>
          <Text style={styles.reminderText}>🔔 Reminder activat</Text>
        </View>
      )}

      {/* Acțiuni */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.toggleBtn]}
          onPress={handleToggle}
          accessibilityRole="button"
          accessibilityLabel={task.completed ? 'Marchează ca nefinalizat' : 'Marchează ca finalizat'}
        >
          <Text style={styles.toggleBtnText}>
            {task.completed ? '↩️ Marchează ca activ' : '✅ Marchează finalizat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.editBtn]}
          onPress={() => navigation.navigate('AddTask', { taskId: task.id })}
          accessibilityRole="button"
          accessibilityLabel="Editează task"
        >
          <Text style={styles.editBtnText}>✏️ Editează</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.deleteBtn]}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Șterge task"
        >
          <Text style={styles.deleteBtnText}>🗑️ Șterge</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: '#7B8AB8', fontSize: 16 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDone: { backgroundColor: '#E8F8EF' },
  statusActive: { backgroundColor: '#E8EDFF' },
  statusText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#2C3E6B', marginBottom: 16 },
  titleDone: { textDecorationLine: 'line-through', color: '#9B8AB8' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EDFF',
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#5A6A9A', marginBottom: 6 },
  description: { fontSize: 15, color: '#4A5568', lineHeight: 22 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  infoCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    padding: 14,
    minWidth: '46%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8EDFF',
  },
  overdueCard: { backgroundColor: '#FDECEA', borderColor: '#F5B7B1' },
  normalCard: { backgroundColor: '#F8FAFF', borderColor: '#E8EDFF' },
  infoCardIcon: { fontSize: 20, marginBottom: 4 },
  infoCardLabel: { fontSize: 11, color: '#9BA8C0', fontWeight: '600', marginBottom: 2 },
  infoCardValue: { fontSize: 14, fontWeight: '700', color: '#2C3E6B' },
  completedBanner: {
    backgroundColor: '#E8F8EF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  completedText: { color: '#27AE60', fontWeight: '600', fontSize: 14 },
  reminderBadge: {
    backgroundColor: '#FEF5E7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  reminderText: { color: '#F5A623', fontWeight: '600', fontSize: 13 },
  actions: { gap: 10 },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  toggleBtn: { backgroundColor: '#4A6CF7' },
  toggleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  editBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#4A6CF7' },
  editBtnText: { color: '#4A6CF7', fontWeight: '700', fontSize: 15 },
  deleteBtn: { backgroundColor: '#FDECEA', borderWidth: 1.5, borderColor: '#E74C3C' },
  deleteBtnText: { color: '#E74C3C', fontWeight: '700', fontSize: 15 },
});
