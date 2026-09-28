import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Aviso, Botao, CampoNumero, Card, Texto } from '@/components/ui';
import {
  CONFIGURACOES_PADRAO,
  esquemaConfiguracoes,
  LIMITES_PRAZOS,
  type ConfiguracoesFazenda,
  type FormularioConfiguracoes,
} from '@/domain/fazenda';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { salvarPrazos } from '@/features/fazenda';

const CAMPOS: { campo: keyof ConfiguracoesFazenda; rotulo: string; ajuda: string }[] = [
  {
    campo: 'diasGestacao',
    rotulo: 'Gestação',
    ajuda: 'Do serviço confirmado ao parto. Base da previsão de parto.',
  },
  {
    campo: 'diasSecagemAntesParto',
    rotulo: 'Secagem antes do parto',
    ajuda: 'Quantos dias antes do parto previsto a vaca deve ser seca.',
  },
  {
    campo: 'periodoVoluntarioEspera',
    rotulo: 'Espera após o parto',
    ajuda: 'Dias após o parto até a vaca ficar liberada para inseminar.',
  },
  {
    campo: 'diasDiagnosticoGestacao',
    rotulo: 'Diagnóstico de gestação',
    ajuda: 'Dias após o serviço para o alerta de diagnóstico pendente.',
  },
  {
    campo: 'diasRetornoCio',
    rotulo: 'Retorno de cio',
    ajuda: 'Dias após o serviço para observar se o cio voltou.',
  },
];

export default function Prazos() {
  const { conta, fazenda } = useSessaoPronta();
  const { animais, eventosPorAnimal } = useDadosFazenda();
  const insets = useSafeAreaInsets();
  const [salvo, setSalvo] = useState(false);
  const dono = fazenda.membros[conta.uid] === 'dono';

  const { control, handleSubmit, reset } = useForm<
    FormularioConfiguracoes,
    unknown,
    ConfiguracoesFazenda
  >({
    resolver: zodResolver(esquemaConfiguracoes),
    defaultValues: fazenda.configuracoes,
  });

  const salvar = handleSubmit((config) => {
    setSalvo(true);
    salvarPrazos(fazenda.id, config, animais, eventosPorAnimal);
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
        <Texto tom="suave" className="px-1">
          Usados nas previsões de parto e secagem e nos alertas do Painel. Ao salvar, a situação de
          todas as vacas é recalculada.
        </Texto>
        {!dono ? (
          <Aviso tipo="atencao" titulo="Só o dono da fazenda pode alterar os prazos" />
        ) : null}

        <Card className="gap-5">
          {CAMPOS.map(({ campo, rotulo, ajuda }) => {
            const [min, max] = LIMITES_PRAZOS[campo];
            return (
              <Controller
                key={campo}
                control={control}
                name={campo}
                render={({ field, fieldState }) => (
                  <View className="gap-1">
                    <CampoNumero
                      rotulo={`${rotulo} (dias)`}
                      decimal={false}
                      valor={field.value}
                      aoMudar={field.onChange}
                      erro={fieldState.error?.message}
                      editable={dono}
                    />
                    <Texto variante="legenda" tom="suave">
                      {ajuda} Padrão: {CONFIGURACOES_PADRAO[campo]} ({min}–{max}).
                    </Texto>
                  </View>
                )}
              />
            );
          })}
        </Card>

        {dono ? (
          <>
            <Botao titulo="Salvar prazos" icone="checkmark" onPress={salvar} carregando={salvo} />
            <Botao
              titulo="Voltar ao padrão"
              variante="fantasma"
              onPress={() => reset(CONFIGURACOES_PADRAO)}
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
