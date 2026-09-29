import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { Botao, Card, Texto } from '@/components/ui';
import { vigencias, type Vigencia } from '@/domain/precoLeite';
import { useContextoGravacao } from '@/features/contexto';
import { excluirPrecoLeite } from '@/features/financeiro';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useHoje } from '@/features/hoje';
import { isoParaBR } from '@/lib/datas';
import { formatarPrecoLitro } from '@/lib/dinheiro';

/** Histórico de preços: cada um vale do início até a véspera do seguinte. */
export default function Precos() {
  const contexto = useContextoGravacao();
  const { carregando, precos } = useFinanceiro();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const lista = vigencias(precos);

  const confirmarExclusao = (v: Vigencia) => {
    Alert.alert(
      `Excluir o preço de ${formatarPrecoLitro(v.valorLitro)}?`,
      `Início em ${isoParaBR(v.inicio)}. O preço anterior volta a valer até o próximo, e a receita é recalculada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirPrecoLeite(contexto, v.inicio),
        },
      ],
    );
  };

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
    >
      <Botao
        titulo="Novo preço"
        icone="add-circle"
        onPress={() => router.push('/financas/preco')}
      />
      <Texto variante="legenda" tom="suave" className="px-1">
        O preço novo passa a valer na data de início e encerra o anterior na véspera. O histórico
        fica guardado para a receita dos meses passados continuar certa.
      </Texto>

      {lista.length ? (
        <Card className="gap-0 p-0">
          {lista.map((v, i) => {
            const vigente = v.inicio <= hoje && (!v.fim || v.fim >= hoje);
            const futuro = v.inicio > hoje;
            return (
              <Pressable
                key={v.id}
                onLongPress={() => confirmarExclusao(v)}
                accessibilityHint="Segure para excluir"
                className={`min-h-16 flex-row items-center gap-3 px-5 py-3 active:opacity-70 ${
                  i ? 'border-t border-borda' : ''
                }`}
              >
                <View className="flex-1 gap-0.5">
                  <Texto variante="subtitulo" tom={vigente ? 'primaria' : 'normal'}>
                    {formatarPrecoLitro(v.valorLitro)}/L
                  </Texto>
                  <Texto variante="legenda" tom="suave">
                    {v.fim
                      ? `${isoParaBR(v.inicio)} a ${isoParaBR(v.fim)}`
                      : `Desde ${isoParaBR(v.inicio)}`}
                    {v.observacao ? ` · ${v.observacao}` : ''}
                  </Texto>
                </View>
                {vigente || futuro ? (
                  <View
                    className={`rounded-full px-3 py-1 ${vigente ? 'bg-primaria-suave' : 'bg-destaque-suave'}`}
                  >
                    <Texto variante="legenda" tom={vigente ? 'primaria' : 'normal'}>
                      {vigente ? 'Vigente' : 'A partir de ' + isoParaBR(v.inicio).slice(0, 5)}
                    </Texto>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card>
          <Texto tom="suave">{carregando ? 'Carregando…' : 'Nenhum preço cadastrado ainda.'}</Texto>
        </Card>
      )}
      {lista.length ? (
        <Texto variante="legenda" tom="suave" className="px-1">
          Lançou errado? Segure o preço para excluir.
        </Texto>
      ) : null}
    </ScrollView>
  );
}
