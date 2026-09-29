import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeletorVariosAnimais } from '@/components/rebanho/SeletorVariosAnimais';
import {
  Aviso,
  Botao,
  CampoData,
  CampoNumero,
  CampoTexto,
  Card,
  Seletor,
  Texto,
} from '@/components/ui';
import { identificacao, situacaoAtual } from '@/domain/animal';
import {
  esquemaTratamento,
  fimCarencia,
  montarTratamento,
  ROTULO_TRATAMENTO,
  TIPOS_TRATAMENTO,
  VIAS_SUGERIDAS,
  type FormularioTratamento,
  type TratamentoValidado,
} from '@/domain/carencia';
import { useContextoGravacao } from '@/features/contexto';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useHoje } from '@/features/hoje';
import { registrarTratamento } from '@/features/tratamentos';
import { useConfirmarDescarte } from '@/lib/confirmarDescarte';
import { dataDeISO, isoParaBR } from '@/lib/datas';
import { formatarReais } from '@/lib/dinheiro';

const OPCOES_TIPO = TIPOS_TRATAMENTO.map((valor) => ({ valor, rotulo: ROTULO_TRATAMENTO[valor] }));

/** Tratamento em um animal (vindo do detalhe) ou em vários de uma vez (vacinação...). */
export default function RegistrarTratamento() {
  const params = useLocalSearchParams<{ animalId?: string }>();
  const contexto = useContextoGravacao();
  const { animais, animalPorId, eventosPorAnimal, tratamentosPorAnimal } = useDadosFazenda();
  const { disponivel } = useFinanceiro();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [salvo, setSalvo] = useState(false);

  const { formState, control, handleSubmit, setError } = useForm<
    FormularioTratamento,
    unknown,
    TratamentoValidado
  >({
    resolver: zodResolver(esquemaTratamento),
    defaultValues: {
      animalIds: params.animalId ? [params.animalId] : [],
      tipo: null,
      data: hoje,
      produto: '',
      dose: '',
      via: '',
      carenciaLeiteDias: 0,
      carenciaCarneDias: 0,
      observacoes: '',
      custo: null,
    },
  });

  const [animalIds, data, leiteDias, custo] = useWatch({
    control,
    name: ['animalIds', 'data', 'carenciaLeiteDias', 'custo'],
  });
  const ativos = useMemo(() => animais.filter((a) => a.status === 'ativo'), [animais]);

  // Vacas em lactação escolhidas cujo leite vai sair do tanque.
  const fimLeite = data && leiteDias ? fimCarencia(data, leiteDias) : null;
  const descartam = fimLeite
    ? animalIds.flatMap((id) => {
        const a = animalPorId.get(id);
        return a && situacaoAtual(a, dataDeISO(hoje)) === 'lactacao' ? [a] : [];
      })
    : [];

  const liberar = useConfirmarDescarte(formState.isDirty);

  const salvar = handleSubmit((form) => {
    if (form.data > hoje) {
      setError('data', { message: 'A data não pode ser no futuro.' });
      return;
    }
    const escolhidos = form.animalIds.flatMap((id) => animalPorId.get(id) ?? []);
    setSalvo(true);
    liberar();
    registrarTratamento(
      contexto,
      escolhidos,
      { eventosPorAnimal, tratamentosPorAnimal },
      montarTratamento(form),
      disponivel ? form.custo : null,
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (router.canGoBack()) router.back();
    else router.replace('/');
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
        <Card>
          <Controller
            control={control}
            name="animalIds"
            render={({ field, fieldState }) => (
              <SeletorVariosAnimais
                animais={ativos}
                selecionados={field.value}
                aoMudar={field.onChange}
                hoje={dataDeISO(hoje)}
                erro={fieldState.error?.message}
              />
            )}
          />
        </Card>

        <Card className="gap-5">
          <Controller
            control={control}
            name="tipo"
            render={({ field, fieldState }) => (
              <Seletor
                rotulo="Tipo"
                opcoes={OPCOES_TIPO}
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="produto"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Produto *"
                placeholder="Nome comercial"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="data"
            render={({ field, fieldState }) => (
              <CampoData
                rotulo="Data da aplicação"
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
                hoje={dataDeISO(hoje)}
              />
            )}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="carenciaLeiteDias"
                render={({ field, fieldState }) => (
                  <CampoNumero
                    rotulo="Carência leite (dias)"
                    decimal={false}
                    valor={field.value}
                    aoMudar={field.onChange}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="carenciaCarneDias"
                render={({ field, fieldState }) => (
                  <CampoNumero
                    rotulo="Carência carne (dias)"
                    decimal={false}
                    valor={field.value}
                    aoMudar={field.onChange}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
          </View>
          <Texto variante="legenda" tom="suave">
            Veja a carência na bula. Use 0 se o produto não tiver.
          </Texto>
        </Card>

        {fimLeite && descartam.length ? (
          <Aviso
            tipo="perigo"
            titulo="Leite fora do tanque"
            mensagem={`${descartam.map(identificacao).join(', ')}: descarte até ${isoParaBR(fimLeite)}. O lançamento da ordenha já vem marcado.`}
          />
        ) : null}

        <Card className="gap-5">
          <View className="flex-row gap-3">
            <View className="w-32">
              <Controller
                control={control}
                name="dose"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    rotulo="Dose"
                    placeholder="Ex.: 10 mL"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="via"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    rotulo="Via"
                    placeholder="Opcional"
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
            name="via"
            render={({ field }) => (
              <View className="-mt-2 flex-row flex-wrap gap-2">
                {VIAS_SUGERIDAS.map((via) => (
                  <Pressable
                    key={via}
                    onPress={() => field.onChange(via)}
                    className={`min-h-12 justify-center rounded-full px-4 active:opacity-70 ${
                      field.value === via ? 'bg-primaria-suave' : 'bg-superficie-2'
                    }`}
                  >
                    <Texto
                      variante="legenda"
                      tom={field.value === via ? 'primaria' : 'suave'}
                      className="text-[13px]"
                    >
                      {via}
                    </Texto>
                  </Pressable>
                ))}
              </View>
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

        {disponivel ? (
          <Card className="gap-2">
            <Controller
              control={control}
              name="custo"
              render={({ field, fieldState }) => (
                <CampoNumero
                  rotulo="Custo total (R$)"
                  placeholder="Opcional"
                  valor={field.value}
                  aoMudar={field.onChange}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Texto variante="legenda" tom="suave">
              {custo && animalIds.length > 1
                ? `Vira uma despesa de tratamentos: ${formatarReais(Math.round((custo * 100) / animalIds.length))} por animal.`
                : 'Vira uma despesa de tratamentos do animal, no financeiro.'}
            </Texto>
          </Card>
        ) : null}

        <Botao
          titulo={animalIds.length > 1 ? `Registrar em ${animalIds.length} animais` : 'Registrar'}
          icone="checkmark"
          onPress={salvar}
          carregando={salvo}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
