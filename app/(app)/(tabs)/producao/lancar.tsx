import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { LinhaLitros } from '@/components/producao/LinhaLitros';
import { Aviso, Botao, CampoData, Card, Seletor, Texto } from '@/components/ui';
import { buscarAnimais, identificacao, type Animal } from '@/domain/animal';
import {
  esquemaCabecalhoProducao,
  esquemaLitros,
  montarProducao,
  ORDENHAS,
  ordenhaSugerida,
  ROTULO_ORDENHA,
  type Ordenha,
  type ProducaoOrdenha,
} from '@/domain/producao';
import { useAnimais } from '@/features/animais';
import { useContextoGravacao } from '@/features/contexto';
import { useHoje } from '@/features/hoje';
import { salvarProducao, useOrdenha } from '@/features/producao';
import { dataDeISO, ehDataISO, isoParaBR, type DataISO } from '@/lib/datas';
import { numeroParaTexto, textoParaNumero } from '@/lib/numeros';
import { useTecladoVisivel } from '@/lib/teclado';

const OPCOES_ORDENHA = ORDENHAS.map((valor) => ({ valor, rotulo: ROTULO_ORDENHA[valor] }));

export default function LancarProducao() {
  const params = useLocalSearchParams<{ data?: string; ordenha?: string }>();
  const { fazenda } = useSessaoPronta();
  const hoje = useHoje();

  const [data, setData] = useState<DataISO | null>(() =>
    params.data && ehDataISO(params.data) ? params.data : hoje,
  );
  const [ordenha, setOrdenha] = useState<Ordenha>(() =>
    ORDENHAS.includes(params.ordenha as Ordenha)
      ? (params.ordenha as Ordenha)
      : ordenhaSugerida(new Date().getHours()),
  );
  const cabecalho = esquemaCabecalhoProducao.safeParse({ data, ordenha });
  const dataFutura = data !== null && data > hoje;
  const existente = useOrdenha(fazenda.id, cabecalho.success ? data : null, ordenha);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-fundo"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {cabecalho.success && !dataFutura && !existente.carregando ? (
        // A chave recria a lista (e o rascunho) ao trocar de ordenha ou quando o
        // lançamento salvo chega do servidor depois, para não sobrescrevê-lo.
        <ListaOrdenha
          key={`${data}_${ordenha}_${existente.dados ? 'salva' : 'nova'}`}
          data={data as DataISO}
          ordenha={ordenha}
          existente={existente.dados}
          topo={
            <Cabecalho
              data={data}
              setData={setData}
              ordenha={ordenha}
              setOrdenha={setOrdenha}
              hoje={hoje}
            />
          }
        />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-4 pt-2"
        >
          <Cabecalho
            data={data}
            setData={setData}
            ordenha={ordenha}
            setOrdenha={setOrdenha}
            hoje={hoje}
          />
          {dataFutura ? (
            <Aviso tipo="atencao" titulo="A data não pode ser no futuro" />
          ) : cabecalho.success ? (
            <ActivityIndicator className="py-8" />
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Cabecalho({
  data,
  setData,
  ordenha,
  setOrdenha,
  hoje,
}: {
  data: DataISO | null;
  setData: (data: DataISO | null) => void;
  ordenha: Ordenha;
  setOrdenha: (ordenha: Ordenha) => void;
  hoje: DataISO;
}) {
  return (
    <Card className="gap-4">
      <CampoData rotulo="Data da ordenha" valor={data} aoMudar={setData} hoje={dataDeISO(hoje)} />
      <Seletor rotulo="Ordenha" opcoes={OPCOES_ORDENHA} valor={ordenha} aoMudar={setOrdenha} />
    </Card>
  );
}

type Rascunho = Record<string, { texto: string; descartado: boolean }>;

function ListaOrdenha({
  data,
  ordenha,
  existente,
  topo,
}: {
  data: DataISO;
  ordenha: Ordenha;
  existente: ProducaoOrdenha | null;
  topo: ReactNode;
}) {
  const contexto = useContextoGravacao();
  const { animais } = useAnimais();
  const insets = useSafeAreaInsets();
  const tecladoVisivel = useTecladoVisivel();
  const campos = useRef<(TextInput | null)[]>([]);
  const rolagem = useRef<ScrollView>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvo, setSalvo] = useState(false);

  const emCarencia = (animal: Animal) =>
    animal.resumo.carenciaLeiteAte !== null && animal.resumo.carenciaLeiteAte >= data;

  // Vacas em lactação hoje, mais as que já têm registro nesta ordenha.
  const vacas = useMemo(() => {
    const lista = animais.filter(
      (a) =>
        (a.status === 'ativo' && a.sexo === 'F' && a.resumo.situacao === 'lactacao') ||
        existente?.registros[a.id],
    );
    return buscarAnimais(lista, '');
  }, [animais, existente]);

  const [rascunho, setRascunho] = useState<Rascunho>(() => {
    const inicial: Rascunho = {};
    for (const a of vacas) {
      const registro = existente?.registros[a.id];
      inicial[a.id] = registro
        ? { texto: numeroParaTexto(registro.litros), descartado: registro.descartado }
        : { texto: '', descartado: emCarencia(a) };
    }
    return inicial;
  });

  const lancamentos = useMemo(() => {
    const resultado: Record<string, { litros: number | null; descartado: boolean }> = {};
    for (const a of vacas) {
      const item = rascunho[a.id] ?? { texto: '', descartado: emCarencia(a) };
      resultado[a.id] = { litros: textoParaNumero(item.texto), descartado: item.descartado };
    }
    return resultado;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacas, rascunho]);

  const previa = montarProducao(data, ordenha, lancamentos);
  const preenchidas = Object.keys(previa.registros).length;
  const carencias = vacas.filter(emCarencia);

  const atualizar = (id: string, mudanca: Partial<Rascunho[string]>) => {
    setRascunho((atual) => ({
      ...atual,
      [id]: { ...(atual[id] ?? { texto: '', descartado: false }), ...mudanca },
    }));
    if (erros[id]) setErros(({ [id]: _, ...resto }) => resto);
  };

  const salvar = () => {
    const novosErros: Record<string, string> = {};
    for (const [id, { litros }] of Object.entries(lancamentos)) {
      const r = esquemaLitros.safeParse(litros);
      if (!r.success) novosErros[id] = r.error.issues[0].message;
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!preenchidas && !existente) {
      setErros({ geral: 'Informe os litros de ao menos uma vaca.' });
      return;
    }
    setSalvo(true);
    salvarProducao(contexto, data, ordenha, lancamentos);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (router.canGoBack()) router.back();
    else router.replace('/producao');
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={rolagem}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-2 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="gap-4 pb-2">
          {topo}
          {existente ? (
            <Aviso
              titulo="Editando lançamento salvo"
              mensagem={`${ROTULO_ORDENHA[ordenha]} de ${isoParaBR(data)}. Salvar substitui os valores anteriores.`}
            />
          ) : null}
          {carencias.length ? (
            <Aviso
              tipo="perigo"
              titulo={`${carencias.length} ${carencias.length === 1 ? 'vaca' : 'vacas'} em carência`}
              mensagem={`Leite marcado para descarte: ${carencias.map(identificacao).join(', ')}.`}
            />
          ) : null}
          {vacas.length === 0 ? (
            <Aviso
              tipo="atencao"
              titulo="Nenhuma vaca em lactação"
              mensagem="Registre o parto das vacas na aba Reprodução para que apareçam aqui."
            />
          ) : (
            <Texto variante="legenda" tom="suave" className="px-1">
              {vacas.length} {vacas.length === 1 ? 'vaca' : 'vacas'} em lactação · toque em
              &quot;próximo&quot; no teclado para ir à seguinte
            </Texto>
          )}
        </View>

        {vacas.map((vaca, i) => {
          const item = rascunho[vaca.id] ?? { texto: '', descartado: emCarencia(vaca) };
          const ultimo = i === vacas.length - 1;
          return (
            <LinhaLitros
              key={vaca.id}
              ref={(campo) => {
                campos.current[i] = campo;
              }}
              nome={identificacao(vaca)}
              texto={item.texto}
              aoMudarTexto={(texto) => atualizar(vaca.id, { texto })}
              descartado={item.descartado}
              aoAlternarDescarte={() => atualizar(vaca.id, { descartado: !item.descartado })}
              emCarencia={emCarencia(vaca)}
              erro={erros[vaca.id]}
              ultimo={ultimo}
              aoAvancar={() => campos.current[i + 1]?.focus()}
            />
          );
        })}
      </ScrollView>

      <View
        className="gap-3 border-t border-borda bg-fundo px-4 pt-3"
        style={{
          paddingBottom: tecladoVisivel ? 12 : ESPACO_BARRA_ABAS + insets.bottom - 20,
        }}
      >
        {erros.geral ? (
          <Texto variante="legenda" tom="perigo" className="text-center">
            {erros.geral}
          </Texto>
        ) : null}
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Texto variante="numero" tom="primaria">
              {numeroParaTexto(previa.totalLitros)} L
            </Texto>
            <Texto variante="legenda" tom="suave">
              {preenchidas} de {vacas.length} vacas
              {previa.totalDescartado
                ? ` · ${numeroParaTexto(previa.totalDescartado)} L descartados`
                : ''}
            </Texto>
          </View>
          <Botao titulo="Salvar" icone="checkmark" onPress={salvar} carregando={salvo} />
        </View>
      </View>
    </View>
  );
}
