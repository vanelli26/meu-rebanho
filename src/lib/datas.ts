import {
  addDays,
  addMonths,
  endOfMonth,
  differenceInCalendarDays,
  differenceInMonths,
  format,
  isValid,
  parse,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Data de manejo no formato `YYYY-MM-DD` (sem fuso). */
export type DataISO = string;

const FORMATO_ISO = 'yyyy-MM-dd';
const FORMATO_BR = 'dd/MM/yyyy';

/** Converte um `Date` local em `YYYY-MM-DD`. */
export function paraDataISO(data: Date): DataISO {
  return format(data, FORMATO_ISO);
}

/** `YYYY-MM-DD` → `dd/MM/yyyy`. Retorna texto vazio se inválida. */
export function isoParaBR(iso: DataISO): string {
  const data = parse(iso, FORMATO_ISO, new Date(2000, 0, 1));
  return isValid(data) && paraDataISO(data) === iso ? format(data, FORMATO_BR) : '';
}

/** `true` se o texto é uma data `YYYY-MM-DD` que existe no calendário. */
export function ehDataISO(texto: string): boolean {
  return isoParaBR(texto) !== '';
}

/** `dd/MM/yyyy` → `YYYY-MM-DD`, ou `null` se a data não existir. */
export function brParaISO(br: string): DataISO | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return null;
  const data = parse(br, FORMATO_BR, new Date(2000, 0, 1));
  if (!isValid(data) || format(data, FORMATO_BR) !== br) return null;
  return paraDataISO(data);
}

/** Aplica a máscara `dd/MM/yyyy` enquanto o usuário digita só números. */
export function mascaraDataBR(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** `YYYY-MM-DD` → `Date` local (meia-noite). */
export function dataDeISO(iso: DataISO): Date {
  return parseISO(iso);
}

/** Soma (ou subtrai) dias de uma data `YYYY-MM-DD`. */
export function somarDias(iso: DataISO, dias: number): DataISO {
  return paraDataISO(addDays(parseISO(iso), dias));
}

/** Dias corridos de `de` até `ate` (negativo se `ate` vier antes). */
export function diasEntre(de: DataISO, ate: DataISO): number {
  return differenceInCalendarDays(parseISO(ate), parseISO(de));
}

/** `YYYY-MM-DD` → `dd/MM`, para listas curtas. */
export function isoParaDiaMes(iso: DataISO): string {
  return isoParaBR(iso).slice(0, 5);
}

/** Idade legível: "20 dias", "5 meses", "2 anos e 3 meses". */
export function idadeTexto(nascimento: DataISO, hoje: DataISO): string {
  const meses = differenceInMonths(parseISO(hoje), parseISO(nascimento));
  if (meses < 1) {
    const dias = Math.max(0, diasEntre(nascimento, hoje));
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const textoAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  return resto ? `${textoAnos} e ${resto} ${resto === 1 ? 'mês' : 'meses'}` : textoAnos;
}

/** Mês no formato `YYYY-MM`. */
export type MesISO = string;

export function mesDe(iso: DataISO): MesISO {
  return iso.slice(0, 7);
}

/** Primeiro e último dia do mês (`YYYY-MM-DD`). */
export function limitesDoMes(mes: MesISO): { inicio: DataISO; fim: DataISO } {
  const inicio = `${mes}-01`;
  return { inicio, fim: paraDataISO(endOfMonth(parseISO(inicio))) };
}

/** Soma (ou subtrai) meses de um `YYYY-MM`. */
export function somarMeses(mes: MesISO, meses: number): MesISO {
  return format(addMonths(parseISO(`${mes}-01`), meses), 'yyyy-MM');
}

/** `2026-09` → "setembro de 2026". */
export function nomeDoMes(mes: MesISO): string {
  return format(parseISO(`${mes}-01`), "MMMM 'de' yyyy", { locale: ptBR });
}
