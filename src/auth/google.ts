import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as sairDoFirebase,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { auth } from '@/firebase/init';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export type ResultadoLogin = { ok: true } | { ok: false; mensagem: string | null };

/** Login com Google. `mensagem: null` quando o usuário só cancelou. */
export async function entrarComGoogle(): Promise<ResultadoLogin> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const resposta = await GoogleSignin.signIn();
    if (!isSuccessResponse(resposta)) return { ok: false, mensagem: null };

    const { idToken } = resposta.data;
    if (!idToken) throw new Error('Google não retornou idToken. Confira o webClientId.');

    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return { ok: true };
  } catch (erro) {
    console.error('[login] Falha no login com Google:', erro);
    return { ok: false, mensagem: mensagemDeErro(erro) };
  }
}

function mensagemDeErro(erro: unknown): string | null {
  if (isErrorWithCode(erro)) {
    switch (erro.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return null;
      case statusCodes.IN_PROGRESS:
        return 'O login já está em andamento.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Atualize o Google Play Services para entrar.';
      case 'auth/network-request-failed':
        return 'Sem internet. O primeiro acesso precisa de conexão.';
    }
  }
  return 'Não foi possível entrar. Verifique a internet e tente de novo.';
}

export async function sair(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (erro) {
    console.error('[login] Falha ao sair do Google:', erro);
  }
  await sairDoFirebase(auth);
}
