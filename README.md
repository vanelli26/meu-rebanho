# Meu Rebanho

App mobile offline-first para gestão de gado leiteiro (Expo + React Native Firebase).
Convenções e roadmap: ver [CLAUDE.md](CLAUDE.md).

## Requisitos

- Node 22+
- Conta Expo e EAS CLI: `npm i -g eas-cli` e `eas login`
- Firebase CLI: `npm i -g firebase-tools` e `firebase login`
- Java 17 (para os emuladores do Firebase)

## Configuração do Firebase (uma vez)

O app usa o SDK nativo do Firebase. Ele **não roda no Expo Go** e o build falha sem os arquivos abaixo.

1. **Criar projeto** em <https://console.firebase.google.com> (ex.: `meu-rebanho`).
2. **Firestore:** Build > Firestore Database > Criar banco em modo produção, região **`southamerica-east1` (São Paulo)**. A região não pode ser mudada depois.
3. **Authentication:** Build > Authentication > Começar > Método de login **Google** > Ativar. Defina o e-mail de suporte.
4. **App Android:** Configurações do projeto > Adicionar app > Android.
   - Nome do pacote: `com.vanelli.meurebanho`
   - SHA-1: adicione as impressões dos dois keystores:
     - Debug local: `cd android && ./gradlew signingReport` (depois de um `npx expo prebuild`), ou `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`
     - EAS: `eas credentials -p android`. Mostra o SHA-1 do keystore gerado pelo EAS. Gere-o no primeiro `eas build`.
   - Baixe o **`google-services.json`** e coloque na raiz do projeto.
   - Sempre que adicionar um SHA-1 novo, baixe o `google-services.json` de novo.
5. **App iOS** (opcional): adicione um app iOS com bundle ID `com.vanelli.meurebanho` e coloque o **`GoogleService-Info.plist`** na raiz.
6. **Web client ID:** Authentication > Método de login > Google > Configuração do SDK da Web > **ID do cliente da Web**.
   Copie `.env.example` para `.env` e preencha `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   No EAS, cadastre a mesma variável: `eas env:set --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <id> --environment development --environment preview --visibility plaintext`.

`google-services.json`, `GoogleService-Info.plist` e `.env` estão no `.gitignore`.
O EAS Build não recebe arquivos ignorados pelo git. Envie-os como variáveis de ambiente do tipo arquivo, que o `app.config.ts` lê:

```bash
eas env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment development --environment preview --environment production --visibility secret
```

Ao baixar um `google-services.json` novo, rode o mesmo `eas env:set` de novo.

## Desenvolvimento

```bash
npm install
eas build -p android --profile development   # gera o dev build; instale o APK no celular
npm start                                     # inicia o Metro para o dev build
```

Com Android Studio instalado, também dá para rodar localmente: `npm run android`.

## Qualidade

```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run test:rules:emulador   # Security Rules no emulador (precisa de Java)
```

Publicar regras e índices: `firebase deploy --only firestore:rules,firestore:indexes`

> Publique as regras e os índices antes de usar a Fase 2: a lista de eventos da fazenda usa uma consulta de grupo de coleção (`eventos` por `fazendaId`) que falha sem o índice.

## Build para uso real

```bash
eas build -p android --profile preview   # APK instalável
```
