import { Stack } from 'expo-router';

import { opcoesCabecalho } from '@/lib/tema';

export default function OnboardingLayout() {
  return <Stack screenOptions={opcoesCabecalho} />;
}
