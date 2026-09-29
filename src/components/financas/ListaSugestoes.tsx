import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Sugestao } from '@/domain/sugestoes';
import { useTema } from '@/lib/tema';

import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';

const ESTILO = {
  perigo: { icone: 'alert-circle', cor: 'perigo', fundo: 'bg-perigo-suave' },
  atencao: { icone: 'warning', cor: 'atencao', fundo: 'bg-atencao-suave' },
  info: { icone: 'bulb', cor: 'info', fundo: 'bg-info-suave' },
} as const;

/** Sugestões de gestão; as de um animal abrem o detalhe dele. */
export function ListaSugestoes({ sugestoes }: { sugestoes: readonly Sugestao[] }) {
  const { cores } = useTema();
  return (
    <View className="gap-2">
      <Texto variante="subtitulo" className="px-1">
        Sugestões
      </Texto>
      <Card className="gap-0 p-0">
        {sugestoes.map((s, i) => {
          const e = ESTILO[s.nivel];
          const conteudo = (
            <View className={`flex-row gap-3 px-4 py-3 ${i ? 'border-t border-borda' : ''}`}>
              <View className={`h-9 w-9 items-center justify-center rounded-full ${e.fundo}`}>
                <Ionicons name={e.icone} size={18} color={cores[e.cor]} />
              </View>
              <View className="flex-1 gap-0.5">
                <Texto variante="rotulo" className="text-[14px]">
                  {s.titulo}
                </Texto>
                <Texto variante="legenda" tom="suave">
                  {s.detalhe}
                </Texto>
              </View>
              {s.animalId ? (
                <Ionicons name="chevron-forward" size={16} color={cores.textoSuave} />
              ) : null}
            </View>
          );
          return s.animalId ? (
            <Pressable
              key={`${s.tipo}-${s.animalId}`}
              accessibilityRole="button"
              onPress={() => router.push(`/rebanho/${s.animalId}`, { withAnchor: true })}
              className="active:opacity-70"
            >
              {conteudo}
            </Pressable>
          ) : (
            <View key={s.tipo}>{conteudo}</View>
          );
        })}
      </Card>
    </View>
  );
}
