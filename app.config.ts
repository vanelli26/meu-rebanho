import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Arquivos do Firebase ficam fora do git (ver README). No EAS Build eles chegam
// por variáveis de ambiente do tipo arquivo; localmente, pela raiz do projeto.
// Enquanto não existirem, o app carrega no Metro, mas o prebuild vai falhar.
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
const GOOGLE_SERVICE_INFO_PLIST =
  process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist';

const PACKAGE = 'com.vanelli.meurebanho';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Meu Rebanho',
  slug: 'meu-rebanho',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'meurebanho',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: PACKAGE,
    icon: './assets/expo.icon',
    ...(existsSync(GOOGLE_SERVICE_INFO_PLIST) && {
      googleServicesFile: GOOGLE_SERVICE_INFO_PLIST,
    }),
  },
  android: {
    package: PACKAGE,
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(existsSync(GOOGLE_SERVICES_JSON) && {
      googleServicesFile: GOOGLE_SERVICES_JSON,
    }),
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: { useFrameworks: 'static' },
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
  ],
  owner: 'vanelli',
  extra: {
    eas: { projectId: '37c03376-a6a5-4c9c-ba61-a67c6431952a' },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
