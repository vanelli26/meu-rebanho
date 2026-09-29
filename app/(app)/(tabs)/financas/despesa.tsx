import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICONE_CATEGORIA } from '@/components/financas/estiloCategoria';
import { NaoEncontrado } from '@/components/NaoEncontrado';
import { SeletorVariosAnimais } from '@/components/rebanho/SeletorVariosAnimais';
import { Botao, CampoData, CampoNumero, CampoTexto, Card, Seletor, Texto } from '@/components/ui';
import {
  CATEGORIAS_ALIMENTACAO,
  CATEGORIAS_DESPESA,
  esquemaDespesa,
  formularioDaDespesa,
  GRUPO_SUGERIDO,
  montarDespesa,
  ROTULO_CATEGORIA,
  ROTULO_GRUPO,
  UNIDADES,
  type Despesa,
  type DespesaValidada,
  type FormularioDespesa,
  type GrupoDestino,
} from '@/domain/despesas';
import { useAnimais } from '@/features/animais';
import { useContextoGravacao } from '@/features/contexto';
import { excluirDespesa, salvarDespesa } from '@/features/financeiro';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useHoje } from '@/features/hoje';
import { dataDeISO } from '@/lib/datas';
import { formatarPrecoLitro } from '@/lib/dinheiro';
import { useTema } from '@/lib/tema';

const OPCOES_GRUPO = (Object.keys(ROTULO_GRUPO) as GrupoDestino[]).map((valor) => ({
  valor,
  rotulo: ROTULO_GRUPO[valor],
}));
const OPCOES_UNIDADE = UNIDADES.map((valor) => ({ valor, rotulo: valor }));

/** Lançar (sem `id`) ou editar uma despesa. */
export default function TelaDespesa() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { carregando, despesas } = useFinanceiro();
  const existente = id ? despesas.find((d) => d.id === id) : undefined;
  if (id && !existente) return carregando ? null : <NaoEncontrado />;
  return <EditorDespesa key={existente?.id ?? 'nova'} existente={existente ?? null} />;
}

function EditorDespesa({ existente }: { existente: Despesa | null }) {
  const contexto = useContextoGravacao();
  const { animais } = useAnimais();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [salvo, setSalvo] = useState(false);

  const { control, handleSubmit, setValue } = useForm<FormularioDespesa, unknown, DespesaValidada>({
    resolver: zodResolver(esquemaDespesa),
    defaultValues: existente
      ? formularioDaDespesa(existente)
      : {
          categoria: null,
          data: hoje,
          valor: null,
          descricao: '',
          quantidade: null,
          unidade: 'kg',
          grupo: 'rebanho',
          animalIds: [],
          porLitros: false,
        },
  });
  const [categoria, grupo, valor, quantidade, unidade] = useWatch({
    control,
    name: ['categoria', 'grupo', 'valor', 'quantidade', 'unidade'],
  });
  const ativos = useMemo(() => animais.filter((a) => a.status === 'ativo'), [animais]);

  const salvar = handleSubmit((form) => {
    setSalvo(true);
    salvarDespesa(contexto, existente?.id ?? null, montarDespesa(form, existente?.tratamentoId));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  });

  const excluir = () => {
    if (!existente) return;
    Alert.alert('Excluir esta despesa?', 'Ela sai do resumo do mês e do rateio.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluirDespesa(contexto, existente.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-fundo"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: existente ? 'Editar despesa' : 'Lançar despesa' }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Card>
          <Controller
            control={control}
            name="categoria"
            render={({ field, fieldState }) => (
              <View className="gap-2" accessibilityRole="radiogroup">
                <Texto variante="rotulo" tom="suave">
                  Categoria
                </Texto>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIAS_DESPESA.map((c) => {
                    const ativo = field.value === c;
                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: ativo }}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          field.onChange(c);
                          // Sugere para quem é, só em despesa nova.
                          if (!existente) setValue('grupo', GRUPO_SUGERIDO[c]);
                        }}
                        style={{ width: '48.5%' }}
                        className={`min-h-14 flex-row items-center gap-2 rounded-2xl border-[1.5px] px-3 active:opacity-70 ${
                          ativo ? 'border-primaria bg-primaria-suave' : 'border-borda bg-superficie'
                        }`}
                      >
                        <Ionicons name={ICONE_CATEGORIA[c]} size={20} color={cores.primaria} />
                        <Texto variante="rotulo" className="flex-1 text-[13px]" numberOfLines={2}>
                          {ROTULO_CATEGORIA[c]}
                        </Texto>
                      </Pressable>
                    );
                  })}
                </View>
                {fieldState.error ? (
                  <Texto variante="legenda" tom="perigo">
                    {fieldState.error.message}
                  </Texto>
                ) : null}
              </View>
            )}
          />
        </Card>

        <Card className="gap-5">
          <Controller
            control={control}
            name="valor"
            render={({ field, fieldState }) => (
              <CampoNumero
                rotulo="Valor total (R$)"
                placeholder="Ex.: 1.250,00"
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="data"
            render={({ field, fieldState }) => (
              <CampoData
                rotulo="Data"
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
                hoje={dataDeISO(hoje)}
              />
            )}
          />
          <Controller
            control={control}
            name="descricao"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Descrição"
                placeholder="Opcional. Ex.: ração 22%, diesel do trator"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />
          <View className="flex-row gap-3">
            <View className="w-36">
              <Controller
                control={control}
                name="quantidade"
                render={({ field, fieldState }) => (
                  <CampoNumero
                    rotulo="Quantidade"
                    placeholder="Opcional"
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
                name="unidade"
                render={({ field }) => (
                  <Seletor
                    rotulo="Unidade"
                    opcoes={OPCOES_UNIDADE}
                    valor={field.value}
                    aoMudar={field.onChange}
                    rolavel
                  />
                )}
              />
            </View>
          </View>
          {valor && quantidade ? (
            <Texto variante="legenda" tom="suave">
              {formatarPrecoLitro(valor / quantidade)} por {unidade ?? 'un'}
            </Texto>
          ) : null}
        </Card>

        <Card className="gap-4">
          <Controller
            control={control}
            name="grupo"
            render={({ field }) => (
              <Seletor
                rotulo="Para quem é"
                opcoes={OPCOES_GRUPO}
                valor={field.value}
                aoMudar={field.onChange}
              />
            )}
          />
          {grupo === 'animais' ? (
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
          ) : null}
          {grupo === 'lactacao' && categoria && CATEGORIAS_ALIMENTACAO.includes(categoria) ? (
            <Controller
              control={control}
              name="porLitros"
              render={({ field }) => (
                <Seletor
                  rotulo="Como dividir entre as vacas"
                  opcoes={[
                    { valor: 'cabeca', rotulo: 'Igual por cabeça' },
                    { valor: 'litros', rotulo: 'Pelos litros' },
                  ]}
                  valor={field.value ? 'litros' : 'cabeca'}
                  aoMudar={(v) => field.onChange(v === 'litros')}
                />
              )}
            />
          ) : null}
          <Texto variante="legenda" tom="suave">
            {grupo === 'animais'
              ? 'O valor é dividido igualmente entre os animais escolhidos.'
              : `O valor é dividido entre ${ROTULO_GRUPO[grupo].toLowerCase()} pelos dias de cada animal no mês${
                  grupo === 'lactacao' ? ' (ou pelos litros produzidos, se escolhido)' : ''
                }.`}
          </Texto>
        </Card>

        {existente?.tratamentoId ? (
          <Aviso
            titulo="Custo de um tratamento"
            mensagem="Criada ao registrar o tratamento. Excluir o tratamento de um animal também tira a parte dele daqui."
          />
        ) : null}
        <Botao titulo="Salvar" icone="checkmark" onPress={salvar} carregando={salvo} />
        {existente ? (
          <Botao
            titulo="Excluir despesa"
            variante="perigo"
            icone="trash-outline"
            onPress={excluir}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
