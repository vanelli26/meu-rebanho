import { Tabs } from 'expo-router';

import { BarraAbas } from '@/components/BarraAbas';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BarraAbas {...props} />}
      screenOptions={{ headerShown: false, animation: 'shift' }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="rebanho" options={{ title: 'Rebanho' }} />
      <Tabs.Screen name="producao" options={{ title: 'Produção' }} />
      <Tabs.Screen name="reproducao" options={{ title: 'Reprodução' }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
    </Tabs>
  );
}
