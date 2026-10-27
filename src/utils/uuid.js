/**
 * Generare UUID v4 folosind expo-crypto (funcționează nativ pe iOS/Android/Hermes)
 * Înlocuiește pachetul 'uuid' care necesită crypto.getRandomValues indisponibil în Hermes
 */
import * as Crypto from 'expo-crypto';

export function generateId() {
  return Crypto.randomUUID();
}
