import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { NaoEncontrado } from '@/components/NaoEncontrado';
import { GraficoLitros } from '@/components/producao/GraficoLitros';
import { SeloSituacao } from '@/components/rebanho/SeloSituacao';
import { LinhaDoTempo } from '@/components/reproducao/LinhaDoTempo';
import { Aviso, Botao, Card, Texto } from '@/components/ui';
import { identificacao, ROTULO_STATUS, situacaoAtual } from '@/domain/animal';
import {
  carenciaCarneAte,
  emCarenciaLeite,
  ordenarTratamentos,
  ROTULO_TRATAMENTO,
  type Tratamento,
} from '@/domain/carencia';
import { ROTULO_CATEGORIA, type CategoriaDespesa } from '@/domain/despesas';
import { diasEmLactacao, iepMedio, liberadaParaInseminar } from '@/domain/lactacao';
import { producaoDoAnimal, ROTULO_ORDENHA, serieDiaria } from '@/domain/producao';
import { estadoReprodutivo, ROTULO_EVENTO, type EventoReprodutivo } from '@/domain/reproducao';
import { useAnimal } from '@/features/animais';
import { useContextoGravacao } from '@/features/contexto';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { excluirEvento } from '@/features/eventos';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useAnaliseMes } from '@/features/analise';
import { useHoje } from '@/features/hoje';
import { useProducoes } from '@/features/producao';
import { excluirTratamento } from '@/features/tratamentos';
import { dataDeISO, idadeTexto, isoParaBR, isoParaDiaMes, mesDe, nomeDoMes } from '@/lib/datas';
import { formatarReais } from '@/lib/dinheiro';
import { numeroParaTexto } from '@/lib/numeros';
import { useTema } from '@/lib/tema';

export default function DetalheAnimal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fazenda } = useSessaoPronta();
  const contexto = useContextoGravacao();
  const { carregando, animal, eventos, tratamentos } = useAnimal(id);
  const { animalPorId } = useDadosFazenda();
  const { disponivel: financeiro, despesas } = useFinanceiro();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const { analise: analiseMes } = useAnaliseMes(mesDe(hoje));
  const { producoes } = useProducoes(fazenda.id, hoje, 30);

  const estado = useMemo(
    () => estadoReprodutivo(eventos, fazenda.configuracoes),
    [eventos, fazenda],
  );
  const ordenhas = useMemo(
    () => (animal ? producaoDoAnimal(producoes, animal.id) : []),
    [producoes, animal],
  );
  const serie = useMemo(
    () => (animal ? serieDiaria(producoes, hoje, 30, animal.id) : []),
    [producoes, hoje, animal],
  );

  if (!animal) return carregando ? null : <NaoEncontrado />;

  const r = animal.resumo;
  const resultado = analiseMes.animais.find((x) => x.animalId === animal.id);
  const situacao = situacaoAtual(animal, dataDeISO(hoje));
  const femea = animal.sexo === 'F';
  const ativo = animal.status === 'ativo';
  const del = diasEmLactacao(r, hoje);
  const iep = iepMedio(estado.intervalosEntrePartos);
  const mae = animal.maeId ? animalPorId.get(animal.maeId) : undefined;
  const filhos = [...animalPorId.values()].filter((a) => a.maeId === animal.id);
  const carneAte = carenciaCarneAte(tratamentos);

  const confirmarExclusao = (evento: EventoReprodutivo) => {
    Alert.alert(
      `Excluir ${ROTULO_EVENTO[evento.tipo].toLowerCase()}?`,
      `Evento de ${isoParaBR(evento.data)}. A situação da vaca será recalculada.` +
        (evento.criaId ? '\n\nA cria cadastrada no parto continua no rebanho.' : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirEvento(contexto, animal, eventos, evento.id),
        },
      ],
    );
  };

  const confirmarExclusaoTratamento = (tratamento: Tratamento) => {
    Alert.alert(
      `Excluir ${tratamento.produto}?`,
      `Tratamento de ${isoParaBR(tratamento.data)}. A carência será recalculada` +
        (tratamento.despesaId ? ' e o custo deste animal sai das despesas.' : '.'),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirTratamento(
              contexto,
              animal,
              eventos,
              tratamentos,
              tratamento.id,
              despesas.find((d) => d.id === tratamento.despesaId) ?? null,
            ),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          // O nome já aparece em destaque logo abaixo.
          title: '',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar animal"
              hitSlop={6}
              onPress={() => router.push(`/rebanho/${animal.id}/editar`)}
              className="h-11 flex-row items-center gap-1 rounded-full bg-primaria-suave px-4 active:opacity-70"
            >
              <Ionicons name="create-outline" size={18} color={cores.primaria} />
              <Texto variante="rotulo" tom="primaria">
                Editar
              </Texto>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="bg-fundo"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
      >
        <Card className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primaria">
            <Texto variante="numero" tom="sobre-primaria">
              {identificacao(animal).charAt(0).toUpperCase()}
            </Texto>
          </View>
          <View className="flex-1 gap-1.5">
            <Texto variante="titulo" numberOfLines={2}>
              {identificacao(animal)}
            </Texto>
            {ativo ? (
              <SeloSituacao situacao={situacao} prenhe={r.prenhe} />
            ) : (
              <Texto variante="rotulo" tom="perigo">
                {ROTULO_STATUS[animal.status]}
                {animal.dataSaida ? ` em ${isoParaBR(animal.dataSaida)}` : ''}
              </Texto>
            )}
            <Texto variante="legenda" tom="suave">
              {[animal.raca, animal.dataNascimento && idadeTexto(animal.dataNascimento, hoje)]
                .filter(Boolean)
                .join(' · ') || (femea ? 'Fêmea' : 'Macho')}
            </Texto>
          </View>
        </Card>

        {femea && emCarenciaLeite(r.carenciaLeiteAte, hoje) ? (
          <Aviso
            tipo="perigo"
            titulo="Leite fora do tanque"
            mensagem={`Carência até ${isoParaBR(r.carenciaLeiteAte as string)}.`}
          />
        ) : null}
        {carneAte && carneAte >= hoje ? (
          <Aviso
            tipo="atencao"
            titulo="Carência de carne"
            mensagem={`Não abater nem vender para corte até ${isoParaBR(carneAte)}.`}
          />
        ) : null}

        {ativo ? (
          <View className="flex-row gap-3">
            {femea ? (
              <View className="flex-1">
                <Botao
                  titulo="Evento"
                  icone="add-circle"
                  onPress={() => router.push(`/rebanho/evento?animalId=${animal.id}`)}
                />
              </View>
            ) : null}
            <View className="flex-1">
              <Botao
                titulo="Tratamento"
                icone="medkit"
                variante={femea ? 'secundaria' : 'primaria'}
                onPress={() => router.push(`/tratamento?animalId=${animal.id}`)}
              />
            </View>
          </View>
        ) : null}

        {femea ? (
          <Card>
            <Texto variante="subtitulo">Reprodução</Texto>
            <View className="flex-row flex-wrap gap-y-4">
              {del !== null ? <Info rotulo="Dias em lactação" valor={`${del}`} /> : null}
              <Info rotulo="Partos" valor={String(r.numeroPartos)} />
              <Info rotulo="Último parto" valor={r.ultimoParto ? isoParaBR(r.ultimoParto) : '—'} />
              <Info
                rotulo="Último serviço"
                valor={r.ultimaCobertura ? isoParaBR(r.ultimaCobertura) : '—'}
              />
              {r.previsaoParto ? (
                <Info rotulo="Previsão de parto" valor={isoParaBR(r.previsaoParto)} destaque />
              ) : null}
              {r.previsaoSecagem && situacao === 'lactacao' ? (
                <Info rotulo="Previsão de secagem" valor={isoParaBR(r.previsaoSecagem)} destaque />
              ) : null}
              {iep !== null ? <Info rotulo="IEP médio" valor={`${iep} dias`} /> : null}
            </View>
            {ativo && liberadaParaInseminar(r, hoje, fazenda.configuracoes) ? (
              <Aviso
                tipo="sucesso"
                titulo="Liberada para inseminar"
                mensagem={`Passou dos ${fazenda.configuracoes.periodoVoluntarioEspera} dias de espera após o parto.`}
              />
            ) : null}
            {r.servicoSemDiagnostico ? (
              <Aviso
                tipo="info"
                titulo="Aguardando diagnóstico"
                mensagem={`Serviço em ${isoParaBR(r.servicoSemDiagnostico)}.`}
              />
            ) : null}
          </Card>
        ) : null}

        {ordenhas.length ? (
          <Card>
            <View className="flex-row items-baseline justify-between">
              <Texto variante="subtitulo">Produção</Texto>
              <Texto variante="legenda" tom="suave">
                últimos 30 dias
              </Texto>
            </View>
            <GraficoLitros serie={serie} altura={110} />
            {ordenhas.slice(0, 4).map((o) => (
              <View
                key={`${o.data}_${o.ordenha}`}
                className="flex-row items-center justify-between border-b border-borda pb-2"
              >
                <Texto tom="suave">
                  {isoParaDiaMes(o.data)} · {ROTULO_ORDENHA[o.ordenha]}
                </Texto>
                <Texto
                  variante="rotulo"
                  tom={o.descartado ? 'perigo' : 'normal'}
                  className="text-[15px]"
                >
                  {numeroParaTexto(o.litros)} L{o.descartado ? ' (descartado)' : ''}
                </Texto>
              </View>
            ))}
          </Card>
        ) : null}

        {financeiro && resultado ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/financas/animais?mes=${mesDe(hoje)}`)}
            className="active:opacity-70"
          >
            <Card>
              <View className="flex-row items-baseline justify-between">
                <Texto variante="subtitulo">Financeiro</Texto>
                <Texto variante="legenda" tom="suave" className="capitalize">
                  {nomeDoMes(mesDe(hoje))}
                </Texto>
              </View>
              <View className="flex-row flex-wrap gap-y-4">
                <Info rotulo="Receita do leite" valor={formatarReais(resultado.receita)} />
                <Info rotulo="Custo rateado" valor={formatarReais(resultado.custo)} />
                <Info
                  rotulo="Margem"
                  valor={formatarReais(resultado.margem)}
                  destaque={resultado.margem >= 0}
                  perigo={resultado.margem < 0}
                />
                {resultado.valorDescartado ? (
                  <Info
                    rotulo="Leite descartado"
                    valor={formatarReais(resultado.valorDescartado)}
                  />
                ) : null}
              </View>
              {Object.keys(resultado.porCategoria).length ? (
                <Texto variante="legenda" tom="suave">
                  {(Object.entries(resultado.porCategoria) as [CategoriaDespesa, number][])
                    .sort(([, a], [, b]) => b - a)
                    .map(([c, v]) => `${ROTULO_CATEGORIA[c]} ${formatarReais(v)}`)
                    .join(' · ')}
                </Texto>
              ) : null}
            </Card>
          </Pressable>
        ) : null}

        {femea ? (
          <Card>
            <Texto variante="subtitulo">Linha do tempo</Texto>
            {eventos.length ? (
              <>
                <LinhaDoTempo
                  eventos={eventos}
                  nomeCria={(criaId) => {
                    const cria = animalPorId.get(criaId);
                    return cria ? identificacao(cria) : null;
                  }}
                  aoAbrirCria={(criaId) => router.push(`/rebanho/${criaId}`)}
                  aoSegurar={confirmarExclusao}
                />
                <Texto variante="legenda" tom="suave">
                  Lançou errado? Segure o evento para excluir.
                </Texto>
              </>
            ) : (
              <Texto tom="suave">Nenhum evento reprodutivo registrado.</Texto>
            )}
          </Card>
        ) : null}

        {tratamentos.length ? (
          <Card>
            <Texto variante="subtitulo">Tratamentos</Texto>
            {ordenarTratamentos(tratamentos).map((t) => (
              <Pressable
                key={t.id}
                onLongPress={() => confirmarExclusaoTratamento(t)}
                accessibilityHint="Segure para excluir"
                className="flex-row gap-3 border-b border-borda pb-3 active:opacity-70"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-info-suave">
                  <Ionicons name="medkit" size={18} color={cores.info} />
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Texto variante="rotulo" className="flex-1 text-[14px]" numberOfLines={1}>
                      {t.produto}
                    </Texto>
                    <Texto variante="legenda" tom="suave">
                      {isoParaBR(t.data)}
                    </Texto>
                  </View>
                  <Texto variante="legenda" tom="suave">
                    {[ROTULO_TRATAMENTO[t.tipo], t.dose, t.via].filter(Boolean).join(' · ')}
                  </Texto>
                  {t.carenciaLeiteDias || t.carenciaCarneDias ? (
                    <Texto variante="legenda" tom="suave">
                      Carência: {t.carenciaLeiteDias} d leite · {t.carenciaCarneDias} d carne
                    </Texto>
                  ) : null}
                  {t.observacoes ? (
                    <Texto variante="legenda" tom="suave">
                      {t.observacoes}
                    </Texto>
                  ) : null}
                </View>
              </Pressable>
            ))}
            <Texto variante="legenda" tom="suave">
              Lançou errado? Segure o tratamento para excluir.
            </Texto>
          </Card>
        ) : null}

        <Card className="gap-0 p-0">
          <Texto variante="subtitulo" className="px-5 pb-1 pt-5">
            Dados
          </Texto>
          <Linha rotulo="Brinco" valor={animal.brinco} />
          <Linha rotulo="Sexo" valor={femea ? 'Fêmea' : 'Macho'} />
          {animal.dataNascimento ? (
            <Linha rotulo="Nascimento" valor={isoParaBR(animal.dataNascimento)} />
          ) : null}
          <Linha rotulo="Origem" valor={animal.origem === 'nascido' ? 'Nasceu aqui' : 'Comprado'} />
          {animal.dataEntrada && animal.origem === 'comprado' ? (
            <Linha rotulo="Entrada" valor={isoParaBR(animal.dataEntrada)} />
          ) : null}
          {animal.pai ? <Linha rotulo="Pai" valor={animal.pai} /> : null}
          {mae ? (
            <Linha
              rotulo="Mãe"
              valor={identificacao(mae)}
              onPress={() => router.push(`/rebanho/${mae.id}`)}
            />
          ) : null}
          {filhos.length ? (
            <Linha rotulo="Crias" valor={filhos.map(identificacao).join(', ')} />
          ) : null}
          {animal.motivoSaida ? (
            <Linha rotulo="Motivo da saída" valor={animal.motivoSaida} />
          ) : null}
          {animal.observacoes ? <Linha rotulo="Observações" valor={animal.observacoes} /> : null}
          <View className="h-3" />
        </Card>
      </ScrollView>
    </>
  );
}

function Info({
  rotulo,
  valor,
  destaque,
  perigo,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  perigo?: boolean;
}) {
  return (
    <View className="w-1/2 gap-0.5 pr-2">
      <Texto variante="legenda" tom="suave">
        {rotulo}
      </Texto>
      <Texto variante="subtitulo" tom={perigo ? 'perigo' : destaque ? 'primaria' : 'normal'}>
        {valor}
      </Texto>
    </View>
  );
}

function Linha({
  rotulo,
  valor,
  onPress,
}: {
  rotulo: string;
  valor: string;
  onPress?: () => void;
}) {
  const { cores } = useTema();
  const conteudo: ReactNode = (
    <View className="min-h-12 flex-row items-center gap-3 border-t border-borda px-5 py-3">
      <Texto tom="suave" className="w-28">
        {rotulo}
      </Texto>
      <Texto variante="rotulo" className="flex-1 text-[14px]" tom={onPress ? 'primaria' : 'normal'}>
        {valor}
      </Texto>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={cores.primaria} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} className="active:opacity-70">
      {conteudo}
    </Pressable>
  ) : (
    conteudo
  );
}
