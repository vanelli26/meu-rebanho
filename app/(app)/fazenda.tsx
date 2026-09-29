import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Aviso, Botao, CampoTexto, Card } from '@/components/ui';
import { esquemaNovaFazenda, type DadosNovaFazenda } from '@/domain/fazenda';
import { editarDadosFazenda } from '@/features/fazenda';
import { useConfirmarDescarte } from '@/lib/confirmarDescarte';

/** Nome, município e UF da fazenda. Só o dono edita. */
export default function DadosFazenda() {
  const { conta, fazenda } = useSessaoPronta();
  const insets = useSafeAreaInsets();
  const municipioRef = useRef<TextInput>(null);
  const ufRef = useRef<TextInput>(null);
  const [salvo, setSalvo] = useState(false);
  const dono = fazenda.membros[conta.uid] === 'dono';

  const { formState, control, handleSubmit } = useForm<DadosNovaFazenda>({
    resolver: zodResolver(esquemaNovaFazenda),
    defaultValues: { nome: fazenda.nome, municipio: fazenda.municipio, uf: fazenda.uf },
  });
  const liberar = useConfirmarDescarte(formState.isDirty);

  const salvar = handleSubmit((dados) => {
    setSalvo(true);
    liberar();
    editarDadosFazenda(fazenda.id, dados);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-fundo"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {!dono ? (
          <Aviso tipo="atencao" titulo="Só o dono da fazenda pode alterar estes dados" />
        ) : null}
        <Card className="gap-5">
          <Controller
            control={control}
            name="nome"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Nome da fazenda"
                icone="home-outline"
                autoCapitalize="words"
                returnKeyType="next"
                editable={dono}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={() => municipioRef.current?.focus()}
                erro={fieldState.error?.message}
              />
            )}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="municipio"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    ref={municipioRef}
                    rotulo="Município"
                    icone="location-outline"
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={dono}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    onSubmitEditing={() => ufRef.current?.focus()}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View className="w-24">
              <Controller
                control={control}
                name="uf"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    ref={ufRef}
                    rotulo="UF"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={2}
                    returnKeyType="done"
                    editable={dono}
                    value={field.value}
                    onChangeText={(texto) => field.onChange(texto.toUpperCase())}
                    onBlur={field.onBlur}
                    onSubmitEditing={salvar}
                    erro={fieldState.error ? 'Inválida' : undefined}
                  />
                )}
              />
            </View>
          </View>
        </Card>
        {dono ? (
          <Botao titulo="Salvar" icone="checkmark" onPress={salvar} carregando={salvo} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
