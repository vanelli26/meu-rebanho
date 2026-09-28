import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import {
  Aviso,
  Botao,
  CampoData,
  CampoNumero,
  CampoTexto,
  Card,
  IndicadorSync,
} from '@/components/ui';

// Vitrine temporária dos componentes base (Fase 0). Substituída pela guarda de rotas na Fase 1.
export default function Vitrine() {
  const [litros, setLitros] = useState<number | null>(12.5);
  const [data, setData] = useState<string | null>(null);

  return (
    <>
      <Stack.Screen
        options={{ title: 'Meu Rebanho', headerRight: () => <IndicadorSync pendente /> }}
      />
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text className="text-2xl font-bold text-texto">Componentes base</Text>
        <Card>
          <CampoTexto rotulo="Brinco" placeholder="Ex.: 123" keyboardType="number-pad" />
          <CampoNumero rotulo="Litros" valor={litros} aoMudar={setLitros} />
          <CampoData rotulo="Data" valor={data} aoMudar={setData} />
          <Text className="text-base text-texto-suave">
            Valores: {String(litros)} · {data ?? '—'}
          </Text>
        </Card>
        <Aviso tipo="perigo" titulo="Leite em carência" mensagem="Brinco 123 até 30/09/2026." />
        <Aviso tipo="atencao" titulo="Secagem atrasada" />
        <Aviso tipo="sucesso" titulo="Produção salva" />
        <Botao titulo="Salvar" />
        <Botao titulo="Cancelar" variante="secundaria" />
        <Botao titulo="Excluir" variante="perigo" />
        <Botao titulo="Carregando" carregando />
      </ScrollView>
    </>
  );
}
