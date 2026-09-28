type Ouvinte = () => void;

/**
 * Conta promessas de gravação ainda não confirmadas pelo servidor.
 * Offline, `batch.commit()` só resolve quando sincroniza, então a promessa
 * pendente é um bom indicador de "dados ainda não enviados".
 */
export function criarContadorPendentes(aoFalhar: (erro: unknown, contexto: string) => void) {
  let pendentes = 0;
  const ouvintes = new Set<Ouvinte>();
  const avisar = () => ouvintes.forEach((ouvinte) => ouvinte());

  return {
    acompanhar(promessa: Promise<unknown>, contexto: string): void {
      pendentes += 1;
      avisar();
      promessa
        .catch((erro: unknown) => aoFalhar(erro, contexto))
        .finally(() => {
          pendentes -= 1;
          avisar();
        });
    },
    quantidade: () => pendentes,
    assinar(ouvinte: Ouvinte): () => void {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}
