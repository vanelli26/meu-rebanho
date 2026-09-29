import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { buscarAnimais, type Animal } from '@/domain/animal';

import { CampoBusca, Texto } from '../ui';
import { LinhaAnimal } from './LinhaAnimal';

type Props = {
  animais: readonly Animal[];
  selecionado: Animal | null;
  aoSelecionar: (animal: Animal | null) => void;
  hoje: Date;
  erro?: string;
};

const LIMITE = 6;

/** Escolha rápida de um animal pelo nome (ou brinco). */
export function SeletorAnimal({ animais, selecionado, aoSelecionar, hoje, erro }: Props) {
  const [busca, setBusca] = useState('');
  const encontrados = useMemo(() => buscarAnimais(animais, busca), [animais, busca]);

  if (selecionado) {
    return (
      <View className="gap-2">
        <Texto variante="rotulo" tom="suave">
          Animal
        </Texto>
        <LinhaAnimal
          animal={selecionado}
          hoje={hoje}
          selecionado
          onPress={() => aoSelecionar(null)}
        />
        <Pressable
          onPress={() => aoSelecionar(null)}
          className="min-h-12 justify-center self-start"
        >
          <Texto variante="rotulo" tom="primaria">
            Trocar animal
          </Texto>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Texto variante="rotulo" tom="suave">
        Animal
      </Texto>
      <CampoBusca valor={busca} aoMudar={setBusca} autoFocus />
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
              onPress={() => {
                setBusca('');
                aoSelecionar(animal);
              }}
            />
          ))}
          {encontrados.length === 0 ? (
            <Texto tom="suave" className="py-2 text-center">
              Nenhuma fêmea ativa com esse nome.
            </Texto>
          ) : encontrados.length > LIMITE ? (
            <Texto variante="legenda" tom="suave" className="text-center">
              E mais {encontrados.length - LIMITE}. Digite mais do nome para filtrar.
            </Texto>
          ) : null}
        </View>
      ) : (
        <Texto variante="legenda" tom="suave">
          Digite o nome para encontrar a vaca.
        </Texto>
      )}
    </View>
  );
}
