import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { ROTULO_EVENTO, type EventoReprodutivo } from '@/domain/reproducao';
import { isoParaBR } from '@/lib/datas';
import { useTema } from '@/lib/tema';

import { Texto } from '../ui/Texto';
import { ESTILO_EVENTO } from './estiloEvento';

type Props = {
  eventos: readonly EventoReprodutivo[];
  /** Nome da cria, para exibir no parto. */
  nomeCria?: (criaId: string) => string | null;
  aoAbrirCria?: (criaId: string) => void;
  aoSegurar?: (evento: EventoReprodutivo) => void;
};

/** Eventos do mais recente para o mais antigo, ligados por uma linha vertical. */
export function LinhaDoTempo({ eventos, nomeCria, aoAbrirCria, aoSegurar }: Props) {
  const { cores } = useTema();
  const ordenados = [...eventos].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <View>
      {ordenados.map((evento, i) => {
        const estilo = ESTILO_EVENTO[evento.tipo];
        const ultimo = i === ordenados.length - 1;
        const cria = evento.criaId ? nomeCria?.(evento.criaId) : null;
        const detalhes = [
          evento.touroSemen && `Touro/sêmen: ${evento.touroSemen}`,
          evento.responsavel && `Responsável: ${evento.responsavel}`,
          evento.observacoes,
        ].filter(Boolean);

        return (
          <Pressable
            key={evento.id}
            onLongPress={aoSegurar ? () => aoSegurar(evento) : undefined}
            accessibilityHint={aoSegurar ? 'Segure para excluir' : undefined}
            className="flex-row gap-3 active:opacity-70"
          >
            <View className="items-center">
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${estilo.fundo}`}
              >
                <Ionicons name={estilo.icone} size={20} color={cores[estilo.cor]} />
              </View>
              {!ultimo ? <View className="w-0.5 flex-1 bg-borda" /> : null}
            </View>
            <View className={`flex-1 gap-0.5 ${ultimo ? '' : 'pb-5'}`}>
              <View className="flex-row items-center justify-between gap-2">
                <Texto variante="rotulo" className="text-[14px]">
                  {ROTULO_EVENTO[evento.tipo]}
                </Texto>
                <Texto variante="legenda" tom="suave">
                  {isoParaBR(evento.data)}
                </Texto>
              </View>
              {detalhes.map((texto) => (
                <Texto key={texto} variante="legenda" tom="suave">
                  {texto}
                </Texto>
              ))}
              {evento.criaId && cria ? (
                <Pressable
                  onPress={() => aoAbrirCria?.(evento.criaId as string)}
                  className="mt-1 min-h-12 flex-row items-center gap-1 self-start rounded-full bg-primaria-suave px-3"
                >
                  <Texto variante="legenda" tom="primaria">
                    Cria: {cria}
                  </Texto>
                  <Ionicons name="chevron-forward" size={14} color={cores.primaria} />
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
