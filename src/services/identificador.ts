import * as Crypto from 'expo-crypto';

// Gera um identificador único (UUID v4) com aleatoriedade segura do celular.
// Usado como sessionId: o servidor (Etapa 4) recusa repetidos, evitando
// contar a mesma sessão duas vezes.
export function gerarId(): string {
  return Crypto.randomUUID();
}
