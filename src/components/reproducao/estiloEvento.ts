import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { TipoEvento } from '@/domain/reproducao';
import type { NomeCor } from '@/lib/tema';

type Estilo = { icone: ComponentProps<typeof Ionicons>['name']; cor: NomeCor; fundo: string };

/** Ícone e cor de cada tipo de evento, na linha do tempo e no formulário. */
export const ESTILO_EVENTO: Record<TipoEvento, Estilo> = {
  cio: { icone: 'flame', cor: 'atencao', fundo: 'bg-atencao-suave' },
  inseminacao: { icone: 'flask', cor: 'primaria', fundo: 'bg-primaria-suave' },
  cobertura: { icone: 'male-female', cor: 'primaria', fundo: 'bg-primaria-suave' },
  diagnostico_positivo: { icone: 'checkmark-circle', cor: 'sucesso', fundo: 'bg-sucesso-suave' },
  diagnostico_negativo: { icone: 'close-circle', cor: 'atencao', fundo: 'bg-atencao-suave' },
  parto: { icone: 'heart', cor: 'sucesso', fundo: 'bg-sucesso-suave' },
  aborto: { icone: 'alert-circle', cor: 'perigo', fundo: 'bg-perigo-suave' },
  secagem: { icone: 'pause-circle', cor: 'info', fundo: 'bg-info-suave' },
};
