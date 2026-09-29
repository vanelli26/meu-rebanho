import { router, useLocalSearchParams } from 'expo-router';

import { FormularioAnimal } from '@/components/rebanho/FormularioAnimal';
import { NaoEncontrado } from '@/components/NaoEncontrado';
import { formularioDoAnimal, montarDadosAnimal } from '@/domain/animal';
import { editarAnimal, useAnimal } from '@/features/animais';
import { useContextoGravacao } from '@/features/contexto';

export default function EditarAnimal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contexto = useContextoGravacao();
  const { carregando, animal, eventos } = useAnimal(id);

  if (!animal) return carregando ? null : <NaoEncontrado />;

  return (
    <FormularioAnimal
      valoresIniciais={formularioDoAnimal(animal)}
      animalId={animal.id}
      tituloBotao="Salvar alterações"
      aoSalvar={(form) => {
        editarAnimal(contexto, animal, eventos, montarDadosAnimal(form));
        router.back();
      }}
    />
  );
}
