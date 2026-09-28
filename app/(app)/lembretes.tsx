import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Aviso, Botao, Card, Seletor, Texto } from '@/components/ui';
import { HORAS_LEMBRETE, montarLembretes } from '@/domain/lembretes';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { useHoje } from '@/features/hoje';
import { ativarLembretes, desativarLembretes, usePreferenciaLembretes } from '@/features/lembretes';
import { isoParaDiaMes } from '@/lib/datas';

const OPCOES_HORA = HORAS_LEMBRETE.map((h) => ({ valor: String(h), rotulo: `${h}h` }));

export default function Lembretes() {
  const { fazenda } = useSessaoPronta();
  const { animais } = useDadosFazenda();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const preferencia = usePreferenciaLembretes();
  const [hora, setHora] = useState(preferencia.hora);
  const [pedindo, setPedindo] = useState(false);

  // Prévia dos próximos lembretes na hora escolhida.
  const proximos = useMemo(
    () => montarLembretes(animais, fazenda.configuracoes, new Date(), hoje, hora),
    [animais, fazenda.configuracoes, hoje, hora],
  );

  const ativar = (novaHora: number) => {
    setPedindo(true);
    ativarLembretes(novaHora)
      .then((ok) => {
        if (ok) return;
        Alert.alert(
          'Notificações bloqueadas',
          'Permita as notificações do Meu Rebanho nos ajustes do celular para receber os lembretes.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ],
        );
      })
      .catch((erro: unknown) => console.error('[lembretes] Falha ao ativar:', erro))
      .finally(() => setPedindo(false));
  };

  const mudarHora = (valor: string) => {
    const nova = Number(valor);
    setHora(nova);
    if (preferencia.ativo) ativar(nova);
  };

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <Texto tom="suave" className="px-1">
        Uma notificação por dia com as pendências do Painel: partos, secagens, diagnósticos, cios e
        carências. Funciona sem internet.
      </Texto>

      <Card className="gap-4">
        <Seletor rotulo="Horário" opcoes={OPCOES_HORA} valor={String(hora)} aoMudar={mudarHora} />
        {preferencia.ativo ? (
          <>
            <Aviso
              tipo="sucesso"
              titulo="Lembretes ligados"
              mensagem={`Todo dia às ${preferencia.hora}h, quando houver pendências.`}
            />
            <Botao titulo="Desligar lembretes" variante="perigo" onPress={desativarLembretes} />
          </>
        ) : (
          <Botao
            titulo="Ligar lembretes"
            icone="notifications"
            onPress={() => ativar(hora)}
            carregando={pedindo}
          />
        )}
      </Card>

      <View className="gap-2">
        <Texto variante="subtitulo" className="px-1">
          Próximos lembretes
        </Texto>
        {proximos.length ? (
          proximos.map((l) => (
            <Card key={l.data} className="gap-1 p-4">
              <View className="flex-row items-baseline justify-between gap-2">
                <Texto variante="rotulo" className="flex-1 text-[14px]">
                  {l.titulo}
                </Texto>
                <Texto variante="legenda" tom="suave">
                  {l.data === hoje ? 'hoje' : isoParaDiaMes(l.data)} · {hora}h
                </Texto>
              </View>
              <Texto variante="legenda" tom="suave">
                {l.corpo}
              </Texto>
            </Card>
          ))
        ) : (
          <Card>
            <Texto tom="suave">Nenhuma pendência prevista para os próximos dias.</Texto>
          </Card>
        )}
        <Texto variante="legenda" tom="suave" className="px-1">
          Os lembretes são agendados para a semana seguinte sempre que o app é aberto.
        </Texto>
      </View>
    </ScrollView>
  );
}
