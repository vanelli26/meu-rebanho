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
  rotulo?: string;
  /** Abre o teclado ao aparecer (padrão: sim). */
  autoFocus?: boolean;
  /** Mensagem quando a busca não encontra ninguém. */
  semResultado?: string;
  /** Mostra "Remover" além de "Trocar" (campo opcional). */
  removivel?: boolean;
};

const LIMITE = 6;

/** Escolha rápida de um animal pelo nome (ou brinco). */
export function SeletorAnimal({
  animais,
  selecionado,
  aoSelecionar,
  hoje,
  erro,
  rotulo = 'Animal',
  autoFocus = true,
  semResultado = 'Nenhuma fêmea ativa com esse nome.',
  removivel = false,
}: Props) {
  const [busca, setBusca] = useState('');
  const encontrados = useMemo(() => buscarAnimais(animais, busca), [animais, busca]);

  if (selecionado) {
    return (
      <View className="gap-2">
        <Texto variante="rotulo" tom="suave">
          {rotulo}
        </Texto>
        <LinhaAnimal
          animal={selecionado}
          hoje={hoje}
          selecionado
          onPress={() => aoSelecionar(null)}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => aoSelecionar(null)}
          className="min-h-12 justify-center self-start"
        >
          <Texto variante="rotulo" tom="primaria">
            {removivel ? 'Trocar ou remover' : 'Trocar animal'}
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
      <CampoBusca valor={busca} aoMudar={setBusca} autoFocus={autoFocus} />
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
              {semResultado}
            </Texto>
          ) : encontrados.length > LIMITE ? (
            <Texto variante="legenda" tom="suave" className="text-center">
              E mais {encontrados.length - LIMITE}. Digite mais do nome para filtrar.
            </Texto>
          ) : null}
        </View>
      ) : (
        <Texto variante="legenda" tom="suave">
          Digite o nome para encontrar.
        </Texto>
      )}
    </View>
  );
}
