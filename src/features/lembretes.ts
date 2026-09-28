import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { HORA_PADRAO_LEMBRETE, montarLembretes } from '@/domain/lembretes';

import { useDadosFazenda } from './DadosFazendaProvider';
import { useHoje } from './hoje';

/**
 * Lembretes diários com as pendências do Painel, como notificações locais
 * (sem servidor, funcionam offline). A preferência é do aparelho, não da conta:
 * a permissão de notificação também é.
 */
export type PreferenciaLembretes = { ativo: boolean; hora: number };

const PADRAO: PreferenciaLembretes = { ativo: false, hora: HORA_PADRAO_LEMBRETE };
const CANAL = 'lembretes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// Preferência salva em arquivo no aparelho

const arquivo = () => new File(Paths.document, 'lembretes.json');
let preferencia: PreferenciaLembretes | null = null;
const ouvintes = new Set<() => void>();

function lerPreferencia(): PreferenciaLembretes {
  if (preferencia) return preferencia;
  try {
    const f = arquivo();
    preferencia = f.exists ? { ...PADRAO, ...JSON.parse(f.textSync()) } : PADRAO;
  } catch (erro) {
    console.error('[lembretes] Falha ao ler a preferência:', erro);
    preferencia = PADRAO;
  }
  return preferencia as PreferenciaLembretes;
}

function salvarPreferencia(nova: PreferenciaLembretes): void {
  preferencia = nova;
  try {
    const f = arquivo();
    f.create({ overwrite: true });
    f.write(JSON.stringify(nova));
  } catch (erro) {
    console.error('[lembretes] Falha ao salvar a preferência:', erro);
  }
  ouvintes.forEach((ouvinte) => ouvinte());
}

const assinar = (ouvinte: () => void) => {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
};

export function usePreferenciaLembretes(): PreferenciaLembretes {
  return useSyncExternalStore(assinar, lerPreferencia);
}

/** Pede a permissão e liga os lembretes. `false` se o usuário negou. */
export async function ativarLembretes(hora: number): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  const permissao = atual.granted ? atual : await Notifications.requestPermissionsAsync();
  if (!permissao.granted) return false;
  salvarPreferencia({ ativo: true, hora });
  return true;
}

export function desativarLembretes(): void {
  salvarPreferencia({ ...lerPreferencia(), ativo: false });
}

/** Ao sair da conta, não deixa lembretes da fazenda agendados no aparelho. */
export function cancelarLembretes(): Promise<void> {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

// ---------------------------------------------------------------------------
// Agendamento

/**
 * Reagenda os lembretes dos próximos dias sempre que os dados, os prazos ou a
 * preferência mudam, e quando vira o dia. Toque na notificação abre o Painel.
 */
export function useAgendarLembretes(): void {
  const { fazenda } = useSessaoPronta();
  const { carregando, animais } = useDadosFazenda();
  const { ativo, hora } = usePreferenciaLembretes();
  const hoje = useHoje();
  const config = fazenda.configuracoes;

  useEffect(() => {
    if (carregando) return;
    // Espera os dados assentarem (vários snapshots seguidos ao abrir o app).
    const espera = setTimeout(() => {
      reagendar(ativo ? montarLembretes(animais, config, new Date(), hoje, hora) : []).catch(
        (erro: unknown) => console.error('[lembretes] Falha ao agendar:', erro),
      );
    }, 1500);
    return () => clearTimeout(espera);
  }, [carregando, animais, config, ativo, hora, hoje]);

  useEffect(() => {
    const assinatura = Notifications.addNotificationResponseReceivedListener(() => {
      router.navigate('/');
    });
    return () => assinatura.remove();
  }, []);
}

async function reagendar(lembretes: ReturnType<typeof montarLembretes>): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!lembretes.length) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Lembretes do rebanho',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  for (const lembrete of lembretes) {
    await Notifications.scheduleNotificationAsync({
      content: { title: lembrete.titulo, body: lembrete.corpo },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: lembrete.quando,
        channelId: CANAL,
      },
    });
  }
}
