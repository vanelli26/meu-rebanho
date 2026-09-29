import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';

let env: RulesTestEnvironment;

const DONO = 'dono-uid';
const OUTRO = 'outro-uid';
const FAZENDA = 'fazenda-1';

const fazendaValida = (uid = DONO) => ({
  nome: 'Sítio Boa Vista',
  municipio: 'Castro',
  uf: 'PR',
  donoUid: uid,
  membros: { [uid]: 'dono' },
});

const dbDe = (uid: string) => env.authenticatedContext(uid).firestore();
const dbAnonimo = () => env.unauthenticatedContext().firestore();

async function semear() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'fazendas', FAZENDA), fazendaValida());
    await setDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a1'), { brinco: '123' });
    await setDoc(doc(db, 'usuarios', DONO), { nome: 'Dono', fazendaAtualId: FAZENDA });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-meu-rebanho',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('usuarios', () => {
  it('usuário lê e grava o próprio documento', async () => {
    const db = dbDe(DONO);
    await assertSucceeds(setDoc(doc(db, 'usuarios', DONO), { nome: 'Dono' }));
    await assertSucceeds(getDoc(doc(db, 'usuarios', DONO)));
  });

  it('não acessa documento de outro usuário', async () => {
    await semear();
    const db = dbDe(OUTRO);
    await assertFails(getDoc(doc(db, 'usuarios', DONO)));
    await assertFails(setDoc(doc(db, 'usuarios', DONO), { nome: 'Invasor' }));
  });

  it('anônimo não acessa', async () => {
    await semear();
    await assertFails(getDoc(doc(dbAnonimo(), 'usuarios', DONO)));
  });

  it('não apaga o próprio documento', async () => {
    await semear();
    await assertFails(deleteDoc(doc(dbDe(DONO), 'usuarios', DONO)));
  });
});

describe('fazendas: criação', () => {
  it('cria fazenda sendo dono e único membro, junto com o usuário em batch', async () => {
    const db = dbDe(DONO);
    const batch = writeBatch(db);
    batch.set(doc(db, 'fazendas', 'nova'), fazendaValida());
    batch.set(doc(db, 'usuarios', DONO), { nome: 'Dono', fazendaAtualId: 'nova' });
    await assertSucceeds(batch.commit());
  });

  it('não cria fazenda em nome de outro', async () => {
    await assertFails(setDoc(doc(dbDe(OUTRO), 'fazendas', 'nova'), fazendaValida(DONO)));
  });

  it('não cria fazenda com membros extras', async () => {
    const dados = { ...fazendaValida(), membros: { [DONO]: 'dono', [OUTRO]: 'funcionario' } };
    await assertFails(setDoc(doc(dbDe(DONO), 'fazendas', 'nova'), dados));
  });

  it('não cria fazenda sem papel de dono', async () => {
    const dados = { ...fazendaValida(), membros: { [DONO]: 'funcionario' } };
    await assertFails(setDoc(doc(dbDe(DONO), 'fazendas', 'nova'), dados));
  });

  it('não cria fazenda sem nome', async () => {
    const dados = { ...fazendaValida(), nome: '' };
    await assertFails(setDoc(doc(dbDe(DONO), 'fazendas', 'nova'), dados));
  });

  it('escuta fazenda que ainda não chegou ao servidor', async () => {
    await assertSucceeds(getDoc(doc(dbDe(DONO), 'fazendas', 'ainda-nao-existe')));
  });

  it('anônimo não lê fazenda inexistente', async () => {
    await assertFails(getDoc(doc(dbAnonimo(), 'fazendas', 'ainda-nao-existe')));
  });

  it('anônimo não cria', async () => {
    await assertFails(setDoc(doc(dbAnonimo(), 'fazendas', 'nova'), fazendaValida()));
  });
});

describe('fazendas: leitura, edição e exclusão', () => {
  beforeEach(semear);

  it('membro lê a fazenda', async () => {
    await assertSucceeds(getDoc(doc(dbDe(DONO), 'fazendas', FAZENDA)));
  });

  it('não membro não lê', async () => {
    await assertFails(getDoc(doc(dbDe(OUTRO), 'fazendas', FAZENDA)));
  });

  it('dono edita dados da fazenda', async () => {
    await assertSucceeds(updateDoc(doc(dbDe(DONO), 'fazendas', FAZENDA), { nome: 'Novo nome' }));
  });

  it('dono não troca o dono nem se remove', async () => {
    const ref = doc(dbDe(DONO), 'fazendas', FAZENDA);
    await assertFails(updateDoc(ref, { donoUid: OUTRO }));
    await assertFails(updateDoc(ref, { membros: { [OUTRO]: 'dono' } }));
  });

  it('não membro não edita', async () => {
    await assertFails(updateDoc(doc(dbDe(OUTRO), 'fazendas', FAZENDA), { nome: 'X' }));
  });

  it('funcionário não edita a fazenda', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'fazendas', FAZENDA), {
        [`membros.${OUTRO}`]: 'funcionario',
      });
    });
    await assertFails(updateDoc(doc(dbDe(OUTRO), 'fazendas', FAZENDA), { nome: 'X' }));
  });

  it('ninguém apaga a fazenda', async () => {
    await assertFails(deleteDoc(doc(dbDe(DONO), 'fazendas', FAZENDA)));
  });
});

describe('subcoleções da fazenda', () => {
  beforeEach(semear);

  it('membro lê e grava', async () => {
    const db = dbDe(DONO);
    await assertSucceeds(getDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a1')));
    await assertSucceeds(setDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a2'), { brinco: '9' }));
    await assertSucceeds(
      setDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a1', 'eventos', 'e1'), { tipo: 'cio' }),
    );
    await assertSucceeds(
      setDoc(doc(db, 'fazendas', FAZENDA, 'producao', '2026-09-27_manha'), { totalLitros: 0 }),
    );
  });

  it('não membro não lê nem grava', async () => {
    const db = dbDe(OUTRO);
    await assertFails(getDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a1')));
    await assertFails(setDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a2'), { brinco: '9' }));
  });

  it('anônimo não lê', async () => {
    await assertFails(getDoc(doc(dbAnonimo(), 'fazendas', FAZENDA, 'animais', 'a1')));
  });

  it('subcoleção de fazenda inexistente é negada', async () => {
    await assertFails(getDoc(doc(dbDe(DONO), 'fazendas', 'nao-existe', 'animais', 'a1')));
  });
});

describe('financeiro (só o dono)', () => {
  beforeEach(async () => {
    await semear();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'fazendas', FAZENDA), {
        [`membros.${OUTRO}`]: 'funcionario',
      });
    });
  });

  const precoRef = (uid: string, id: string) =>
    doc(dbDe(uid), 'fazendas', FAZENDA, 'precosLeite', id);
  const preco = { inicio: '2026-09-01', valorLitro: 2.5, observacao: '' };

  it('dono grava e lê preços e despesas', async () => {
    await assertSucceeds(setDoc(precoRef(DONO, '2026-09-01'), preco));
    await assertSucceeds(getDoc(precoRef(DONO, '2026-09-01')));
    const despesa = doc(dbDe(DONO), 'fazendas', FAZENDA, 'despesas', 'd1');
    await assertSucceeds(setDoc(despesa, { valor: 1000 }));
    await assertSucceeds(getDoc(despesa));
    await assertSucceeds(deleteDoc(precoRef(DONO, '2026-09-01')));
  });

  it('funcionário não lê nem grava o financeiro', async () => {
    await assertFails(setDoc(precoRef(OUTRO, '2026-09-01'), preco));
    await assertFails(getDoc(precoRef(OUTRO, '2026-09-01')));
    await assertFails(getDoc(doc(dbDe(OUTRO), 'fazendas', FAZENDA, 'despesas', 'd1')));
    // O resto da fazenda continua liberado para o funcionário.
    await assertSucceeds(getDoc(doc(dbDe(OUTRO), 'fazendas', FAZENDA, 'animais', 'a1')));
  });

  it('o id do preço é a data de início e o valor é positivo', async () => {
    await assertFails(setDoc(precoRef(DONO, '2026-09-02'), preco));
    await assertFails(setDoc(precoRef(DONO, '2026-09-01'), { ...preco, valorLitro: 0 }));
    await assertFails(setDoc(precoRef(DONO, '2026-09-01'), { ...preco, valorLitro: '2,50' }));
  });
});

describe.each(['eventos', 'tratamentos'])('%s por grupo de coleção', (colecao) => {
  beforeEach(async () => {
    await semear();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'fazendas', 'fazenda-2'), fazendaValida(OUTRO));
      await setDoc(doc(db, 'fazendas', FAZENDA, 'animais', 'a1', colecao, 'e1'), {
        tipo: 'parto',
        fazendaId: FAZENDA,
      });
      await setDoc(doc(db, 'fazendas', 'fazenda-2', 'animais', 'b1', colecao, 'e2'), {
        tipo: 'cio',
        fazendaId: 'fazenda-2',
      });
    });
  });

  const doGrupo = (uid: string, fazendaId: string) =>
    getDocs(query(collectionGroup(dbDe(uid), colecao), where('fazendaId', '==', fazendaId)));

  it('membro lista os documentos da própria fazenda', async () => {
    const snap = await assertSucceeds(doGrupo(DONO, FAZENDA));
    expect(snap.docs.map((d) => d.id)).toEqual(['e1']);
  });

  it('não lista documentos de fazenda da qual não é membro', async () => {
    await assertFails(doGrupo(DONO, 'fazenda-2'));
  });

  it('consulta sem filtro pela fazenda é negada', async () => {
    await assertFails(getDocs(collectionGroup(dbDe(DONO), colecao)));
  });

  it('anônimo não lista', async () => {
    await assertFails(
      getDocs(query(collectionGroup(dbAnonimo(), colecao), where('fazendaId', '==', FAZENDA))),
    );
  });
});
