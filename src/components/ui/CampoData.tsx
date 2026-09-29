import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dataDeISO, diasEntre, isoParaBR, paraDataISO, somarDias, type DataISO } from '@/lib/datas';
import { useTema } from '@/lib/tema';

import { Calendario } from './Calendario';
import { Texto } from './Texto';

type Props = {
  rotulo: string;
  /** Data em `YYYY-MM-DD`, ou `null` se não informada. */
  valor: DataISO | null;
  aoMudar: (valor: DataISO | null) => void;
  /** Data de referência para "Hoje" e "Ontem" e para o limite padrão. */
  hoje?: Date;
  /** Última data aceita. Padrão: hoje. `null`: permite datas futuras. */
  maximo?: DataISO | null;
  /** Campo que pode ficar vazio: mostra "Limpar" no calendário. */
  opcional?: boolean;
  erro?: string;
  ajuda?: string;
};

/** "hoje", "ontem" ou o dia da semana, ao lado da data escolhida. */
function descricao(valor: DataISO, hoje: DataISO): string {
  const dias = diasEntre(valor, hoje);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias === -1) return 'amanhã';
  return format(dataDeISO(valor), 'EEEE', { locale: ptBR });
}

/**
 * Campo de data com calendário. Os atalhos "Hoje" e "Ontem" resolvem o caso
 * mais comum com um toque; o calendário abre para as demais datas.
 */
export function CampoData({
  rotulo,
  valor,
  aoMudar,
  hoje = new Date(),
  maximo,
  opcional = false,
  erro,
  ajuda,
}: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const [aberto, setAberto] = useState(false);
  const hojeISO = paraDataISO(hoje);
  const limite = maximo === undefined ? hojeISO : maximo;

  const escolher = (data: DataISO | null) => {
    void Haptics.selectionAsync();
    aoMudar(data);
    setAberto(false);
  };

  const atalhos = [
    { titulo: 'Hoje', data: hojeISO },
    { titulo: 'Ontem', data: somarDias(hojeISO, -1) },
  ];

  return (
    <View className="gap-2">
      <Texto variante="rotulo" tom="suave">
        {rotulo}
      </Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor ? isoParaBR(valor) : 'não informada'}`}
        accessibilityHint="Abre o calendário"
        onPress={() => setAberto(true)}
        className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-[1.5px] bg-superficie px-4 active:opacity-70 ${
          erro ? 'border-perigo' : 'border-borda'
        }`}
      >
        <Ionicons name="calendar-outline" size={20} color={erro ? cores.perigo : cores.primaria} />
        {valor ? (
          <View className="flex-1 flex-row items-baseline gap-2">
            <Texto variante="subtitulo">{isoParaBR(valor)}</Texto>
            <Texto variante="legenda" tom="suave">
              {descricao(valor, hojeISO)}
            </Texto>
          </View>
        ) : (
          <Texto tom="suave" className="flex-1">
            Escolher data
          </Texto>
        )}
        <Ionicons name="chevron-down" size={18} color={cores.textoSuave} />
      </Pressable>
      <View className="flex-row gap-2">
        {atalhos.map(({ titulo, data }) => {
          const ativo = valor === data;
          return (
            <Pressable
              key={titulo}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              onPress={() => escolher(data)}
              className={`min-h-12 justify-center rounded-full px-5 active:opacity-70 ${
                ativo ? 'bg-primaria' : 'bg-superficie-2'
              }`}
            >
              <Texto variante="rotulo" tom={ativo ? 'sobre-primaria' : 'normal'}>
                {titulo}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      {erro ? (
        <Texto variante="legenda" tom="perigo">
          {erro}
        </Texto>
      ) : ajuda ? (
        <Texto variante="legenda" tom="suave">
          {ajuda}
        </Texto>
      ) : null}

      <Modal
        visible={aberto}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setAberto(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar calendário"
            onPress={() => setAberto(false)}
            className="absolute inset-0 bg-black/40"
          />
          <View
            className="gap-3 rounded-t-3xl bg-superficie px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <Texto variante="subtitulo" className="px-1">
              {rotulo}
            </Texto>
            <Calendario valor={valor} aoEscolher={escolher} hoje={hojeISO} maximo={limite} />
            <View className="flex-row gap-2">
              {opcional && valor ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => escolher(null)}
                  className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-perigo-suave active:opacity-70"
                >
                  <Texto variante="rotulo" tom="perigo">
                    Limpar
                  </Texto>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => setAberto(false)}
                className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-superficie-2 active:opacity-70"
              >
                <Texto variante="rotulo">Cancelar</Texto>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
