import { ScrollView, Text } from 'react-native';

import { Card } from './ui/Card';

/** Placeholder para telas de fases futuras do roadmap. */
export function EmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <Card>
        <Text className="text-xl font-bold text-texto">{titulo}</Text>
        <Text className="text-base text-texto-suave">{descricao}</Text>
      </Card>
    </ScrollView>
  );
}
