import { Stack } from 'expo-router';

// Moldura de todas as telas do app.
// Por enquanto é uma pilha simples (Stack), sem cabeçalho.
// Na Etapa 1 ela vira a barra de abas (tab bar).
export default function LayoutRaiz() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
