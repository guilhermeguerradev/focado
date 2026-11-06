import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type NomeIcone = ComponentProps<typeof Feather>['name'];

// Cria a função que desenha o ícone da aba.
// A cor vem do nosso tema: turquesa se a aba está ativa, cinza se não está.
function icone(nome: NomeIcone) {
  return function IconeDaAba({ focused }: { focused: boolean }) {
    const cor = focused ? cores.primaria : cores.textoApagado;
    return <Feather name={nome} color={cor} size={24} />; // 24px, como no design
  };
}

// Barra de abas do app (PRD seção 2), com os ícones do design.
export default function LayoutAbas() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoApagado,
        // Medidas do design: rótulo Nunito 600 de 10px, linha #EEF1F2 em cima.
        tabBarLabelStyle: { fontFamily: fontes.texto, fontSize: 10, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.bordaNavegacao,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Estudar', tabBarIcon: icone('book-open') }} />
      <Tabs.Screen
        name="estatisticas"
        options={{ title: 'Estatísticas', tabBarIcon: icone('bar-chart-2') }}
      />
      <Tabs.Screen name="amigos" options={{ title: 'Amigos', tabBarIcon: icone('users') }} />
      <Tabs.Screen name="baralho" options={{ title: 'Baralho', tabBarIcon: icone('layers') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('user') }} />
    </Tabs>
  );
}
