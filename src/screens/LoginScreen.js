/**
 * Ecran de autentificare — validare input, login/register simplu
 * cu stocare locală (fără backend extern, dar arhitectura permite integrare)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useTask } from '../context/TaskContext';
import { isSupabaseConfigured } from '../services/supabase';

export default function LoginScreen() {
  const { login, register, continueAsDemo } = useTask();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validare câmpuri
  const validate = () => {
    const newErrors = {};
    if (isRegister && name.trim().length < 2) {
      newErrors.name = 'Numele trebuie să aibă minim 2 caractere.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Adresa de email nu este validă.';
    }
    if (password.length < (isRegister ? 8 : 1)) {
      newErrors.password = isRegister
        ? 'Parola trebuie să aibă minim 8 caractere.'
        : 'Introdu parola.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isRegister) {
        const result = await register({ name, email, password });
        if (result.confirmationRequired) {
          Alert.alert(
            'Verifică adresa de email',
            'Contul a fost creat. Confirmă adresa din mesajul primit, apoi autentifică-te.'
          );
        }
      } else {
        await login({ email, password });
      }
    } catch (error) {
      Alert.alert('Autentificare eșuată', error.message || 'Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await continueAsDemo();
    } catch (error) {
      Alert.alert('Aplicația nu a putut porni', error.message || 'Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.appName}>TaskManager</Text>
          <Text style={styles.subtitle}>Organizează-ți ziua cu ușurință</Text>
        </View>

        {/* Card formular */}
        <View style={styles.card}>
          {isSupabaseConfigured ? (
            <>
              <Text style={styles.title}>{isRegister ? 'Cont nou' : 'Bun venit!'}</Text>

          {isRegister && (
            <View style={styles.field}>
              <Text style={styles.label}>Nume complet</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Ion Popescu"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                accessibilityLabel="Câmp pentru nume"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="ion@exemplu.ro"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Câmp pentru adresa de email"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Parolă</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isRegister ? 'new-password' : 'password'}
              accessibilityLabel="Câmp pentru parolă"
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading || !isSupabaseConfigured}
            accessibilityRole="button"
            accessibilityLabel={isRegister ? 'Creează cont' : 'Intră în aplicație'}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {isRegister ? 'Creează cont' : 'Intră în aplicație'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => { setIsRegister(!isRegister); setErrors({}); }}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>
              {isRegister
                ? 'Ai deja cont? Autentifică-te'
                : 'Nu ai cont? Înregistrează-te'}
            </Text>
          </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Începe fără cont</Text>
              <Text style={styles.configurationNotice}>
                Poți folosi toate funcțiile acum. În modul demo, sarcinile sunt criptate
                și salvate numai pe acest telefon; nu se sincronizează în cloud.
              </Text>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleDemo}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continuă în modul demo"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Continuă în modul demo</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.demoFootnote}>
                Pentru conturi și sincronizare între dispozitive, administratorul trebuie
                să configureze proiectul Supabase.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 56, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', color: '#2C3E6B', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#7B8AB8', marginTop: 4 },
  configurationNotice: {
    color: '#A34600',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E6B', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6A9A', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#D0D8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2C3E6B',
    backgroundColor: '#FAFBFF',
  },
  inputError: { borderColor: '#E74C3C' },
  errorText: { color: '#E74C3C', fontSize: 12, marginTop: 4 },
  btn: {
    backgroundColor: '#4A6CF7',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#4A6CF7', fontSize: 14, fontWeight: '600' },
});
