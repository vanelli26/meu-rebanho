import { format, isValid, parse } from 'date-fns';

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
