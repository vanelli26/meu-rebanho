import { useState } from 'react';

import { mascaraDecimal, numeroParaTexto, textoParaNumero } from '@/lib/numeros';

import { CampoTexto, type CampoTextoProps } from './CampoTexto';

type Props = Omit<CampoTextoProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  valor: number | null;
  aoMudar: (valor: number | null) => void;
  /** Permite casas decimais (vírgula). Padrão: true. */
  decimal?: boolean;
};

export function CampoNumero({ valor, aoMudar, decimal = true, ...props }: Props) {
  // Guarda o texto digitado para não perder estados intermediários como "12,".
  const [texto, setTexto] = useState(() => numeroParaTexto(valor));
  if (textoParaNumero(texto) !== valor && !(valor === null && texto === '')) {
    setTexto(numeroParaTexto(valor));
  }

  return (
    <CampoTexto
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={texto}
      onChangeText={(novo) => {
        const mascarado = decimal ? mascaraDecimal(novo) : novo.replace(/\D/g, '');
        setTexto(mascarado);
        aoMudar(textoParaNumero(mascarado));
      }}
      {...props}
    />
  );
}
