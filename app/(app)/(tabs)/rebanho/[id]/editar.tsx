import { router, useLocalSearchParams } from 'expo-router';

import { FormularioAnimal } from '@/components/rebanho/FormularioAnimal';
import { NaoEncontrado } from '@/components/NaoEncontrado';
import { formularioDoAnimal, identificacao, montarDadosAnimal } from '@/domain/animal';
import { planoExclusao, resumoExclusao } from '@/domain/exclusao';
import { editarAnimal, excluirAnimal, useAnimal } from '@/features/animais';
import { useContextoGravacao } from '@/features/contexto';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { useHoje } from '@/features/hoje';
import { useProducoes } from '@/features/producao';

export default function EditarAnimal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contexto = useContextoGravacao();
  const { carregando, animal, eventos } = useAnimal(id);
  const { animais, eventosPorAnimal, tratamentosPorAnimal } = useDadosFazenda();
  const hoje = useHoje();
  const { producoes } = useProducoes(contexto.fazendaId, hoje, 365);

  if (!animal) return carregando ? null : <NaoEncontrado />;

  const plano = planoExclusao(animal, animais, eventosPorAnimal, tratamentosPorAnimal, producoes);
  const mensagem = [
    'Use só para cadastro feito por engano. Se o animal foi vendido, morreu ou foi descartado, mude a "Situação no rebanho" para manter o histórico.',
    resumoExclusao(plano),
    plano.ordenhas ? 'Os litros dele já lançados continuam nos totais das ordenhas.' : '',
    'Não dá para desfazer.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <FormularioAnimal
      valoresIniciais={formularioDoAnimal(animal)}
      animalId={animal.id}
      tituloBotao="Salvar alterações"
      aoSalvar={(form) => {
        editarAnimal(contexto, animal, eventos, montarDadosAnimal(form));
        router.back();
      }}
      exclusao={{
        titulo: `Excluir ${identificacao(animal)}?`,
        mensagem,
        aoConfirmar: () => {
          excluirAnimal(contexto, animal.id, plano);
          // Fecha a edição e a ficha, que deixaria de existir.
          router.dismissTo('/rebanho');
        },
      }}
    />
  );
}
