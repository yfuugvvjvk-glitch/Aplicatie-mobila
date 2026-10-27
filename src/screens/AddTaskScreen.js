/**
 * Ecran pentru adăugarea sau editarea unui task
 * Refolosit atât pentru creare cât și pentru editare
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { generateId } from "../utils/uuid";
import { useTask } from "../context/TaskContext";

const PRIORITIES = [
  { key: "low", label: "Scăzută", color: "#27AE60", icon: "🟢" },
  { key: "medium", label: "Medie", color: "#F5A623", icon: "🟡" },
  { key: "high", label: "Ridicată", color: "#E74C3C", icon: "🔴" },
];

export default function AddTaskScreen({ navigation, route }) {
  const { addTask, updateTask, categories, tasks } = useTask();
  const insets = useSafeAreaInsets();
  const editTaskId = route?.params?.taskId;
  const isEdit = !!editTaskId;

  // Dacă editare, populăm câmpurile cu datele existente
  const existingTask = isEdit ? tasks.find((t) => t.id === editTaskId) : null;

  const [title, setTitle] = useState(existingTask?.title || "");
  const [description, setDescription] = useState(existingTask?.description || "");
  const [priority, setPriority] = useState(existingTask?.priority || "medium");
  const [categoryId, setCategoryId] = useState(existingTask?.categoryId || null);
  // dueDate stocat ca obiect Date sau null
  const [dueDate, setDueDate] = useState(() => {
    if (!existingTask?.dueDate) return null;
    const d = new Date(existingTask.dueDate);
    return isNaN(d.getTime()) ? null : d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasReminder, setHasReminder] = useState(existingTask?.hasReminder || false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const formatDateDisplay = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const validate = () => {
    const newErrors = {};
    if (title.trim().length < 2) {
      newErrors.title = "Titlul trebuie să aibă minim 2 caractere.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;
    setSaveError("");

    const taskData = {
      id: existingTask?.id || generateId(),
      title: title.trim(),
      description: description.trim(),
      priority,
      categoryId,
      dueDate: dueDate ? dueDate.toISOString() : null,
      hasReminder,
      completed: existingTask?.completed || false,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
      completedAt: existingTask?.completedAt || null,
    };

    try {
      setSaving(true);
      Keyboard.dismiss();
      if (isEdit) {
        await updateTask(taskData);
      } else {
        await addTask(taskData);
      }
      navigation.goBack();
    } catch (error) {
      setSaveError(error.message || "Task-ul nu a putut fi salvat.");
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (_, selectedDate) => {
    if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) {
      // Normalizăm la miezul nopții local pentru a evita probleme de fus orar
      const normalized = new Date(selectedDate);
      normalized.setHours(12, 0, 0, 0); // prânz local — sigur în orice fus orar
      setDueDate(normalized);
      setSaveError("");
    }
    if (Platform.OS === "android") setShowDatePicker(false);
  };

  const onDateDismiss = () => {
    setShowDatePicker(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>
          {isEdit ? "Editare task" : "Task nou"}
        </Text>

        {/* Titlu */}
        <View style={styles.field}>
          <Text style={styles.label}>Titlu *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="ex: Pregătire prezentare..."
            value={title}
            onChangeText={(value) => { setTitle(value); setSaveError(""); }}
            maxLength={100}
            accessibilityLabel="Titlu task"
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : null}
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
                  priority === p.key && {
                    backgroundColor: p.color,
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPriority(p.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: priority === p.key }}
              >
                <Text style={styles.priorityIcon}>{p.icon}</Text>
                <Text
                  style={[
                    styles.priorityLabel,
                    priority === p.key && { color: "#fff" },
                  ]}
                >
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
                    categoryId === cat.id && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
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

        {/* Data scadentă — date picker nativ */}
        <View style={styles.field}>
          <Text style={styles.label}>Data scadentă (opțional)</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Alege data scadentă"
            >
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={dueDate ? styles.dateBtnText : styles.datePlaceholder}>
                {dueDate ? formatDateDisplay(dueDate) : "Alege o dată..."}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity
                style={styles.dateClearBtn}
                onPress={() => setDueDate(null)}
                accessibilityRole="button"
                accessibilityLabel="Șterge data scadentă"
              >
                <Text style={styles.dateClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Picker nativ — pe iOS apare inline, pe Android ca dialog */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onValueChange={onDateChange}
              onDismiss={onDateDismiss}
              minimumDate={new Date()}
              locale="ro-RO"
              accessibilityLabel="Calendar alegere dată scadentă"
            />
          )}
          {/* Pe iOS adăugăm buton de confirmare explicit */}
          {showDatePicker && Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.dateConfirmBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.dateConfirmText}>Confirmă data</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reminder */}
        <View style={styles.reminderRow}>
          <View>
            <Text style={styles.label}>Activează reminder</Text>
            <Text style={styles.reminderSub}>
              Marchează task-ul pentru urmărire
            </Text>
          </View>
          <Switch
            value={hasReminder}
            onValueChange={setHasReminder}
            trackColor={{ false: "#D0D8F0", true: "#4A6CF7" }}
            thumbColor={hasReminder ? "#fff" : "#f4f3f4"}
            accessibilityLabel="Activează reminder"
          />
        </View>

        {/* Buton salvare */}
        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? "Salvează modificările" : "Adaugă task"}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Se salvează..." : isEdit ? "💾 Salvează modificările" : "➕ Adaugă task"}
          </Text>
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
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  content: { padding: 20, paddingBottom: 40 },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2C3E6B",
    marginBottom: 24,
    marginTop: 8,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#5A6A9A", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: "#D0D8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2C3E6B",
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#E74C3C" },
  textArea: { height: 100, textAlignVertical: "top" },
  errorText: { color: "#E74C3C", fontSize: 12, marginTop: 4 },
  saveError: {
    color: "#B42318",
    backgroundColor: "#FDECEA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 13,
  },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D0D8F0",
    backgroundColor: "#fff",
    gap: 4,
  },
  priorityIcon: { fontSize: 14 },
  priorityLabel: { fontSize: 13, fontWeight: "600", color: "#5A6A9A" },
  categoryRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#D0D8F0",
    backgroundColor: "#fff",
    gap: 4,
  },
  categoryActive: { backgroundColor: "#4A6CF7", borderColor: "#4A6CF7" },
  categoryIcon: { fontSize: 14 },
  categoryText: { fontSize: 13, fontWeight: "600", color: "#5A6A9A" },
  categoryTextActive: { color: "#fff" },
  // Date picker styles
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#D0D8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  dateIcon: { fontSize: 18 },
  dateBtnText: { fontSize: 15, color: "#2C3E6B", fontWeight: "600" },
  datePlaceholder: { fontSize: 15, color: "#9BA8C0" },
  dateClearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
  },
  dateClearText: { color: "#E74C3C", fontWeight: "700", fontSize: 14 },
  dateConfirmBtn: {
    marginTop: 10,
    backgroundColor: "#4A6CF7",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateConfirmText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#D0D8F0",
  },
  reminderSub: { fontSize: 12, color: "#7B8AB8", marginTop: 2 },
  saveBtn: {
    backgroundColor: "#4A6CF7",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D0D8F0",
  },
  cancelBtnText: { color: "#7B8AB8", fontWeight: "600", fontSize: 15 },
});
