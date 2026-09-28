import { criarContadorPendentes } from '@/lib/contadorPendentes';

const esperarMicrotarefas = () => new Promise((resolver) => setTimeout(resolver, 0));

describe('criarContadorPendentes', () => {
  it('conta até a promessa terminar e avisa os ouvintes', async () => {
    const contador = criarContadorPendentes(jest.fn());
    const ouvinte = jest.fn();
    contador.assinar(ouvinte);

    let resolver!: () => void;
    contador.acompanhar(new Promise<void>((r) => (resolver = r)), 'teste');
    expect(contador.quantidade()).toBe(1);
    expect(ouvinte).toHaveBeenCalledTimes(1);

    resolver();
    await esperarMicrotarefas();
    expect(contador.quantidade()).toBe(0);
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });

  it('registra falhas e ainda assim libera o contador', async () => {
    const aoFalhar = jest.fn();
    const contador = criarContadorPendentes(aoFalhar);
    const erro = new Error('permissão negada');

    contador.acompanhar(Promise.reject(erro), 'criar fazenda');
    await esperarMicrotarefas();

    expect(aoFalhar).toHaveBeenCalledWith(erro, 'criar fazenda');
    expect(contador.quantidade()).toBe(0);
  });

  it('para de avisar após cancelar a assinatura', async () => {
    const contador = criarContadorPendentes(jest.fn());
    const ouvinte = jest.fn();
    const cancelar = contador.assinar(ouvinte);
    cancelar();
    contador.acompanhar(Promise.resolve(), 'x');
    await esperarMicrotarefas();
    expect(ouvinte).not.toHaveBeenCalled();
  });
});
