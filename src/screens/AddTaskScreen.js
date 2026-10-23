/**
 * Ecran pentru adăugarea sau editarea unui task
 * Refolosit atât pentru creare cât și pentru editare
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useTask } from '../context/TaskContext';

const PRIORITIES = [
  { key: 'low', label: 'Scăzută', color: '#27AE60', icon: '🟢' },
  { key: 'medium', label: 'Medie', color: '#F5A623', icon: '🟡' },
  { key: 'high', label: 'Ridicată', color: '#E74C3C', icon: '🔴' },
];

export default function AddTaskScreen({ navigation, route }) {
  const { addTask, updateTask, categories, tasks } = useTask();
  const editTaskId = route?.params?.taskId;
  const isEdit = !!editTaskId;

  // Dacă editare, populăm câmpurile cu datele existente
  const existingTask = isEdit ? tasks.find((t) => t.id === editTaskId) : null;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [priority, setPriority] = useState(existingTask?.priority || 'medium');
  const [categoryId, setCategoryId] = useState(existingTask?.categoryId || null);
  const [dueDate, setDueDate] = useState(existingTask?.dueDate ? existingTask.dueDate.substring(0, 10) : '');
  const [hasReminder, setHasReminder] = useState(existingTask?.hasReminder || false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (title.trim().length < 2) {
      newErrors.title = 'Titlul trebuie să aibă minim 2 caractere.';
    }
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        newErrors.dueDate = 'Data nu este validă. Folosiți formatul AAAA-LL-ZZ.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const taskData = {
      id: existingTask?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      priority,
      categoryId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      hasReminder,
      completed: existingTask?.completed || false,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
      completedAt: existingTask?.completedAt || null,
    };

    if (isEdit) {
      await updateTask(taskData);
    } else {
      await addTask(taskData);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>{isEdit ? 'Editare task' : 'Task nou'}</Text>

        {/* Titlu */}
        <View style={styles.field}>
          <Text style={styles.label}>Titlu *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="ex: Pregătire prezentare..."
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            accessibilityLabel="Titlu task"
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>

        {/* Descriere */}
        <View style={styles.field}>
          <Text style={styles.label}>Descriere</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Adaugă detalii despre task..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            accessibilityLabel="Descriere task"
          />
        </View>

        {/* Prioritate */}
        <View style={styles.field}>
          <Text style={styles.label}>Prioritate</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.priorityChip,
                  priority === p.key && { backgroundColor: p.color, borderColor: p.color },
                ]}
                onPress={() => setPriority(p.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: priority === p.key }}
              >
                <Text style={styles.priorityIcon}>{p.icon}</Text>
                <Text style={[styles.priorityLabel, priority === p.key && { color: '#fff' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categorie */}
        <View style={styles.field}>
          <Text style={styles.label}>Categorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[styles.categoryChip, !categoryId && styles.categoryActive]}
                onPress={() => setCategoryId(null)}
                accessibilityRole="button"
              >
                <Text style={[styles.categoryText, !categoryId && styles.categoryTextActive]}>
                  Niciuna
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: categoryId === cat.id }}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      categoryId === cat.id && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Data scadentă */}
        <View style={styles.field}>
          <Text style={styles.label}>Data scadentă (opțional)</Text>
          <TextInput
            style={[styles.input, errors.dueDate && styles.inputError]}
            placeholder="AAAA-LL-ZZ"
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numeric"
            maxLength={10}
            accessibilityLabel="Data scadentă"
          />
          {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}
        </View>

        {/* Reminder */}
        <View style={styles.reminderRow}>
          <View>
            <Text style={styles.label}>Activează reminder</Text>
            <Text style={styles.reminderSub}>Vei fi notificat la data scadentă</Text>
          </View>
          <Switch
            value={hasReminder}
            onValueChange={setHasReminder}
            trackColor={{ false: '#D0D8F0', true: '#4A6CF7' }}
            thumbColor={hasReminder ? '#fff' : '#f4f3f4'}
            accessibilityLabel="Activează reminder"
          />
        </View>

        {/* Buton salvare */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? 'Salvează modificările' : 'Adaugă task'}
        >
          <Text style={styles.saveBtnText}>{isEdit ? '💾 Salvează modificările' : '➕ Adaugă task'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Anulează"
        >
          <Text style={styles.cancelBtnText}>Anulează</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 40 },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E6B',
    marginBottom: 24,
    marginTop: 8,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#5A6A9A', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2C3E6B',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#E74C3C' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: '#E74C3C', fontSize: 12, marginTop: 4 },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
    backgroundColor: '#fff',
    gap: 4,
  },
  priorityIcon: { fontSize: 14 },
  priorityLabel: { fontSize: 13, fontWeight: '600', color: '#5A6A9A' },
  categoryRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
    backgroundColor: '#fff',
    gap: 4,
  },
  categoryActive: { backgroundColor: '#4A6CF7', borderColor: '#4A6CF7' },
  categoryIcon: { fontSize: 14 },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#5A6A9A' },
  categoryTextActive: { color: '#fff' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
  },
  reminderSub: { fontSize: 12, color: '#7B8AB8', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#4A6CF7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
  },
  cancelBtnText: { color: '#7B8AB8', fontWeight: '600', fontSize: 15 },
});
