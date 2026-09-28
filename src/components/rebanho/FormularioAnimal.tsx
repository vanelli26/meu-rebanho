import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  brincoDisponivel,
  esquemaAnimal,
  ROTULO_STATUS,
  type FormularioAnimal as Formulario,
  type StatusAnimal,
} from '@/domain/animal';
import { useAnimais } from '@/features/animais';

import { Botao, CampoData, CampoTexto, Card, Seletor, Texto, type Opcao } from '../ui';

const OPCOES_SEXO: Opcao<'F' | 'M'>[] = [
  { valor: 'F', rotulo: 'Fêmea' },
  { valor: 'M', rotulo: 'Macho' },
];

const OPCOES_ORIGEM: Opcao<'nascido' | 'comprado'>[] = [
  { valor: 'nascido', rotulo: 'Nasceu aqui' },
  { valor: 'comprado', rotulo: 'Comprado' },
];

const OPCOES_STATUS = (Object.keys(ROTULO_STATUS) as StatusAnimal[]).map((valor) => ({
  valor,
  rotulo: ROTULO_STATUS[valor],
}));

type Props = {
  valoresIniciais: Formulario;
  /** Na edição, o próprio animal não conta como brinco repetido. */
  animalId?: string;
  tituloBotao: string;
  aoSalvar: (dados: Formulario) => void;
};

/** Formulário de cadastro e edição de animal. */
export function FormularioAnimal({ valoresIniciais, animalId, tituloBotao, aoSalvar }: Props) {
  const insets = useSafeAreaInsets();
  const { animais } = useAnimais();
  const nomeRef = useRef<TextInput>(null);
  const edicao = animalId !== undefined;

  const [salvo, setSalvo] = useState(false);
  const { control, handleSubmit, setError } = useForm<Formulario>({
    resolver: zodResolver(esquemaAnimal),
    defaultValues: valoresIniciais,
  });
  const origem = useWatch({ control, name: 'origem' });
  const status = useWatch({ control, name: 'status' });

  const salvar = handleSubmit((dados) => {
    if (!brincoDisponivel(dados.brinco, animais, animalId)) {
      setError(
        'brinco',
        { message: 'Já existe um animal com este brinco.' },
        { shouldFocus: true },
      );
      return;
    }
    setSalvo(true);
    aoSalvar(dados);
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
        <Card className="gap-5">
          <View className="flex-row gap-3">
            <View className="w-32">
              <Controller
                control={control}
                name="brinco"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    ref={field.ref}
                    rotulo="Brinco *"
                    placeholder="123"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus={!edicao}
                    returnKeyType="next"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    onSubmitEditing={() => nomeRef.current?.focus()}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="nome"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    ref={nomeRef}
                    rotulo="Nome"
                    placeholder="Opcional"
                    autoCapitalize="words"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="sexo"
            render={({ field }) => (
              <Seletor
                rotulo="Sexo"
                opcoes={OPCOES_SEXO}
                valor={field.value}
                aoMudar={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="dataNascimento"
            render={({ field, fieldState }) => (
              <CampoData
                rotulo="Data de nascimento"
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="raca"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Raça"
                placeholder="Ex.: Holandesa, Girolando, Jersey"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />
        </Card>

        <Card className="gap-5">
          <Controller
            control={control}
            name="origem"
            render={({ field }) => (
              <Seletor
                rotulo="Origem"
                opcoes={OPCOES_ORIGEM}
                valor={field.value}
                aoMudar={field.onChange}
              />
            )}
          />
          {origem === 'comprado' ? (
            <Controller
              control={control}
              name="dataEntrada"
              render={({ field, fieldState }) => (
                <CampoData
                  rotulo="Data de entrada na fazenda"
                  valor={field.value}
                  aoMudar={field.onChange}
                  erro={fieldState.error?.message}
                />
              )}
            />
          ) : null}
          <Controller
            control={control}
            name="pai"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Pai (touro ou código do sêmen)"
                placeholder="Opcional"
                autoCapitalize="characters"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="observacoes"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Observações"
                placeholder="Opcional"
                multiline
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />
        </Card>

        {edicao ? (
          <Card className="gap-5">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Seletor
                  rotulo="Situação no rebanho"
                  opcoes={OPCOES_STATUS}
                  valor={field.value}
                  aoMudar={field.onChange}
                />
              )}
            />
            {status !== 'ativo' ? (
              <>
                <Controller
                  control={control}
                  name="dataSaida"
                  render={({ field, fieldState }) => (
                    <CampoData
                      rotulo="Data de saída"
                      valor={field.value}
                      aoMudar={field.onChange}
                      erro={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="motivoSaida"
                  render={({ field, fieldState }) => (
                    <CampoTexto
                      rotulo="Motivo"
                      placeholder="Opcional"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      erro={fieldState.error?.message}
                    />
                  )}
                />
              </>
            ) : null}
          </Card>
        ) : null}

        <Botao titulo={tituloBotao} icone="checkmark" onPress={salvar} carregando={salvo} />
        {!edicao ? (
          <Texto variante="legenda" tom="suave" className="text-center">
            Só o brinco é obrigatório. Dá para completar depois.
          </Texto>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
