import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { SeletorAnimal } from '@/components/rebanho/SeletorAnimal';
import { ESTILO_EVENTO } from '@/components/reproducao/estiloEvento';
import { Aviso, Botao, CampoData, CampoTexto, Card, Seletor, Texto } from '@/components/ui';
import { brincoDisponivel, nomeDisponivel, type Animal, type ResumoAnimal } from '@/domain/animal';
import {
  esquemaEvento,
  ROTULO_EVENTO,
  TIPOS_EVENTO,
  validarEventoNaData,
  type EventoValidado,
  type FormularioEvento,
  type TipoEvento,
} from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { useContextoGravacao } from '@/features/contexto';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { registrarEvento } from '@/features/eventos';
import { useHoje } from '@/features/hoje';
import { dataDeISO, isoParaBR, somarDias, type DataISO } from '@/lib/datas';
import { useTema } from '@/lib/tema';

export default function RegistrarEvento() {
  const params = useLocalSearchParams<{ animalId?: string }>();
  const { fazenda } = useSessaoPronta();
  const contexto = useContextoGravacao();
  const { animais, animalPorId, eventosPorAnimal } = useDadosFazenda();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [salvo, setSalvo] = useState(false);

  const { control, handleSubmit, setError, setValue, clearErrors } = useForm<
    FormularioEvento,
    unknown,
    EventoValidado
  >({
    resolver: zodResolver(esquemaEvento),
    defaultValues: {
      animalId: params.animalId ?? '',
      tipo: null,
      data: hoje,
      touroSemen: '',
      responsavel: '',
      observacoes: '',
      cria: { cadastrar: true, brinco: '', nome: '', sexo: 'F' },
    },
  });

  const [animalId, tipo, data, cadastrarCria] = useWatch({
    control,
    name: ['animalId', 'tipo', 'data', 'cria.cadastrar'],
  });
  const animal = animalPorId.get(animalId) ?? null;
  const eventos = useMemo(
    () => (animalId ? (eventosPorAnimal.get(animalId) ?? []) : []),
    [eventosPorAnimal, animalId],
  );
  const femeasAtivas = useMemo(
    () => animais.filter((a) => a.sexo === 'F' && a.status === 'ativo'),
    [animais],
  );

  // Prévia do resumo com o novo evento, para mostrar o que vai mudar.
  const previa = useMemo(() => {
    if (!animal || !tipo || !data) return null;
    const novo = {
      id: 'novo',
      data,
      tipo,
      touroSemen: '',
      responsavel: '',
      criaId: null,
      observacoes: '',
    };
    return calcularResumo(animal, [...eventos, novo], fazenda.configuracoes, dataDeISO(hoje));
  }, [animal, tipo, data, eventos, fazenda.configuracoes, hoje]);

  const salvar = handleSubmit((form) => {
    if (!animal) return;
    const erroData = validarEventoNaData(form.data, hoje, animal);
    if (erroData) {
      setError('data', { message: erroData });
      return;
    }
    const cria = form.tipo === 'parto' && form.cria.cadastrar ? form.cria : null;
    if (cria) {
      const nomeLivre = nomeDisponivel(cria.nome, animais);
      const brincoLivre = brincoDisponivel(cria.brinco, animais);
      if (!nomeLivre) setError('cria.nome', { message: 'Já existe um animal com este nome.' });
      if (!brincoLivre)
        setError('cria.brinco', { message: 'Já existe um animal com este brinco.' });
      if (!nomeLivre || !brincoLivre) return;
    }
    setSalvo(true);
    registrarEvento(contexto, animal, eventos, { ...form, tipo: form.tipo }, cria);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (router.canGoBack()) router.back();
    else router.replace('/rebanho');
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
        contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
      >
        <Card>
          <Controller
            control={control}
            name="animalId"
            render={({ fieldState }) => (
              <SeletorAnimal
                animais={femeasAtivas}
                selecionado={animal}
                hoje={dataDeISO(hoje)}
                erro={fieldState.error?.message}
                aoSelecionar={(a) => {
                  setValue('animalId', a?.id ?? '');
                  clearErrors('animalId');
                }}
              />
            )}
          />
        </Card>

        {animal ? (
          <>
            <Card>
              <Controller
                control={control}
                name="tipo"
                render={({ field, fieldState }) => (
                  <GradeTipos
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
            </Card>

            {tipo ? (
              <Card className="gap-5">
                {tipo === 'inseminacao' || tipo === 'cobertura' ? (
                  <Controller
                    control={control}
                    name="touroSemen"
                    render={({ field, fieldState }) => (
                      <CampoTexto
                        rotulo={tipo === 'inseminacao' ? 'Sêmen (touro ou código)' : 'Touro'}
                        placeholder="Opcional"
                        autoCapitalize="characters"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        erro={fieldState.error?.message}
                      />
                    )}
                  />
                ) : null}
                {tipo === 'inseminacao' || tipo.startsWith('diagnostico') ? (
                  <Controller
                    control={control}
                    name="responsavel"
                    render={({ field, fieldState }) => (
                      <CampoTexto
                        rotulo={tipo === 'inseminacao' ? 'Inseminador' : 'Veterinário'}
                        placeholder="Opcional"
                        autoCapitalize="words"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        erro={fieldState.error?.message}
                      />
                    )}
                  />
                ) : null}
                {tipo === 'parto' ? (
                  <SecaoCria control={control} cadastrar={cadastrarCria} />
                ) : null}
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
            ) : null}

            {tipo && data && previa ? (
              <AvisoConsequencia
                tipo={tipo}
                data={data}
                animal={animal}
                previa={previa}
                diasDiagnostico={fazenda.configuracoes.diasDiagnosticoGestacao}
                diasRetornoCio={fazenda.configuracoes.diasRetornoCio}
              />
            ) : null}

            <Botao titulo="Registrar" icone="checkmark" onPress={salvar} carregando={salvo} />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GradeTipos({
  valor,
  aoMudar,
  erro,
}: {
  valor: TipoEvento | null;
  aoMudar: (tipo: TipoEvento) => void;
  erro?: string;
}) {
  const { cores } = useTema();
  return (
    <View className="gap-2" accessibilityRole="radiogroup">
      <Texto variante="rotulo" tom="suave">
        Tipo de evento
      </Texto>
      <View className="flex-row flex-wrap gap-2">
        {TIPOS_EVENTO.map((t) => {
          const estilo = ESTILO_EVENTO[t];
          const ativo = valor === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              onPress={() => {
                void Haptics.selectionAsync();
                aoMudar(t);
              }}
              style={{ width: '48.5%' }}
              className={`min-h-14 flex-row items-center gap-2 rounded-2xl border-[1.5px] px-3 active:opacity-70 ${
                ativo ? 'border-primaria bg-primaria-suave' : 'border-borda bg-superficie'
              }`}
            >
              <Ionicons name={estilo.icone} size={20} color={cores[estilo.cor]} />
              <Texto variante="rotulo" className="flex-1 text-[13px]" numberOfLines={2}>
                {ROTULO_EVENTO[t]}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      {erro ? (
        <Texto variante="legenda" tom="perigo">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

function SecaoCria({
  control,
  cadastrar,
}: {
  control: ReturnType<typeof useForm<FormularioEvento, unknown, EventoValidado>>['control'];
  cadastrar: boolean;
}) {
  return (
    <View className="gap-4 rounded-2xl bg-superficie-2 p-4">
      <Controller
        control={control}
        name="cria.cadastrar"
        render={({ field }) => (
          <Seletor
            rotulo="Cadastrar a cria?"
            opcoes={[
              { valor: 'sim', rotulo: 'Cadastrar agora' },
              { valor: 'nao', rotulo: 'Agora não' },
            ]}
            valor={field.value ? 'sim' : 'nao'}
            aoMudar={(v) => field.onChange(v === 'sim')}
          />
        )}
      />
      {cadastrar ? (
        <>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="cria.nome"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    rotulo="Nome *"
                    autoCapitalize="words"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    erro={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View className="w-32">
              <Controller
                control={control}
                name="cria.brinco"
                render={({ field, fieldState }) => (
                  <CampoTexto
                    rotulo="Brinco *"
                    autoCapitalize="characters"
                    autoCorrect={false}
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
            name="cria.sexo"
            render={({ field }) => (
              <Seletor
                rotulo="Sexo da cria"
                opcoes={[
                  { valor: 'F', rotulo: 'Fêmea' },
                  { valor: 'M', rotulo: 'Macho' },
                ]}
                valor={field.value}
                aoMudar={field.onChange}
              />
            )}
          />
        </>
      ) : null}
    </View>
  );
}

/** Explica o efeito do evento antes de salvar (previsões, mudança de situação). */
function AvisoConsequencia({
  tipo,
  data,
  animal,
  previa,
  diasDiagnostico,
  diasRetornoCio,
}: {
  tipo: TipoEvento;
  data: DataISO;
  animal: Animal;
  previa: ResumoAnimal;
  diasDiagnostico: number;
  diasRetornoCio: number;
}) {
  const r = animal.resumo;
  switch (tipo) {
    case 'inseminacao':
    case 'cobertura':
      return (
        <Aviso
          titulo="Próximos passos"
          mensagem={`Observar retorno de cio por volta de ${isoParaBR(somarDias(data, diasRetornoCio))}. Diagnóstico de gestação a partir de ${isoParaBR(somarDias(data, diasDiagnostico))}.`}
        />
      );
    case 'diagnostico_positivo':
      return previa.previsaoParto ? (
        <Aviso
          tipo="sucesso"
          titulo={`Parto previsto para ${isoParaBR(previa.previsaoParto)}`}
          mensagem={
            previa.previsaoSecagem
              ? `Secar por volta de ${isoParaBR(previa.previsaoSecagem)}.`
              : undefined
          }
        />
      ) : (
        <Aviso
          tipo="atencao"
          titulo="Sem inseminação ou cobertura registrada"
          mensagem="A vaca ficará prenhe, mas sem previsão de parto. Registre o serviço antes, se souber a data."
        />
      );
    case 'diagnostico_negativo':
      return r.servicoSemDiagnostico || r.prenhe ? null : (
        <Aviso tipo="atencao" titulo="Não há serviço aguardando diagnóstico" />
      );
    case 'parto':
      return (
        <Aviso
          tipo="sucesso"
          titulo={`${previa.numeroPartos}º parto`}
          mensagem="A vaca passa para lactação e entra na lista da ordenha."
        />
      );
    case 'secagem':
      return r.situacao === 'lactacao' ? (
        <Aviso titulo="A vaca passa para seca" mensagem="Sai da lista da ordenha." />
      ) : (
        <Aviso tipo="atencao" titulo="Esta vaca não está em lactação" />
      );
    default:
      return null;
  }
}
