import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { LinhaAnimal } from '@/components/rebanho/LinhaAnimal';
import { CampoBusca, Seletor, Texto, type Opcao } from '@/components/ui';
import {
  buscarAnimais,
  ordenarPorPrevisaoParto,
  situacaoAtual,
  type Animal,
  type Situacao,
} from '@/domain/animal';
import { useAnimais } from '@/features/animais';
import { useHoje } from '@/features/hoje';
import { dataDeISO, diasEntre, isoParaBR, type DataISO } from '@/lib/datas';
import { useTema } from '@/lib/tema';

type Filtro = 'todos' | Situacao | 'prenhes' | 'inativos';

const FILTROS: Opcao<Filtro>[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'lactacao', rotulo: 'Lactação' },
  { valor: 'prenhes', rotulo: 'Prenhes' },
  { valor: 'seca', rotulo: 'Secas' },
  { valor: 'novilha', rotulo: 'Novilhas' },
  { valor: 'bezerra', rotulo: 'Bezerras' },
  { valor: 'macho', rotulo: 'Machos' },
  { valor: 'inativos', rotulo: 'Saíram' },
];

export default function Rebanho() {
  const { carregando, animais } = useAnimais();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const hojeISO = useHoje();
  const hoje = useMemo(() => dataDeISO(hojeISO), [hojeISO]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const lista = useMemo(() => {
    const porFiltro = animais.filter((a) => {
      if (filtro === 'inativos') return a.status !== 'ativo';
      if (a.status !== 'ativo') return false;
      if (filtro === 'prenhes') return a.resumo.prenhe;
      return filtro === 'todos' || situacaoAtual(a, hoje) === filtro;
    });
    const encontrados = buscarAnimais(porFiltro, busca);
    // Prenhes: quem vai parir primeiro aparece em cima.
    return filtro === 'prenhes' ? ordenarPorPrevisaoParto(encontrados) : encontrados;
  }, [animais, filtro, busca, hoje]);

  const ativos = animais.filter((a) => a.status === 'ativo').length;
  const temFemeas = animais.some((a) => a.status === 'ativo' && a.sexo === 'F');

  return (
    <View className="flex-1 bg-fundo">
      <FlatList
        data={lista}
        keyExtractor={(a) => a.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerClassName="gap-2 px-4"
        contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom + 72 }}
        ListHeaderComponent={
          <View className="gap-3 pb-2 pt-2">
            <CampoBusca valor={busca} aoMudar={setBusca} />
            <Seletor opcoes={FILTROS} valor={filtro} aoMudar={setFiltro} rolavel />
            <Texto variante="legenda" tom="suave" className="px-1">
              {carregando
                ? 'Carregando…'
                : `${lista.length} ${lista.length === 1 ? 'animal' : 'animais'}` +
                  (filtro === 'todos' && !busca ? ` ativos de ${animais.length} cadastrados` : '')}
            </Texto>
          </View>
        }
        renderItem={({ item }) => (
          <LinhaAnimal
            animal={item}
            hoje={hoje}
            detalhe={filtro === 'prenhes' ? textoPrevisaoParto(item, hojeISO) : undefined}
            onPress={() => router.push(`/rebanho/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          carregando ? null : (
            <Animated.View entering={FadeIn} className="items-center gap-3 px-6 py-12">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-primaria-suave">
                <Ionicons name={ativos ? 'search' : 'paw'} size={34} color={cores.primaria} />
              </View>
              <Texto variante="subtitulo" className="text-center">
                {ativos || busca ? 'Nenhum animal encontrado' : 'Seu rebanho está vazio'}
              </Texto>
              <Texto tom="suave" className="text-center">
                {ativos || busca
                  ? 'Confira o brinco digitado ou troque o filtro.'
                  : 'Cadastre o primeiro animal pelo botão abaixo. Só o brinco é obrigatório.'}
              </Texto>
            </Animated.View>
          )
        }
      />

      <Animated.View
        entering={ZoomIn.delay(200).springify().damping(14)}
        className="flex-row gap-3"
        style={{ position: 'absolute', right: 20, bottom: ESPACO_BARRA_ABAS + insets.bottom - 12 }}
      >
        {temFemeas ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar evento reprodutivo"
            onPress={() => router.push('/rebanho/evento')}
            className="h-16 flex-row items-center gap-2 rounded-full border-[1.5px] border-primaria bg-superficie px-5 active:opacity-80"
            style={{ boxShadow: '0px 8px 24px rgba(23, 58, 44, 0.18)' }}
          >
            <Ionicons name="heart" size={22} color={cores.primaria} />
            <Texto variante="subtitulo" tom="primaria">
              Evento
            </Texto>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Novo animal"
          onPress={() => router.push('/rebanho/novo')}
          className="h-16 flex-row items-center gap-2 rounded-full bg-primaria px-6 active:opacity-80"
          style={{ boxShadow: '0px 8px 24px rgba(23, 58, 44, 0.3)' }}
        >
          <Ionicons name="add" size={26} color={cores.sobrePrimaria} />
          <Texto variante="subtitulo" tom="sobre-primaria">
            Novo
          </Texto>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function textoPrevisaoParto(animal: Animal, hoje: DataISO): string {
  const previsao = animal.resumo.previsaoParto;
  if (!previsao) return 'Sem previsão de parto';
  const dias = diasEntre(hoje, previsao);
  const quando = dias < 0 ? `há ${-dias} dias` : dias === 0 ? 'hoje' : `em ${dias} dias`;
  return `Parto previsto ${isoParaBR(previsao)} · ${quando}`;
}
