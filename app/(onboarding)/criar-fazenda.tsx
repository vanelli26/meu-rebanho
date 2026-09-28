import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessao } from '@/auth/SessaoProvider';
import { Paisagem } from '@/components/marca/Paisagem';
import { SeloLogo } from '@/components/marca/SeloLogo';
import { Aviso, Botao, CampoTexto, Card, Texto } from '@/components/ui';
import { esquemaNovaFazenda, type DadosNovaFazenda } from '@/domain/fazenda';
import { criarFazenda } from '@/features/fazenda';
import { marca } from '@/lib/tema';

export default function CriarFazenda() {
  const sessao = useSessao();
  const insets = useSafeAreaInsets();
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

  const primeiroNome = sessao.estado === 'sem-fazenda' ? sessao.conta.nome.split(' ')[0] : '';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-fundo"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        <LinearGradient
          colors={[marca.verdeClaro, marca.verdeEscuro]}
          style={{ paddingTop: insets.top + 24, paddingBottom: 72, overflow: 'hidden' }}
        >
          <Paisagem altura={120} />
          <View className="gap-4 px-6">
            <SeloLogo tamanho={64} />
            <View className="gap-1">
              <Texto variante="subtitulo" tom="dourado">
                {primeiroNome ? `Olá, ${primeiroNome}!` : 'Bem-vindo!'}
              </Texto>
              <Texto variante="display" tom="creme">
                Vamos cadastrar{'\n'}sua fazenda
              </Texto>
            </View>
          </View>
        </LinearGradient>

        <View className="-mt-12 gap-4 px-4">
          <Card className="gap-5">
            <Controller
              control={control}
              name="nome"
              render={({ field, fieldState }) => (
                <CampoTexto
                  rotulo="Nome da fazenda"
                  icone="home-outline"
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
              </View>
              <View className="w-24">
                <Controller
                  control={control}
                  name="uf"
                  render={({ field, fieldState }) => (
                    <CampoTexto
                      ref={ufRef}
                      rotulo="UF"
                      placeholder="PR"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={2}
                      returnKeyType="done"
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

          <View className="gap-3">
            <Botao
              titulo="Criar fazenda"
              icone="arrow-forward"
              onPress={salvar}
              carregando={formState.isSubmitSuccessful}
            />
            {formState.isSubmitSuccessful ? (
              <Aviso tipo="sucesso" titulo="Preparando sua fazenda…" />
            ) : (
              <Texto variante="legenda" tom="suave" className="text-center">
                Dá para mudar esses dados depois, em Mais.
              </Texto>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
