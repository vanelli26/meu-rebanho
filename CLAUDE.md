# Meu Rebanho — Gestão de Gado Leiteiro

App mobile **offline-first** para gerenciar rebanhos leiteiros.
Cada usuário entra com **conta Google** e administra **a sua fazenda**. O modelo já suporta membros adicionais no futuro.
Uso principal: no campo/curral, no celular, com uma mão, muitas vezes sem internet e sob sol forte.

> Este arquivo é lido automaticamente pelo Claude Code. Siga as convenções e o roadmap abaixo.
> Ao concluir cada item do roadmap, marque `[x]` neste arquivo.

---

## 1. Princípios do produto

1. **Funciona offline.** Depois do primeiro login, todas as telas funcionam sem rede, usando o cache persistente do Firestore. As gravações ficam na fila e sincronizam sozinhas.
2. **Entrada rápida.** Registrar uma produção ou um evento deve levar poucos toques. Animais são identificados pelo **nome** nas telas e na busca; o brinco fica no cadastro.
3. **Moderno, elegante e usável no campo.** Identidade "Campo premium" (verde-floresta, creme e dourado-trigo, fonte Plus Jakarta Sans), tema claro/escuro automático e tipografia compacta. Sem animações de entrada ou decorativas (atrapalham no uso real); só as transições nativas de navegação. Mesmo assim: alvos de toque ≥ 48dp e contraste legível sob sol.
4. **Eventos são a fonte da verdade.** A situação da vaca é calculada a partir dos eventos por funções puras. O resultado é salvo no documento do animal como um _resumo_ para economizar leituras. Esse resumo nunca é editado à mão.
5. **Isolamento por fazenda.** Um usuário só lê e escreve dados de fazendas das quais é membro, garantido pelas Security Rules.

---

## 2. Stack

| Camada             | Escolha                                                                                                     | Motivo                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Framework          | **Expo** (React Native) + **TypeScript** strict, com **expo-dev-client**                                    | O Firebase nativo exige development build (não roda no Expo Go) |
| Navegação          | **expo-router**                                                                                             | Rotas por arquivo, grupos para área logada/deslogada            |
| Backend            | **Firebase** via **@react-native-firebase** (`app`, `auth`, `firestore`)                                    | SDK nativo com persistência offline real                        |
| Login              | **@react-native-google-signin/google-signin** + Firebase Auth                                               | Login Google nativo                                             |
| Estado de servidor | Listeners `onSnapshot` encapsulados em hooks                                                                | Resposta imediata do cache, offline e online                    |
| Formulários        | **react-hook-form** + **zod**                                                                               | Validação tipada                                                |
| Estilo             | **NativeWind**                                                                                              | Rápido e consistente                                            |
| Gráficos           | **react-native-gifted-charts**                                                                              | Leve                                                            |
| Datas              | **date-fns** com locale `ptBR`                                                                              | Cálculos reprodutivos                                           |
| Notificações       | **expo-notifications** (locais)                                                                             | Lembretes sem servidor                                          |
| Exportação         | **expo-file-system** + **expo-sharing**                                                                     | CSV para planilha/WhatsApp                                      |
| Testes             | **Jest**, **@testing-library/react-native**, **Firebase Emulator Suite** + **@firebase/rules-unit-testing** | Regras de negócio e Security Rules                              |
| Build              | **EAS Build** (`development` e `preview`)                                                                   | APK para instalar no celular                                    |

Regras de uso das bibliotecas:

- Use sempre as versões estáveis mais recentes (`npx create-expo-app@latest`, `npx expo install <pacote>`).
- Use a **API modular** do React Native Firebase (`getFirestore`, `doc`, `setDoc`, `onSnapshot`...), não a API antiga com namespace (`firestore().collection(...)`).
- Configure os plugins no `app.config.ts` (`@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-google-signin/google-signin`, `expo-build-properties` com `ios.useFrameworks: "static"`).
- Região do Firestore: **southamerica-east1** (São Paulo).

Plataforma alvo principal: **Android**. iOS deve continuar funcionando.

---

## 3. Regras obrigatórias do Firestore offline

Estas regras existem porque o comportamento offline do Firestore quebra padrões comuns. Siga sempre:

1. **Não aguarde gravações na UI.** Offline, a promise de `setDoc`/`updateDoc`/`batch.commit()` só resolve quando o servidor confirma. Grave e siga em frente; a tela se atualiza pelo `onSnapshot`. Capture erros com `.catch()` e registre-os no log.
2. **Nunca use transações** (`runTransaction`). Elas falham offline. Use `writeBatch` para gravações atômicas.
3. **Gere IDs no cliente** com `doc(collection(...)).id`, para já ter o ID antes de sincronizar.
4. **Não use agregações no servidor** (`count()`, `sum()`, `average()`). Elas exigem rede. Calcule no cliente a partir dos dados em cache ou dos resumos.
5. **Leia sempre via `onSnapshot`** nas telas. `getDoc` offline pode falhar se o documento nunca foi carregado.
6. **Cache ilimitado.** Configure `cacheSizeBytes` como ilimitado na inicialização.
7. **Datas:** use texto `YYYY-MM-DD` para datas de manejo (evita problemas de fuso) e `serverTimestamp()` só para `createdAt`/`updatedAt`.
8. **Indicador de sincronização.** Mostre no topo um ícone discreto quando houver gravações pendentes (`hasPendingWrites` nos metadados do snapshot).
9. **Logout offline.** Antes de sair, se houver gravações pendentes, avise que dados podem se perder e peça confirmação.

---

## 4. Estrutura de pastas

```
app/
  (auth)/
    login.tsx             # Botão "Entrar com Google"
  (onboarding)/
    criar-fazenda.tsx     # Primeiro acesso: nome da fazenda
  (app)/
    (tabs)/
      index.tsx           # Painel (resumo + alertas)
      rebanho/            # Lista (filtro "Prenhes" = partos previstos), detalhe, cadastro e registro de evento
      producao/           # Lançamento em lote e histórico
      financas/           # Resumo do mês, preço do leite (vigências), despesas (só o dono)
    mais.tsx              # Conta e fazenda (aberta pela foto no Painel, fora das abas)
    tratamento.tsx        # Tratamento em um ou vários animais (fora das abas)
    prazos.tsx            # Prazos reprodutivos da fazenda (só o dono edita)
    exportar.tsx          # Planilhas CSV (animais, produção, eventos, tratamentos; despesas e resultado por animal para o dono)
    lembretes.tsx         # Notificação diária com as pendências (preferência do aparelho)
  _layout.tsx             # Guarda de rota: login → onboarding → app
src/
  firebase/
    init.ts               # Configuração do Firestore (cache ilimitado)
    paths.ts              # Funções que montam referências (ex.: animaisRef(fazendaId))
    converters.ts         # FirestoreDataConverter tipados por coleção
  auth/                   # Contexto de sessão, login/logout Google
  domain/                 # REGRAS DE NEGÓCIO PURAS (sem React, sem Firebase)
    animal.ts             # Tipos, formulário, busca, nome e brinco únicos
    producao.ts           # Documento da ordenha, totais e médias
    reproducao.ts
    lactacao.ts
    carencia.ts
    resumoAnimal.ts       # Recalcula o resumo a partir dos eventos
    alertas.ts
    lembretes.ts          # Texto e agenda das notificações a partir de gerarAlertas
    precoLeite.ts         # Preço do leite por vigência e receita das ordenhas
    despesas.ts           # Despesas, resumo por categoria, resultado e custo por litro
    rateio.ts             # Rateio por cabeça-dia e resultado por animal
    analiseMes.ts         # Tudo do financeiro de um mês (receita, despesas, rateio, animais)
    sugestoes.ts          # Sugestões de gestão a partir das análises mensais
    exportacao.ts         # CSV para Excel pt-BR: `;`, vírgula decimal, dd/MM/yyyy, BOM
  features/               # Hooks (useAnimais, useProducoes...) e ações de gravação
    DadosFazendaProvider.tsx  # Listeners de animais, de todos os eventos e de todos os tratamentos
    FinanceiroProvider.tsx    # Listeners do financeiro (só para o dono)
  components/ui/
  lib/
firestore.rules
firestore.indexes.json
firebase.json             # Emuladores
__tests__/
  domain/
  rules/                  # Testes das Security Rules no emulador
```

**Regra importante:** todo cálculo fica em `src/domain/` como função pura que recebe dados e uma data de referência (`hoje`). Telas não acessam o Firestore diretamente; usam hooks e ações de `src/features/`.

---

## 5. Modelo de dados (Firestore)

```
usuarios/{uid}
fazendas/{fazendaId}
  animais/{animalId}
    eventos/{eventoId}
    tratamentos/{tratamentoId}
  producao/{data_ordenha}     # ex.: "2026-09-27_manha"
  precosLeite/{inicio}        # ex.: "2026-09-01" (só o dono)
  despesas/{despesaId}        # (só o dono)
```

### `usuarios/{uid}`

- `nome`, `email`, `fotoUrl`
- `fazendaAtualId` (qual fazenda abrir ao entrar)
- `createdAt`

### `fazendas/{fazendaId}`

- `nome`, `municipio`, `uf`
- `donoUid`
- `membros`: mapa `{ [uid]: "dono" | "funcionario" }` (no MVP só o dono)
- `configuracoes`:
  - `diasGestacao` (padrão 283)
  - `diasSecagemAntesParto` (padrão 60)
  - `periodoVoluntarioEspera` (padrão 45)
  - `diasDiagnosticoGestacao` (padrão 35)
  - `diasRetornoCio` (padrão 21)
- `createdAt`, `updatedAt`

### `animais/{animalId}`

Dados cadastrais:

- `nome` (obrigatório, único na fazenda sem diferenciar acentos/caixa; é a identificação nas telas)
- `brinco` (obrigatório, único na fazenda; aparece só no cadastro e nos dados do animal)
- Validação de unicidade no cliente. Animais antigos sem nome aparecem como "Brinco N" (`identificacao()`).
- `raca`, `sexo` (`F` | `M`), `dataNascimento`
- `maeId`, `pai` (touro ou código do sêmen)
- `origem` (`nascido` | `comprado`), `dataEntrada`
- `status` (`ativo` | `vendido` | `morto` | `descartado`), `dataSaida`, `motivoSaida`
- `observacoes`, `createdAt`, `updatedAt`

Resumo calculado (escrito só por `resumoAnimal.ts`):

- `resumo.situacao`: `novilha` | `lactacao` | `seca` | `bezerra` | `macho`
- `resumo.prenhe` (bool)
- `resumo.ultimoParto`, `resumo.ultimaCobertura`, `resumo.ultimaSecagem`
- `resumo.previsaoParto`, `resumo.previsaoSecagem`
- `resumo.servicoSemDiagnostico` (inseminação/cobertura ainda sem diagnóstico, parto ou aborto depois; base dos alertas de retorno de cio e diagnóstico)
- `resumo.carenciaLeiteAte` (data ou null)
- `resumo.numeroPartos`

A situação `bezerra` vira `novilha` com a idade sem nova gravação: as telas usam `situacaoAtual(animal, hoje)`.

### `eventos/{eventoId}` (subcoleção do animal)

- `data`, `tipo`: `cio` | `inseminacao` | `cobertura` | `diagnostico_positivo` | `diagnostico_negativo` | `parto` | `aborto` | `secagem`
- `touroSemen`, `responsavel`, `criaId`, `observacoes`, `criadoPor` (uid), `createdAt`
- `fazendaId`: o app escuta **todos** os eventos da fazenda com `collectionGroup('eventos')` filtrando por este campo. Assim o histórico de toda vaca fica no cache e o resumo é recalculado certo mesmo offline.

### `tratamentos/{tratamentoId}` (subcoleção do animal)

- `data`, `tipo`: `vacina` | `vermifugo` | `antibiotico` | `hormonio` | `outro`
- `produto`, `dose`, `via`, `carenciaLeiteDias`, `carenciaCarneDias`
- `observacoes`, `criadoPor`, `createdAt`
- `despesaId`: despesa criada com o custo informado (só o dono vê o campo). Excluir o tratamento de um animal tira a parte dele da despesa (`despesaSemAnimal`), ou apaga a despesa se era o único.
- `fazendaId`: lidos todos de uma vez por `collectionGroup('tratamentos')`, como os eventos, para recalcular a carência offline.

### `producao/{data_ordenha}`

Um documento por ordenha, com todas as vacas dentro (barato de ler e gravar em lote):

- `data`, `ordenha` (`manha` | `tarde` | `unica`)
- `registros`: mapa `{ [animalId]: { litros: number, descartado: boolean } }`
- `totalLitros` (só o que foi para o tanque), `totalDescartado` (calculados no cliente ao salvar)
- `criadoPor`, `updatedAt`

### `precosLeite/{inicio}` (financeiro, só o dono)

- `inicio` (= id do documento), `valorLitro` (reais, até 4 casas), `observacao`, `criadoPor`, `updatedAt`
- **Vigência:** cada preço vale do `inicio` até a véspera do próximo. O fim não é gravado (`vigencias()` calcula), então nunca há dois preços valendo ao mesmo tempo, mesmo offline. Cadastrar de novo na mesma data substitui (mesmo id). O histórico nunca é sobrescrito: a receita dos meses passados usa o preço da época.

### `despesas/{despesaId}` (financeiro, só o dono)

- `data`, `categoria` (`racao` | `volumoso` | `tratamentos` | `reproducao` | `mao_de_obra` | `combustivel` | `energia` | `manutencao` | `outros`), `descricao`, `valor` (centavos)
- `quantidade`, `unidade` (`kg` | `sc` | `t` | `L` | `un`), opcionais, para acompanhar o preço unitário
- Destino do rateio: `grupo` (`rebanho` | `lactacao` | `secas` | `recria` | `animais`), `animalIds` (só em `animais`), `porLitros` (só em `lactacao`: divide pelos litros de cada vaca)
- `tratamentoId` (despesa criada por um tratamento), `criadoPor`, `updatedAt`
- Competência = mês da `data`.

**Dinheiro:** totais e despesas em **centavos inteiros** (`src/lib/dinheiro.ts`); só o preço do litro fica em reais com até 4 casas.

### Fluxo de gravação de evento ou tratamento

Em um único `writeBatch`:

1. Criar o documento do evento/tratamento.
2. Recalcular o resumo com `resumoAnimal.ts`, usando os eventos já em cache + o novo.
3. Atualizar `animais/{id}.resumo`.

### Índices

Declarar em `firestore.indexes.json` os índices compostos que surgirem (ex.: animais por `status` + `resumo.situacao`).
Já declarados: `eventos.fazendaId` e `tratamentos.fazendaId` com escopo de grupo de coleção (consultas de eventos e tratamentos da fazenda).

---

## 6. Autenticação e Security Rules

Fluxo:

1. Sem sessão → tela de login → Google Sign-In → `signInWithCredential`.
2. Com sessão e sem `usuarios/{uid}.fazendaAtualId` → tela "Criar fazenda" (cria fazenda com `donoUid` e `membros[uid] = "dono"` e o doc do usuário em um batch).
3. Com fazenda → app.

Configuração necessária (fazer manualmente, documentar no README):

- Projeto Firebase com Auth Google ativado e Firestore na região `southamerica-east1`.
- App Android registrado com o `package` do `app.config.ts` e as **impressões SHA-1** do keystore de debug e do EAS (`eas credentials`).
- `google-services.json` (Android) e `GoogleService-Info.plist` (iOS) na raiz, **fora do git** se o repositório for público.
- `webClientId` do Google em variável de ambiente (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).

Security Rules (base, ajustar e cobrir com testes):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function logado() { return request.auth != null; }
    function membro(fazendaId) {
      return logado() &&
        request.auth.uid in get(/databases/$(database)/documents/fazendas/$(fazendaId)).data.membros;
    }

    match /usuarios/{uid} {
      allow read, write: if logado() && request.auth.uid == uid;
    }

    match /fazendas/{fazendaId} {
      allow create: if logado()
        && request.resource.data.donoUid == request.auth.uid
        && request.resource.data.membros[request.auth.uid] == "dono";
      allow read: if logado() && request.auth.uid in resource.data.membros;
      allow update: if logado() && resource.data.membros[request.auth.uid] == "dono";
      allow delete: if false;

      // Não usar /{sub=**}: no rules_version 2 ele casa também com o próprio doc da fazenda.
      match /{colecao}/{resto=**} {
        allow read, write: if membro(fazendaId);
      }
    }

    // Eventos e tratamentos de todos os animais, lidos por grupo de coleção (filtrando fazendaId).
    match /{caminho=**}/eventos/{eventoId} {
      allow read: if membro(resource.data.fazendaId);
    }
    match /{caminho=**}/tratamentos/{tratamentoId} {
      allow read: if membro(resource.data.fazendaId);
    }
  }
}
```

Financeiro (`precosLeite`, `despesas`): só o dono lê e grava (`dono(fazendaId)`); a regra geral das subcoleções exclui essas coleções. Ver `firestore.rules`.

---

## 7. Regras de negócio (`src/domain/`)

Todos os prazos vêm de `fazenda.configuracoes`.

**Situação da vaca:**

- _Em lactação_: último parto posterior à última secagem.
- _Seca_: última secagem posterior ao último parto.
- _Novilha_: fêmea sem parto registrado (acima da idade de bezerra, ex.: 12 meses).
- _Prenhe_: diagnóstico positivo após a última inseminação/cobertura, sem parto ou aborto depois.

**Cálculos:**

- **DEL** = hoje − último parto (só em lactação). Calculado na tela, não salvo (muda todo dia).
- **Previsão de parto** = inseminação/cobertura confirmada + `diasGestacao`.
- **Previsão de secagem** = previsão de parto − `diasSecagemAntesParto`.
- **IEP** = dias entre partos consecutivos.
- **Liberada para inseminar** = em lactação e DEL ≥ `periodoVoluntarioEspera`.

**Tipos de evento sugeridos** (`tiposEventoSugeridos`), pela situação reprodutiva e não só pela lactação (vaca em lactação é inseminada normalmente):

- Prenhe: diagnóstico (reconfirmação), parto, aborto; secagem se em lactação.
- Aguardando diagnóstico: diagnóstico, cio (retorno) e novo serviço.
- Vazia: cio, inseminação, cobertura; secagem se em lactação.
- Bezerra e macho: nenhum.
- Os demais tipos ficam em "Mostrar outros tipos", para corrigir histórico incompleto.

**Carência de leite:**

- `carenciaLeiteAte` = maior (data do tratamento + `carenciaLeiteDias`) entre os tratamentos (último dia inclusive). Idem para carne, calculada na tela.
- Ao lançar produção, a vaca com tratamento cobrindo a data da ordenha (`emCarenciaLeiteNaData`) vem com `descartado: true` e aviso visível. Vale também ao editar uma ordenha passada.
- Totais de leite entregue excluem registros descartados.

**Alertas do painel** (calculados no cliente a partir dos resumos, por urgência):

- Carências ativas (quem NÃO vai para o tanque hoje).
- Partos previstos nos próximos 15 dias.
- Secagens previstas nos próximos 7 dias ou atrasadas.
- Diagnóstico de gestação pendente.
- Observar retorno de cio (18–24 dias após inseminação sem diagnóstico).
- Vacas liberadas para inseminar há mais de 30 dias sem inseminação.

**Receita do leite** (`precoLeite.ts`): litros entregues de cada ordenha × preço vigente na data. Leite descartado vira valor perdido. Ordenhas antes do primeiro preço ficam fora da receita e são avisadas ("L sem preço").

**Resultado do mês** (`despesas.ts`): resultado = receita − despesas; **custo por litro** = despesas / litros produzidos (entregues + descartados); preço médio = receita / litros entregues com preço; % alimentação = (ração + volumoso) / despesas; ponto de equilíbrio = litros/dia que pagariam as despesas no preço médio.

**Rateio e resultado por animal** (`rateio.ts`), por competência (mês da despesa), até hoje no mês corrente:

- Grupo `animais`: partes iguais entre os escolhidos.
- Demais grupos: por **cabeça-dia**. Cada animal recebe a parte dos dias do mês em que estava na fazenda (`presenteNaData`: entrada/nascimento até a véspera da saída) e no grupo (`situacaoNaData`: partos, secagens e idade até aquele dia).
- `porLitros` (lactação): proporcional aos litros de cada vaca no mês, inclusive descartados; sem produção lançada, volta para cabeça-dia.
- Grupo sem nenhum animal no mês: valor fica "sem rateio" (entra no resultado do mês, em nenhum animal).
- Resultado do animal: receita (litros entregues × preço vigente) − custo rateado = margem. O leite descartado aparece à parte.

**Sugestões** (`sugestoes.ts`, a partir de `analisarMes` do mês corrente e dos 3 anteriores): cadastrar preço / preço sem atualização há 45 dias; custo por litro acima do preço; mês fechado no prejuízo; vaca em lactação no vermelho nos 3 últimos meses fechados; vazia com DEL > 150 e margem abaixo da média; alimentação por litro subindo > 15%; alimentação > 70% das despesas; leite descartado > R$ 50 no mês; nenhuma despesa lançada até o dia 10. Mostradas em Finanças e, a primeira, no Painel (só o dono).

**Lembretes** (`lembretes.ts` + `features/lembretes.ts`): notificações locais, sem servidor. Para cada um dos próximos 7 dias, `gerarAlertas` com os resumos atuais e aquela data; dia sem pendência não notifica. Reagendados (cancela e agenda de novo) quando os dados, os prazos, a preferência ou o dia mudam, e cancelados ao sair da conta. A preferência (ligado, hora) fica num arquivo do aparelho, não no Firestore, porque a permissão de notificação também é do aparelho.

---

## 8. Telas

1. **Login**: logo, botão "Entrar com Google", aviso de que o primeiro acesso precisa de internet.
2. **Criar fazenda**: nome, município, UF.
3. **Painel**: vacas em lactação, produção de ontem, média de 7 dias, alertas com atalho para o animal, indicador de sincronização.
4. **Rebanho**: lista ordenada e buscada pelo nome, com filtro por situação (o filtro "Prenhes" ordena pela previsão de parto); detalhe com linha do tempo, gráfico de produção da vaca (30 dias) e tratamentos. Não há aba de reprodução: eventos são registrados a partir do Rebanho, e as pendências reprodutivas aparecem nos alertas do Painel.
5. **Produção**: gráfico do leite no tanque por dia (30 dias, `serieDiaria`, barras sem animação; toque na barra mostra o dia) e histórico por dia.
   **Lançar produção em lote**: escolher data e ordenha → lista das vacas em lactação → litros com teclado numérico e "próximo" automático → salvar em um documento.
6. **Registrar evento reprodutivo** (`rebanho/evento`, pelo botão "Registrar evento" no detalhe da vaca): vaca → tipo → data (padrão hoje) → campos específicos. No parto, oferecer cadastro rápido da cria.
7. **Tratamentos** (`tratamento`, pelo botão no detalhe do animal ou por "Tratamento em lote" em Conta e fazenda): um animal ou vários de uma vez (atalhos "Em lactação" e "Todo o rebanho"). No detalhe, lista de tratamentos (segurar para excluir) e avisos de carência de leite e carne.
8. **Conta e fazenda** (`mais`, aberta ao tocar na foto do usuário no Painel; não é aba): prazos reprodutivos (`prazos`: limites em `LIMITES_PRAZOS`; salvar recalcula o resumo de todos os animais em batches), tratamento em lote, exportar CSV, lembretes, conta (foto, e-mail, sair). Abas: Painel, Rebanho, Produção e Finanças.
9. **Finanças** (aba, só o dono): mês selecionável com receita do leite, preço médio, leite descartado em R$ e preço vigente; histórico de preços (`financas/precos`, segurar para excluir) e novo preço (`financas/preco`, avisa qual preço perde a vigência). Resultado do mês, custo por litro × preço médio, despesas por categoria e lançamentos; `financas/despesa` lança ou edita (`?id=`) com categoria, valor, quantidade, e para quem é. `financas/animais` lista a margem de cada animal no mês (pior ou melhor primeiro); o detalhe do animal tem o card "Financeiro" do mês (só o dono).

---

## 9. Convenções de código

- TypeScript `strict`; sem `any`. Tipos das coleções em `src/firebase/converters.ts`.
- Interface 100% em **pt-BR**. Datas `dd/MM/yyyy`, vírgula decimal.
- Cores só por tokens (`bg-primaria`, `text-texto-suave`...; `useTema()` fora do className). Nunca hex solto, exceto cores fixas da marca (`marca` em `src/lib/tema.ts`).
- Texto sempre com `<Texto variante tom>`, não `Text` direto. Logo em `src/components/marca/`; fonte do desenho: `assets/images/marca.svg`.
- Campos do Firestore em camelCase português (`dataNascimento`, `carenciaLeiteAte`).
- Telas nunca importam do Firebase; usam hooks de `src/features/`.
- Validar todo formulário com schema zod.
- Toda função em `src/domain/` tem teste. Toda mudança em `firestore.rules` tem teste no emulador.
- Commits pequenos, mensagem em português no imperativo.

---

## 10. Comandos

```bash
npx expo start --dev-client                  # desenvolvimento (precisa do dev build instalado)
eas build -p android --profile development   # gerar dev build
eas build -p android --profile preview       # APK para uso real
npm test                                     # testes de domínio e componentes
npm run test:rules:emulador                  # testes das Security Rules (sobe o emulador)
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 11. Roadmap

### Fase 0 — Fundação

- [x] Criar projeto Expo com TypeScript, expo-router e expo-dev-client
- [x] Configurar ESLint, Prettier, Jest
- [x] Configurar NativeWind e tema de alto contraste
- [x] Instalar e configurar React Native Firebase (app, auth, firestore) com config plugins
- [x] `src/firebase/init.ts` com cache ilimitado
- [ ] Configurar `eas.json` e gerar o primeiro dev build Android
- [x] Componentes base: Botao, CampoTexto, CampoNumero, CampoData, Card, Aviso, IndicadorSync

### Fase 1 — Conta e fazenda

- [x] Login com Google e contexto de sessão
- [x] Guarda de rotas (login → criar fazenda → app)
- [x] Criação da fazenda com configurações padrão
- [x] `firestore.rules` + testes no emulador
- [x] Logout com aviso de gravações pendentes

### Fase 2 — MVP de manejo

- [x] Cadastro, edição e lista de animais com busca
- [x] `src/domain/reproducao.ts`, `lactacao.ts` e `resumoAnimal.ts` com testes
- [x] Eventos reprodutivos com atualização do resumo em batch
- [x] Lançamento de produção em lote
- [x] Painel com resumo e alertas
- [ ] Testar o app inteiro em modo avião

### Fase 3 — Sanidade e relatórios

- [x] Tratamentos com carência (`carencia.ts` com testes)
- [x] Marcação automática de leite descartado
- [x] Tratamento em vários animais
- [x] Gráficos de produção
- [x] Exportar CSV
- [x] Notificações locais diárias com alertas
- [x] Tela de configurações dos prazos

### Fase 4 — Opcional

- [ ] Convidar funcionário para a fazenda (papel `funcionario` com permissões limitadas)
- [ ] Trocar entre várias fazendas
- [ ] Pesagem de bezerras/novilhas
- [ ] Indicadores (IEP médio, taxa de prenhez)

### Fase 5 — Financeiro

- [x] Preço do leite com vigência e receita do mês (aba Finanças)
- [x] Despesas por categoria, resumo do mês e custo por litro
- [x] Custo no tratamento (vira despesa do animal no mesmo batch)
- [x] Rateio por cabeça-dia (ração de lactação: opção pelos litros) e resultado por animal
- [x] Sugestões automáticas (vaca no prejuízo, custo subindo, preço desatualizado...)
- [x] CSV financeiro

---

## 12. Fora do escopo (por enquanto)

Contabilidade completa (fluxo de caixa, impostos), estoque de insumos, integração com balanças ou coleiras, versão web.
