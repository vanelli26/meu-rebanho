import { sair as sairDoGoogle } from '@/auth/google';

import { cancelarLembretes } from './lembretes';
import { haGravacoesPendentes } from './sync';

export { haGravacoesPendentes };

/** Sai da conta sem deixar lembretes da fazenda agendados no aparelho. */
export async function sair(): Promise<void> {
  await cancelarLembretes().catch((erro: unknown) =>
    console.error('[lembretes] Falha ao cancelar:', erro),
  );
  await sairDoGoogle();
}
