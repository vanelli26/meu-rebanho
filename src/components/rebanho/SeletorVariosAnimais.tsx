import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { buscarAnimais, identificacao, situacaoAtual, type Animal } from '@/domain/animal';
import { useTema } from '@/lib/tema';

import { CampoBusca, Texto } from '../ui';
import { LinhaAnimal } from './LinhaAnimal';

type Props = {
  animais: readonly Animal[];
  selecionados: readonly string[];
  aoMudar: (ids: string[]) => void;
  hoje: Date;
  erro?: string;
};

const LIMITE = 6;

/** Escolha de um ou vários animais: busca pelo nome e atalhos para grupos. */
export function SeletorVariosAnimais({ animais, selecionados, aoMudar, hoje, erro }: Props) {
  const { cores } = useTema();
  const [busca, setBusca] = useState('');
  const encontrados = useMemo(() => buscarAnimais(animais, busca), [animais, busca]);
  const porId = useMemo(() => new Map(animais.map((a) => [a.id, a])), [animais]);
  const escolhidos = selecionados.flatMap((id) => porId.get(id) ?? []);
  const emLactacao = animais.filter((a) => situacaoAtual(a, hoje) === 'lactacao');

  const alternar = (id: string) =>
    aoMudar(
      selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id],
    );

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Texto variante="rotulo" tom="suave">
          Animais
        </Texto>
        {selecionados.length ? (
          <Pressable onPress={() => aoMudar([])} className="min-h-10 justify-center">
            <Texto variante="rotulo" tom="primaria">
              Limpar ({selecionados.length})
            </Texto>
          </Pressable>
        ) : null}
      </View>

      {escolhidos.length ? (
        <View className="flex-row flex-wrap gap-2">
          {escolhidos.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${identificacao(a)}`}
              onPress={() => alternar(a.id)}
              className="min-h-10 flex-row items-center gap-1.5 rounded-full bg-primaria-suave pl-3 pr-2 active:opacity-70"
            >
              <Texto variante="rotulo" tom="primaria" className="text-[13px]">
                {identificacao(a)}
              </Texto>
              <Ionicons name="close" size={16} color={cores.primaria} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        <Atalho
          titulo={`Em lactação (${emLactacao.length})`}
          onPress={() => aoMudar(uniao(selecionados, emLactacao))}
          desativado={!emLactacao.length}
        />
        <Atalho
          titulo={`Todo o rebanho (${animais.length})`}
          onPress={() => aoMudar(uniao(selecionados, animais))}
          desativado={!animais.length}
        />
      </View>

      <CampoBusca valor={busca} aoMudar={setBusca} />
      {erro ? (
        <Texto variante="legenda" tom="perigo">
          {erro}
        </Texto>
      ) : null}
      {busca || animais.length <= LIMITE ? (
        <View className="gap-2">
          {encontrados.slice(0, LIMITE).map((animal) => (
            <LinhaAnimal
              key={animal.id}
              animal={animal}
              hoje={hoje}
              selecionado={selecionados.includes(animal.id)}
              onPress={() => alternar(animal.id)}
            />
          ))}
          {encontrados.length === 0 ? (
            <Texto tom="suave" className="py-2 text-center">
              Nenhum animal ativo com esse nome.
            </Texto>
          ) : encontrados.length > LIMITE ? (
            <Texto variante="legenda" tom="suave" className="text-center">
              E mais {encontrados.length - LIMITE}. Digite mais do nome para filtrar.
            </Texto>
          ) : null}
        </View>
      ) : (
        <Texto variante="legenda" tom="suave">
          Digite o nome para adicionar um animal.
        </Texto>
      )}
    </View>
  );
}

const uniao = (ids: readonly string[], animais: readonly Animal[]) => [
  ...new Set([...ids, ...animais.map((a) => a.id)]),
];

function Atalho({
  titulo,
  onPress,
  desativado,
}: {
  titulo: string;
  onPress: () => void;
  desativado: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desativado}
      onPress={onPress}
      className={`min-h-11 justify-center rounded-full border-[1.5px] border-borda bg-superficie px-4 active:opacity-70 ${
        desativado ? 'opacity-40' : ''
      }`}
    >
      <Texto variante="rotulo" className="text-[13px]">
        + {titulo}
      </Texto>
    </Pressable>
  );
}
