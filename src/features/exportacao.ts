import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Grava o CSV no cache do app e abre o compartilhamento do sistema
 * (WhatsApp, e-mail, Drive...). Funciona offline: o arquivo é local.
 */
export async function compartilharCSV(nome: string, conteudo: string): Promise<void> {
  const arquivo = new File(Paths.cache, nome);
  arquivo.create({ overwrite: true });
  arquivo.write(conteudo);
  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: nome,
  });
}
