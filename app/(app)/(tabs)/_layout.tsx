import { Tabs } from 'expo-router';

import { BarraAbas } from '@/components/BarraAbas';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BarraAbas {...props} />}
      // Sem animação na troca de abas: no iOS (nova arquitetura) a transição animada
      // podia deixar a tela de destino presa invisível, e a aba aparecia vazia.
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="rebanho" options={{ title: 'Rebanho' }} />
      <Tabs.Screen name="producao" options={{ title: 'Produção' }} />
      <Tabs.Screen name="financas" options={{ title: 'Finanças' }} />
    </Tabs>
  );
}
