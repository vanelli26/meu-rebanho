import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CategoriaDespesa } from '@/domain/despesas';

export const ICONE_CATEGORIA: Record<CategoriaDespesa, ComponentProps<typeof Ionicons>['name']> = {
  racao: 'nutrition',
  volumoso: 'leaf',
  tratamentos: 'medkit',
  reproducao: 'heart',
  mao_de_obra: 'people',
  combustivel: 'car',
  energia: 'flash',
  manutencao: 'construct',
  outros: 'ellipsis-horizontal-circle',
};
