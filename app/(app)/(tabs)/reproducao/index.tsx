import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { AlertaLinha } from '@/components/AlertaLinha';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { Botao, Card, Texto } from '@/components/ui';
import { gerarAlertas, type TipoAlerta } from '@/domain/alertas';
import { identificacao } from '@/domain/animal';
import { liberadaParaInseminar } from '@/domain/lactacao';
import { useAnimais } from '@/features/animais';
import { useHoje } from '@/features/hoje';
import { diasEntre, isoParaBR } from '@/lib/datas';
import { useTema } from '@/lib/tema';

const TIPOS_AGENDA: TipoAlerta[] = ['diagnostico', 'retorno_cio', 'secagem', 'sem_inseminacao'];

export default function Reproducao() {
  const { fazenda } = useSessaoPronta();
  const { carregando, animais } = useAnimais();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const config = fazenda.configuracoes;

  const vacas = useMemo(
    () => animais.filter((a) => a.status === 'ativo' && a.sexo === 'F'),
    [animais],
  );
  const alertas = useMemo(
    () => gerarAlertas(vacas, config, hoje).filter((a) => TIPOS_AGENDA.includes(a.tipo)),
    [vacas, config, hoje],
  );
  const partos = useMemo(
    () =>
      vacas
        .filter((a) => a.resumo.prenhe && a.resumo.previsaoParto)
        .sort((a, b) => (a.resumo.previsaoParto ?? '').localeCompare(b.resumo.previsaoParto ?? '')),
    [vacas],
  );

  const prenhes = vacas.filter((a) => a.resumo.prenhe).length;
  const liberadas = vacas.filter((a) => liberadaParaInseminar(a.resumo, hoje, config)).length;
  const aguardando = vacas.filter((a) => a.resumo.servicoSemDiagnostico).length;

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
    >
      <Animated.View entering={FadeInDown.springify().damping(18)}>
        <Botao
          titulo="Registrar evento"
          icone="add-circle"
          onPress={() => router.push('/reproducao/registrar')}
        />
      </Animated.View>

      <Card indice={1} className="flex-row">
        <Numero valor={prenhes} rotulo="Prenhes" />
        <Numero valor={aguardando} rotulo="Aguardando diagnóstico" separador />
        <Numero valor={liberadas} rotulo="Liberadas p/ inseminar" separador />
      </Card>

      <Secao titulo="A fazer" indice={2}>
        {alertas.length ? (
          <Card className="gap-0 overflow-hidden p-0">
            {alertas.map((alerta, i) => (
              <AlertaLinha
                key={`${alerta.tipo}-${alerta.animalId}`}
                alerta={alerta}
                ultimo={i === alertas.length - 1}
                onPress={() => router.push(`/rebanho/${alerta.animalId}`)}
              />
            ))}
          </Card>
        ) : (
          <Vazio
            icone="checkmark-done"
            texto={
              carregando ? 'Carregando…' : 'Nenhum diagnóstico, retorno de cio ou secagem pendente.'
            }
          />
        )}
      </Secao>

      <Secao titulo="Partos previstos" indice={3}>
        {partos.length ? (
          <Card className="gap-0 p-0">
            {partos.map((vaca, i) => {
              const previsao = vaca.resumo.previsaoParto ?? hoje;
              const dias = diasEntre(hoje, previsao);
              return (
                <Pressable
                  key={vaca.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/rebanho/${vaca.id}`)}
                  className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-superficie-2 ${
                    i ? 'border-t border-borda' : ''
                  }`}
                >
                  <Texto variante="rotulo" className="flex-1 text-[15px]">
                    {identificacao(vaca)}
                  </Texto>
                  <View className="items-end">
                    <Texto
                      variante="rotulo"
                      tom={dias < 0 ? 'perigo' : dias <= 15 ? 'atencao' : 'normal'}
                    >
                      {isoParaBR(previsao)}
                    </Texto>
                    <Texto variante="legenda" tom="suave">
                      {dias < 0 ? `${-dias} dias atrás` : dias === 0 ? 'hoje' : `em ${dias} dias`}
                    </Texto>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        ) : (
          <Vazio icone="calendar-outline" texto="Nenhuma vaca com prenhez confirmada." />
        )}
      </Secao>
    </ScrollView>
  );
}

function Vazio({ icone, texto }: { icone: 'checkmark-done' | 'calendar-outline'; texto: string }) {
  const { cores } = useTema();
  return (
    <Card className="flex-row items-center gap-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-sucesso-suave">
        <Ionicons name={icone} size={22} color={cores.sucesso} />
      </View>
      <Texto tom="suave" className="flex-1">
        {texto}
      </Texto>
    </Card>
  );
}

function Numero({
  valor,
  rotulo,
  separador,
}: {
  valor: number;
  rotulo: string;
  separador?: boolean;
}) {
  return (
    <View className={`flex-1 gap-0.5 ${separador ? 'border-l border-borda pl-3' : ''}`}>
      <Texto variante="numero" tom="primaria">
        {valor}
      </Texto>
      <Texto variante="legenda" tom="suave">
        {rotulo}
      </Texto>
    </View>
  );
}

function Secao({
  titulo,
  indice,
  children,
}: {
  titulo: string;
  indice: number;
  children: ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(60 * indice)
        .springify()
        .damping(18)}
      className="gap-2"
    >
      <Texto variante="subtitulo" className="px-1">
        {titulo}
      </Texto>
      {children}
    </Animated.View>
  );
}
