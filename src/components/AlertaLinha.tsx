import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import type { Alerta, TipoAlerta } from '@/domain/alertas';
import { identificacao } from '@/domain/animal';
import { useTema, type NomeCor } from '@/lib/tema';

import { Texto } from './ui/Texto';

const ESTILO: Record<
  TipoAlerta,
  { icone: ComponentProps<typeof Ionicons>['name']; cor: NomeCor; fundo: string }
> = {
  carencia: { icone: 'close-circle', cor: 'perigo', fundo: 'bg-perigo-suave' },
  parto: { icone: 'heart', cor: 'sucesso', fundo: 'bg-sucesso-suave' },
  secagem: { icone: 'pause-circle', cor: 'info', fundo: 'bg-info-suave' },
  diagnostico: { icone: 'medical', cor: 'atencao', fundo: 'bg-atencao-suave' },
  retorno_cio: { icone: 'flame', cor: 'atencao', fundo: 'bg-atencao-suave' },
  sem_inseminacao: { icone: 'flask', cor: 'primaria', fundo: 'bg-primaria-suave' },
};

/** Linha de alerta com atalho para o animal. */
export function AlertaLinha({
  alerta,
  onPress,
  ultimo,
}: {
  alerta: Alerta;
  onPress: () => void;
  ultimo?: boolean;
}) {
  const { cores } = useTema();
  const estilo = ESTILO[alerta.tipo];
  const cor: NomeCor = alerta.atrasado ? 'perigo' : estilo.cor;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:bg-superficie-2">
      <View className="min-h-16 flex-row items-center gap-3 px-4">
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl ${
            alerta.atrasado ? 'bg-perigo-suave' : estilo.fundo
          }`}
        >
          <Ionicons name={estilo.icone} size={20} color={cores[cor]} />
        </View>
        <View
          className={`flex-1 flex-row items-center gap-2 self-stretch py-3 ${
            ultimo ? '' : 'border-b border-borda'
          }`}
        >
          <View className="flex-1 gap-0.5">
            <Texto
              variante="rotulo"
              className="text-[14px]"
              tom={alerta.atrasado ? 'perigo' : 'normal'}
            >
              {identificacao(alerta)} — {alerta.titulo}
            </Texto>
            <Texto variante="legenda" tom="suave">
              {alerta.detalhe}
            </Texto>
          </View>
          <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
        </View>
      </View>
    </Pressable>
  );
}
