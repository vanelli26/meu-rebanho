import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
