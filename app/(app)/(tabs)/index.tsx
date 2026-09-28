import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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

export default function Painel() {
  const { conta, fazenda } = useSessaoPronta();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const primeiroNome = conta.nome.split(' ')[0] || 'produtor';
  const hoje = useHoje();
  const { carregando, animais } = useAnimais();
  const { producoes } = useProducoes(fazenda.id, hoje, 8);

  const emLactacao = animais.filter(
    (a) => a.status === 'ativo' && a.resumo.situacao === 'lactacao',
  ).length;
  const producao = useMemo(() => resumoProducao(producoes, hoje), [producoes, hoje]);
  const alertas = useMemo(
    () => gerarAlertas(animais, fazenda.configuracoes, hoje),
    [animais, fazenda.configuracoes, hoje],
  );
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
      <View className="flex-row items-center gap-3 px-1">
        <View className="flex-1">
          <Texto variante="legenda" tom="suave" className="text-[13px]">
            {saudacao(new Date().getHours())},
          </Texto>
          <Texto variante="titulo">{primeiroNome}</Texto>
        </View>
        <IndicadorSyncAtual />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Conta e configurações"
          hitSlop={8}
          onPress={() => router.push('/mais')}
        >
          <Avatar nome={conta.nome} fotoUrl={conta.fotoUrl} />
        </Pressable>
      </View>

      <View>
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
          <Card className="gap-0 overflow-hidden p-0">
            {alertas.map((alerta, i) => (
              <AlertaLinha
                key={`${alerta.tipo}-${alerta.animalId}`}
                alerta={alerta}
                ultimo={i === alertas.length - 1}
                // withAnchor: a lista do Rebanho fica embaixo, para o botão voltar.
                onPress={() => router.push(`/rebanho/${alerta.animalId}`, { withAnchor: true })}
              />
            ))}
          </Card>
        ) : (
          <Card className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-sucesso-suave">
              <Ionicons name="checkmark-done" size={24} color={cores.sucesso} />
            </View>
            <View className="flex-1 gap-0.5">
              <Texto variante="rotulo" className="text-[14px]">
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
