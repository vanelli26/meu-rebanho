import { ScrollView, Text } from 'react-native';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Card } from '@/components/ui';

export default function Painel() {
  const { fazenda } = useSessaoPronta();
  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <Text className="text-2xl font-bold text-texto">{fazenda.nome}</Text>
      <Text className="text-lg text-texto-suave">
        {fazenda.municipio} – {fazenda.uf}
      </Text>
      <Card>
        <Text className="text-xl font-bold text-texto">Resumo e alertas</Text>
        <Text className="text-base text-texto-suave">
          Vacas em lactação, produção e alertas aparecem aqui na Fase 2.
        </Text>
      </Card>
    </ScrollView>
  );
}
