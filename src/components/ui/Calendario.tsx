import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { mesDe, nomeDoMes, semanasDoMes, somarMeses, type DataISO, type MesISO } from '@/lib/datas';
import { useTema } from '@/lib/tema';

import { Texto } from './Texto';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

type Props = {
  valor: DataISO | null;
  aoEscolher: (data: DataISO) => void;
  hoje: DataISO;
  /** Última data aceita (`null`: sem limite). */
  maximo: DataISO | null;
};

/**
 * Calendário mensal em pt-BR, sem animação. Tocar no nome do mês abre a escolha
 * rápida de mês e ano (útil para datas de nascimento antigas).
 */
export function Calendario({ valor, aoEscolher, hoje, maximo }: Props) {
  const { cores } = useTema();
  const [mes, setMes] = useState<MesISO>(() => mesDe(valor ?? hoje));
  const [escolhendoMes, setEscolhendoMes] = useState(false);
  const ano = Number(mes.slice(0, 4));
  const mesMaximo = maximo ? mesDe(maximo) : null;
  const podeAvancar = !mesMaximo || mes < mesMaximo;

  const botaoSeta = (direcao: -1 | 1, rotulo: string, desativado = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      disabled={desativado}
      onPress={() =>
        escolhendoMes ? setMes(somarMeses(mes, 12 * direcao)) : setMes(somarMeses(mes, direcao))
      }
      className={`h-12 w-12 items-center justify-center rounded-full active:bg-superficie-2 ${
        desativado ? 'opacity-30' : ''
      }`}
    >
      <Ionicons
        name={direcao < 0 ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color={cores.primaria}
      />
    </Pressable>
  );

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        {botaoSeta(-1, escolhendoMes ? 'Ano anterior' : 'Mês anterior')}
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Escolher mês e ano"
          onPress={() => setEscolhendoMes((v) => !v)}
          className="min-h-12 flex-row items-center gap-1 rounded-full px-4 active:bg-superficie-2"
        >
          <Texto variante="subtitulo" className="capitalize">
            {escolhendoMes ? String(ano) : nomeDoMes(mes)}
          </Texto>
          <Ionicons
            name={escolhendoMes ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={cores.primaria}
          />
        </Pressable>
        {botaoSeta(
          1,
          escolhendoMes ? 'Próximo ano' : 'Próximo mês',
          escolhendoMes ? !!mesMaximo && ano >= Number(mesMaximo.slice(0, 4)) : !podeAvancar,
        )}
      </View>

      {escolhendoMes ? (
        <View className="flex-row flex-wrap">
          {MESES.map((nome, i) => {
            const opcao = `${ano}-${String(i + 1).padStart(2, '0')}`;
            const bloqueado = !!mesMaximo && opcao > mesMaximo;
            const atual = opcao === mes;
            return (
              <View key={nome} className="w-1/4 p-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={nomeDoMes(opcao)}
                  disabled={bloqueado}
                  onPress={() => {
                    setMes(opcao);
                    setEscolhendoMes(false);
                  }}
                  className={`h-12 items-center justify-center rounded-2xl ${
                    atual ? 'bg-primaria' : 'bg-superficie-2'
                  } ${bloqueado ? 'opacity-30' : 'active:opacity-70'}`}
                >
                  <Texto variante="rotulo" tom={atual ? 'sobre-primaria' : 'normal'}>
                    {nome}
                  </Texto>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View>
          <View className="flex-row">
            {DIAS_SEMANA.map((d, i) => (
              <View key={i} className="flex-1 items-center py-1">
                <Texto variante="legenda" tom="suave">
                  {d}
                </Texto>
              </View>
            ))}
          </View>
          {semanasDoMes(mes).map((semana, i) => (
            <View key={i} className="flex-row">
              {semana.map((dia, j) => {
                if (!dia) return <View key={j} className="h-12 flex-1" />;
                const escolhido = dia === valor;
                const ehHoje = dia === hoje;
                const bloqueado = !!maximo && dia > maximo;
                return (
                  <View key={dia} className="h-12 flex-1 items-center justify-center">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={dia.split('-').reverse().join('/')}
                      accessibilityState={{ selected: escolhido, disabled: bloqueado }}
                      disabled={bloqueado}
                      hitSlop={2}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        aoEscolher(dia);
                      }}
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        escolhido
                          ? 'bg-primaria'
                          : ehHoje
                            ? 'border-[1.5px] border-primaria'
                            : 'active:bg-superficie-2'
                      } ${bloqueado ? 'opacity-25' : ''}`}
                    >
                      <Texto
                        variante="rotulo"
                        tom={escolhido ? 'sobre-primaria' : ehHoje ? 'primaria' : 'normal'}
                      >
                        {Number(dia.slice(8, 10))}
                      </Texto>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
