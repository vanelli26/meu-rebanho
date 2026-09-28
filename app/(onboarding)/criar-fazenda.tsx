import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, type TextInput } from 'react-native';

import { useSessao } from '@/auth/SessaoProvider';
import { Aviso, Botao, CampoTexto } from '@/components/ui';
import { esquemaNovaFazenda, type DadosNovaFazenda } from '@/domain/fazenda';
import { criarFazenda } from '@/features/fazenda';

export default function CriarFazenda() {
  const sessao = useSessao();
  const municipioRef = useRef<TextInput>(null);
  const ufRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<DadosNovaFazenda>({
    resolver: zodResolver(esquemaNovaFazenda),
    defaultValues: { nome: '', municipio: '', uf: '' },
  });

  // Grava e segue: a guarda de rotas abre o app quando o onSnapshot mostrar a fazenda.
  const salvar = handleSubmit((dados) => {
    if (sessao.estado !== 'sem-fazenda') return;
    criarFazenda(dados, sessao.conta);
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Sua fazenda' }} />
      <ScrollView contentContainerClassName="gap-5 p-5" keyboardShouldPersistTaps="handled">
        <Text className="text-lg text-texto-suave">
          Para começar, informe os dados da fazenda. Dá para mudar depois.
        </Text>

        <Controller
          control={control}
          name="nome"
          render={({ field, fieldState }) => (
            <CampoTexto
              rotulo="Nome da fazenda"
              placeholder="Ex.: Sítio Boa Vista"
              autoCapitalize="words"
              returnKeyType="next"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => municipioRef.current?.focus()}
              erro={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="municipio"
          render={({ field, fieldState }) => (
            <CampoTexto
              ref={municipioRef}
              rotulo="Município"
              placeholder="Ex.: Castro"
              autoCapitalize="words"
              returnKeyType="next"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={() => ufRef.current?.focus()}
              erro={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="uf"
          render={({ field, fieldState }) => (
            <CampoTexto
              ref={ufRef}
              rotulo="UF"
              placeholder="Ex.: PR"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={2}
              returnKeyType="done"
              value={field.value}
              onChangeText={(texto) => field.onChange(texto.toUpperCase())}
              onBlur={field.onBlur}
              onSubmitEditing={salvar}
              erro={fieldState.error?.message}
            />
          )}
        />

        <Botao titulo="Criar fazenda" onPress={salvar} disabled={formState.isSubmitSuccessful} />
        {formState.isSubmitSuccessful ? <Aviso tipo="info" titulo="Criando fazenda…" /> : null}
      </ScrollView>
    </>
  );
}
