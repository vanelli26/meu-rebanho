import { useGravacoesPendentes } from '@/features/sync';

import { IndicadorSync } from './ui/IndicadorSync';

/** Indicador de sincronização ligado à fila de gravações. Para o cabeçalho. */
export function IndicadorSyncAtual() {
  const pendente = useGravacoesPendentes();
  return <IndicadorSync pendente={pendente} />;
}
