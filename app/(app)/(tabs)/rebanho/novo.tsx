import { router } from 'expo-router';

import { FormularioAnimal } from '@/components/rebanho/FormularioAnimal';
import { FORMULARIO_ANIMAL_VAZIO, montarDadosAnimal } from '@/domain/animal';
import { criarAnimal } from '@/features/animais';
import { useContextoGravacao } from '@/features/contexto';

export default function NovoAnimal() {
  const contexto = useContextoGravacao();
  return (
    <FormularioAnimal
      valoresIniciais={FORMULARIO_ANIMAL_VAZIO}
      tituloBotao="Cadastrar animal"
      aoSalvar={(form) => {
        // Grava e segue: a lista se atualiza pelo onSnapshot.
        const id = criarAnimal(contexto, montarDadosAnimal(form, null));
        router.replace(`/rebanho/${id}`);
      }}
    />
  );
}
