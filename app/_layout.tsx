import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useSessao } from '@/hooks/useSessao';
import { cores } from '@/theme/cores';
import { arquivosDeFonte, fontes } from '@/theme/fontes';

// Segura a tela de abertura (splash) até as fontes e o login estarem prontos.
SplashScreen.preventAutoHideAsync();

// Moldura de todas as telas e o "PORTEIRO" do app:
// - sem login: só deixa ver Entrar e Cadastro;
// - com login: só deixa ver as telas de dentro do app.
export default function LayoutRaiz() {
  const [fontesCarregadas, erroFontes] = useFonts(arquivosDeFonte);
  const { sessao, carregando } = useSessao();

  // Se a fonte falhar, segue com a fonte do sistema em vez de travar o app.
  const pronto = (fontesCarregadas || erroFontes !== null) && !carregando;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  const logado = sessao !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={logado}>
        <Stack.Screen name="(abas)" />
        {/* Criar/editar matéria: abre por cima das abas, com cabeçalho e "voltar". */}
        <Stack.Screen
          name="materia"
          options={{
            headerShown: true,
            headerTintColor: cores.primaria,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: cores.fundo },
            headerTitleStyle: { fontFamily: fontes.titulo, color: cores.texto },
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="entrar" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
    </Stack>
  );
}
