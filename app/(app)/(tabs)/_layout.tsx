import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { cores, opcoesCabecalho } from '@/lib/tema';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(nome: NomeIcone) {
  return function IconeAba({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nome} color={color} size={size} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        ...opcoesCabecalho,
        headerRight: () => <IndicadorSyncAtual />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarStyle: { height: 68, paddingTop: 6, borderTopColor: cores.borda },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel', tabBarIcon: icone('home') }} />
      <Tabs.Screen
        name="rebanho"
        options={{ title: 'Rebanho', headerShown: false, tabBarIcon: icone('list') }}
      />
      <Tabs.Screen
        name="producao"
        options={{ title: 'Produção', headerShown: false, tabBarIcon: icone('water') }}
      />
      <Tabs.Screen
        name="reproducao"
        options={{ title: 'Reprodução', headerShown: false, tabBarIcon: icone('calendar') }}
      />
      <Tabs.Screen name="mais" options={{ title: 'Mais', tabBarIcon: icone('menu') }} />
    </Tabs>
  );
}
