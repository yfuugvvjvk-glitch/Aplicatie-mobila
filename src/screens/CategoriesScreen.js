/**
 * Ecranul de categorii — vizualizare task-uri grupate pe categorii
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';

const COLORS = ['#4A6CF7','#27AE60','#F5A623','#E74C3C','#9B59B6','#1ABC9C','#E67E22','#2980B9'];
const ICONS = ['💼','🏠','💪','📚','🛒','🎯','🎨','🏋️','✈️','🎵','💡','🔧'];

export default function CategoriesScreen({ navigation }) {
  const { categories, addCategory, getFilteredTasks } = useTask();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [nameError, setNameError] = useState('');

  const handleAddCategory = async () => {
    if (newName.trim().length < 2) {
      setNameError('Numele trebuie să aibă minim 2 caractere.');
      return;
    }
    await addCategory({
      id: Date.now().toString(),
      name: newName.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
    setModalVisible(false);
    setNewName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
    setNameError('');
  };

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const tasksForCategory = selectedCategoryId
    ? getFilteredTasks(selectedCategoryId)
    : [];

  if (selectedCategory) {
    // Vizualizare task-uri din categorie
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
        <View style={[styles.catHeader, { backgroundColor: selectedCategory.color }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedCategoryId(null)}
            accessibilityRole="button"
            accessibilityLabel="Înapoi la categorii"
          >
            <Text style={styles.backBtnText}>← Înapoi</Text>
          </TouchableOpacity>
          <Text style={styles.catHeaderIcon}>{selectedCategory.icon}</Text>
          <Text style={styles.catHeaderName}>{selectedCategory.name}</Text>
          <Text style={styles.catHeaderCount}>
            {tasksForCategory.length} task{tasksForCategory.length !== 1 ? '-uri' : ''}
          </Text>
        </View>
        <FlatList
          data={tasksForCategory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              category={selectedCategory}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>Niciun task în această categorie</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Categorii</Text>
        <TouchableOpacity
          style={styles.addCatBtn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Adaugă categorie nouă"
        >
          <Text style={styles.addCatBtnText}>+ Adaugă</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const count = getFilteredTasks(item.id).length;
          const completed = getFilteredTasks(item.id).filter(t => t.completed).length;
          return (
            <TouchableOpacity
              style={[styles.catCard, { borderTopColor: item.color }]}
              onPress={() => setSelectedCategoryId(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Categoria ${item.name}, ${count} task-uri`}
            >
              <Text style={styles.catIcon}>{item.icon}</Text>
              <Text style={styles.catName}>{item.name}</Text>
              <View style={styles.catStats}>
                <Text style={styles.catCount}>{count} total</Text>
                <Text style={[styles.catDone, { color: item.color }]}>{completed} ✓</Text>
              </View>
              {count > 0 && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(completed / count) * 100}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal adăugare categorie */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Categorie nouă</Text>

            <Text style={styles.label}>Nume</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              placeholder="ex: Proiecte..."
              value={newName}
              onChangeText={(t) => { setNewName(t); setNameError(''); }}
              accessibilityLabel="Nume categorie"
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <Text style={styles.label}>Culoare</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorSelected]}
                  onPress={() => setSelectedColor(c)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedColor === c }}
                />
              ))}
            </View>

            <Text style={styles.label}>Pictogramă</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconBtn, selectedIcon === icon && styles.iconSelected]}
                  onPress={() => setSelectedIcon(icon)}
                  accessibilityRole="radio"
                >
                  <Text style={styles.iconBtnText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.preview, { borderColor: selectedColor }]}>
              <Text style={styles.previewIcon}>{selectedIcon}</Text>
              <Text style={[styles.previewName, { color: selectedColor }]}>
                {newName || 'Previzualizare'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => { setModalVisible(false); setNameError(''); }}
              >
                <Text style={styles.cancelModalText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddCategory}>
                <Text style={styles.saveModalText}>Adaugă</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#2C3E6B' },
  addCatBtn: {
    backgroundColor: '#4A6CF7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addCatBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  grid: { paddingHorizontal: 16, paddingBottom: 24 },
  catCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 4,
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  catIcon: { fontSize: 28, marginBottom: 8 },
  catName: { fontSize: 15, fontWeight: '700', color: '#2C3E6B', marginBottom: 6 },
  catStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catCount: { fontSize: 12, color: '#7B8AB8' },
  catDone: { fontSize: 12, fontWeight: '700' },
  progressBar: {
    height: 4,
    backgroundColor: '#E8EDFF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  catHeader: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { marginBottom: 12 },
  backBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
  catHeaderIcon: { fontSize: 40, marginBottom: 8 },
  catHeaderName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  catHeaderCount: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#7B8AB8', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E6B', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6A9A', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2C3E6B',
    marginBottom: 16,
  },
  inputError: { borderColor: '#E74C3C' },
  errorText: { color: '#E74C3C', fontSize: 12, marginTop: -12, marginBottom: 12 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#2C3E6B', transform: [{ scale: 1.15 }] },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
  },
  iconSelected: { borderColor: '#4A6CF7', backgroundColor: '#EEF1FF' },
  iconBtnText: { fontSize: 22 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    backgroundColor: '#FAFBFF',
  },
  previewIcon: { fontSize: 24 },
  previewName: { fontSize: 16, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#D0D8F0' },
  cancelModalText: { color: '#7B8AB8', fontWeight: '600', fontSize: 15 },
  saveModalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#4A6CF7' },
  saveModalText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
