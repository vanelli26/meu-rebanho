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
        // Grava e volta para a lista, que se atualiza pelo onSnapshot. Voltar (em vez de
        // trocar esta tela pelo detalhe) evita a pilha quebrada que deixava a aba em branco no iOS.
        criarAnimal(contexto, montarDadosAnimal(form));
        if (router.canGoBack()) router.back();
        else router.replace('/rebanho');
      }}
    />
  );
}
