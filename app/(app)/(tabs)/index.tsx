import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { AlertaLinha } from '@/components/AlertaLinha';
import { Avatar } from '@/components/Avatar';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { Logo } from '@/components/marca/Logo';
import { Card, Texto } from '@/components/ui';
import { gerarAlertas } from '@/domain/alertas';
import { resumoProducao } from '@/domain/producao';
import { useAnimais } from '@/features/animais';
import { useHoje } from '@/features/hoje';
import { useProducoes } from '@/features/producao';
import { numeroParaTexto } from '@/lib/numeros';
import { saudacao } from '@/lib/saudacao';
import { marca, useTema } from '@/lib/tema';

type Atalho = {
  icone: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  destino: Href;
};

const ATALHOS: Atalho[] = [
  { icone: 'water', titulo: 'Lançar produção', destino: '/producao/lancar' },
  { icone: 'heart', titulo: 'Evento reprodutivo', destino: '/rebanho/evento' },
  { icone: 'add-circle', titulo: 'Novo animal', destino: '/rebanho/novo' },
  { icone: 'medkit', titulo: 'Tratamento', destino: '/mais' },
];

const LIMITE_ALERTAS = 6;

export default function Painel() {
  const { conta, fazenda } = useSessaoPronta();
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const primeiroNome = conta.nome.split(' ')[0] || 'produtor';
  const hoje = useHoje();
  const { carregando, animais } = useAnimais();
  const { producoes } = useProducoes(fazenda.id, hoje, 8);
  const [verTodos, setVerTodos] = useState(false);

  const emLactacao = animais.filter(
    (a) => a.status === 'ativo' && a.resumo.situacao === 'lactacao',
  ).length;
  const producao = useMemo(() => resumoProducao(producoes, hoje), [producoes, hoje]);
  const alertas = useMemo(
    () => gerarAlertas(animais, fazenda.configuracoes, hoje),
    [animais, fazenda.configuracoes, hoje],
  );
  const visiveis = verTodos ? alertas : alertas.slice(0, LIMITE_ALERTAS);
  const litros = (valor: number | null) =>
    valor === null ? '— L' : `${numeroParaTexto(Math.round(valor))} L`;

  return (
    <ScrollView
      className="bg-fundo"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: ESPACO_BARRA_ABAS + insets.bottom,
      }}
      contentContainerClassName="gap-5 px-4"
    >
      <Animated.View
        entering={FadeInDown.springify().damping(18)}
        className="flex-row items-center gap-3 px-1"
      >
        <View className="flex-1">
          <Texto variante="legenda" tom="suave" className="text-[14px]">
            {saudacao(new Date().getHours())},
          </Texto>
          <Texto variante="titulo">{primeiroNome}</Texto>
        </View>
        <IndicadorSyncAtual />
        <Pressable accessibilityLabel="Conta" onPress={() => router.navigate('/mais')}>
          <Avatar nome={conta.nome} fotoUrl={conta.fotoUrl} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).springify().damping(18)}>
        <LinearGradient
          colors={[marca.verdeClaro, marca.verdeEscuro]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            padding: 22,
            overflow: 'hidden',
            boxShadow: '0px 12px 32px rgba(23, 58, 44, 0.28)',
          }}
        >
          <View style={{ position: 'absolute', right: -30, bottom: -36, opacity: 0.12 }}>
            <Logo tamanho={180} corTraco={marca.creme} corChifre={marca.creme} />
          </View>
          <Texto variante="legenda" tom="dourado" className="uppercase tracking-widest">
            Sua fazenda
          </Texto>
          <Texto variante="titulo" tom="creme" className="mt-1">
            {fazenda.nome}
          </Texto>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location" size={14} color="#F7F4ECB3" />
            <Texto variante="legenda" tom="creme-suave">
              {fazenda.municipio} – {fazenda.uf}
            </Texto>
          </View>

          <View className="mt-6 flex-row">
            {[
              { valor: carregando ? '—' : String(emLactacao), rotulo: 'Em lactação' },
              { valor: litros(producao.ontem), rotulo: 'Ontem' },
              { valor: litros(producao.media7Dias), rotulo: 'Média 7 dias' },
            ].map((item, i) => (
              <View
                key={item.rotulo}
                className={`flex-1 gap-0.5 ${i > 0 ? 'border-l border-[#F7F4EC]/15 pl-4' : ''}`}
              >
                <Texto variante="numero" tom="creme" numberOfLines={1} adjustsFontSizeToFit>
                  {item.valor}
                </Texto>
                <Texto variante="legenda" tom="creme-suave">
                  {item.rotulo}
                </Texto>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      <View className="gap-3">
        <Texto variante="subtitulo" className="px-1">
          Acesso rápido
        </Texto>
        <View className="flex-row flex-wrap gap-3">
          {ATALHOS.map((atalho, i) => (
            <Animated.View
              key={atalho.titulo}
              entering={FadeInDown.delay(160 + i * 50)
                .springify()
                .damping(18)}
              style={{ width: '48%', flexGrow: 1 }}
            >
              <Pressable
                onPress={() => router.navigate(atalho.destino)}
                className={`gap-3 rounded-3xl bg-superficie p-4 active:opacity-80 ${
                  escuro ? 'border border-borda' : ''
                }`}
                style={escuro ? undefined : { boxShadow: '0px 4px 16px rgba(28, 31, 29, 0.06)' }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primaria-suave">
                  <Ionicons name={atalho.icone} size={22} color={cores.primaria} />
                </View>
                <Texto variante="rotulo" className="text-[15px]">
                  {atalho.titulo}
                </Texto>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-baseline justify-between px-1">
          <Texto variante="subtitulo">Alertas</Texto>
          {alertas.length ? (
            <Texto variante="legenda" tom="suave">
              {alertas.length} {alertas.length === 1 ? 'pendência' : 'pendências'}
            </Texto>
          ) : null}
        </View>
        {alertas.length ? (
          <Card indice={6} className="gap-0 overflow-hidden p-0">
            {visiveis.map((alerta, i) => (
              <AlertaLinha
                key={`${alerta.tipo}-${alerta.animalId}`}
                alerta={alerta}
                ultimo={i === visiveis.length - 1 && alertas.length <= LIMITE_ALERTAS}
                onPress={() => router.push(`/rebanho/${alerta.animalId}`)}
              />
            ))}
            {alertas.length > LIMITE_ALERTAS ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setVerTodos((v) => !v)}
                className="min-h-12 items-center justify-center active:bg-superficie-2"
              >
                <Texto variante="rotulo" tom="primaria">
                  {verTodos ? 'Mostrar menos' : `Ver todos (${alertas.length})`}
                </Texto>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          <Card indice={6} className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-sucesso-suave">
              <Ionicons name="checkmark-done" size={24} color={cores.sucesso} />
            </View>
            <View className="flex-1 gap-0.5">
              <Texto variante="rotulo" className="text-[15px]">
                Tudo em dia
              </Texto>
              <Texto variante="legenda" tom="suave">
                {animais.length
                  ? 'Nenhuma carência, parto, secagem ou diagnóstico pendente.'
                  : 'Partos, secagens e carências aparecem aqui quando houver animais cadastrados.'}
              </Texto>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
