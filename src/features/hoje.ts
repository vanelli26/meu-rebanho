import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { paraDataISO, type DataISO } from '@/lib/datas';

/**
 * Data de hoje (`YYYY-MM-DD`). Atualiza quando o app volta ao primeiro plano,
 * para não ficar preso no dia em que foi aberto.
 */
export function useHoje(): DataISO {
  const [hoje, setHoje] = useState(() => paraDataISO(new Date()));
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setHoje(paraDataISO(new Date()));
    });
    return () => assinatura.remove();
  }, []);
  return hoje;
}
