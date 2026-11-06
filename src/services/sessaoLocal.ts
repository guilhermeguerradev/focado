import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessaoEmAndamento } from '@/domain/cronometro';
import { lerSessaoSalva } from '@/domain/sessaoSalva';

// Espelho da sessão em andamento no armário do celular (PRD 3.3).
// Salvo a cada mudança (iniciar, pausar, retomar), para sobreviver a
// app fechado à força, celular reiniciado ou bateria acabando.

const CHAVE = 'focado:sessao-em-andamento';

export async function salvarSessaoLocal(sessao: SessaoEmAndamento): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(sessao));
}

// Devolve a sessão guardada, ou null se não houver (ou se estiver corrompida).
export async function carregarSessaoLocal(): Promise<SessaoEmAndamento | null> {
  const texto = await AsyncStorage.getItem(CHAVE);
  if (texto === null) return null;
  try {
    return lerSessaoSalva(JSON.parse(texto));
  } catch {
    return null; // texto que nem é JSON: ignora
  }
}

export async function limparSessaoLocal(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE);
}
