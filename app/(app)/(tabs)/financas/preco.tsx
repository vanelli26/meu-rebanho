import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso, Botao, CampoData, CampoNumero, CampoTexto, Card } from '@/components/ui';
import {
  esquemaPrecoLeite,
  precoNaData,
  type FormularioPrecoLeite,
  type PrecoLeiteValidado,
} from '@/domain/precoLeite';
import { useContextoGravacao } from '@/features/contexto';
import { salvarPrecoLeite } from '@/features/financeiro';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useHoje } from '@/features/hoje';
import { dataDeISO, isoParaBR, somarDias } from '@/lib/datas';
import { formatarPrecoLitro } from '@/lib/dinheiro';

export default function NovoPreco() {
  const contexto = useContextoGravacao();
  const { precos } = useFinanceiro();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [salvo, setSalvo] = useState(false);

  const { control, handleSubmit } = useForm<FormularioPrecoLeite, unknown, PrecoLeiteValidado>({
    resolver: zodResolver(esquemaPrecoLeite),
    defaultValues: { inicio: hoje, valorLitro: null, observacao: '' },
  });
  const inicio = useWatch({ control, name: 'inicio' });

  // O que acontece com o preço que valia antes da nova data.
  const anterior = inicio ? precoNaData(precos, somarDias(inicio, -1)) : null;
  const mesmoDia = inicio ? precos.find((p) => p.inicio === inicio) : undefined;

  const salvar = handleSubmit((preco) => {
    setSalvo(true);
    salvarPrecoLeite(contexto, preco);
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Card className="gap-5">
          <Controller
            control={control}
            name="valorLitro"
            render={({ field, fieldState }) => (
              <CampoNumero
                rotulo="Preço por litro (R$)"
                placeholder="Ex.: 2,45"
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
                autoFocus
              />
            )}
          />
          <Controller
            control={control}
            name="inicio"
            render={({ field, fieldState }) => (
              <CampoData
                rotulo="Vale a partir de"
                valor={field.value}
                aoMudar={field.onChange}
                erro={fieldState.error?.message}
                hoje={dataDeISO(hoje)}
              />
            )}
          />
          <Controller
            control={control}
            name="observacao"
            render={({ field, fieldState }) => (
              <CampoTexto
                rotulo="Observação"
                placeholder="Opcional. Ex.: laticínio, bonificação"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />
        </Card>

        {mesmoDia ? (
          <Aviso
            tipo="atencao"
            titulo="Substitui o preço desta data"
            mensagem={`Já existe ${formatarPrecoLitro(mesmoDia.valorLitro)}/L começando em ${isoParaBR(mesmoDia.inicio)}.`}
          />
        ) : anterior && inicio ? (
          <Aviso
            titulo="O preço anterior perde a vigência"
            mensagem={`${formatarPrecoLitro(anterior.valorLitro)}/L passa a valer até ${isoParaBR(somarDias(inicio, -1))}.`}
          />
        ) : null}

        <Botao titulo="Salvar preço" icone="checkmark" onPress={salvar} carregando={salvo} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
