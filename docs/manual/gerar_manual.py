"""Gera docs/Manual-Meu-Rebanho.pdf. Uso: python3 docs/manual/gerar_manual.py (requer reportlab)."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / "docs" / "Manual-Meu-Rebanho.pdf"
ICONE = RAIZ / "assets" / "images" / "icon.png"
FONTES = RAIZ / "node_modules" / "@expo-google-fonts" / "plus-jakarta-sans"

# Identidade "Campo premium" (src/lib/tema.ts)
VERDE = colors.HexColor("#1F4D3A")
VERDE_ESCURO = colors.HexColor("#173A2C")
VERDE_SUAVE = colors.HexColor("#E3EDE6")
CREME = colors.HexColor("#F7F4EC")
DOURADO = colors.HexColor("#C9A227")
DOURADO_SUAVE = colors.HexColor("#F6EDCF")
TEXTO = colors.HexColor("#1C1F1D")
SUAVE = colors.HexColor("#5E655F")
BORDA = colors.HexColor("#E3DDCD")
SUPERFICIE2 = colors.HexColor("#EFEBE0")
PERIGO = colors.HexColor("#B3261E")
PERIGO_SUAVE = colors.HexColor("#FBE9E7")
ATENCAO = colors.HexColor("#9A6412")
ATENCAO_SUAVE = colors.HexColor("#FDF3DC")
INFO = colors.HexColor("#2D6A8F")
INFO_SUAVE = colors.HexColor("#E3EFF6")

for nome, pasta in [
    ("Jakarta", "400Regular/PlusJakartaSans_400Regular.ttf"),
    ("Jakarta-Medio", "500Medium/PlusJakartaSans_500Medium.ttf"),
    ("Jakarta-Semi", "600SemiBold/PlusJakartaSans_600SemiBold.ttf"),
    ("Jakarta-Negrito", "700Bold/PlusJakartaSans_700Bold.ttf"),
    ("Jakarta-Extra", "800ExtraBold/PlusJakartaSans_800ExtraBold.ttf"),
    ("Jakarta-Italico", "400Regular_Italic/PlusJakartaSans_400Regular_Italic.ttf"),
]:
    pdfmetrics.registerFont(TTFont(nome, str(FONTES / pasta)))
pdfmetrics.registerFontFamily(
    "Jakarta", normal="Jakarta", bold="Jakarta-Negrito", italic="Jakarta-Italico",
    boldItalic="Jakarta-Negrito",
)

LARGURA, ALTURA = A4
MARGEM = 20 * mm
UTIL = LARGURA - 2 * MARGEM

# ---------------------------------------------------------------------------
# Estilos

corpo = ParagraphStyle("corpo", fontName="Jakarta", fontSize=10, leading=15.5, textColor=TEXTO,
                       spaceAfter=6)
corpo_suave = ParagraphStyle("suave", parent=corpo, textColor=SUAVE, fontSize=9, leading=13)
lista = ParagraphStyle("lista", parent=corpo, leftIndent=14, bulletIndent=2, spaceAfter=3)
h1 = ParagraphStyle("h1", fontName="Jakarta-Extra", fontSize=24, leading=29, textColor=VERDE,
                    spaceAfter=4)
h2 = ParagraphStyle("h2", fontName="Jakarta-Negrito", fontSize=14, leading=19, textColor=VERDE,
                    spaceBefore=12, spaceAfter=6)
h3 = ParagraphStyle("h3", fontName="Jakarta-Semi", fontSize=11, leading=15, textColor=TEXTO,
                    spaceBefore=8, spaceAfter=4)
celula = ParagraphStyle("celula", fontName="Jakarta", fontSize=9, leading=12.5, textColor=TEXTO)
celula_cab = ParagraphStyle("celula_cab", parent=celula, fontName="Jakarta-Negrito",
                            textColor=CREME)
toc1 = ParagraphStyle("toc1", fontName="Jakarta-Semi", fontSize=11, leading=20, textColor=TEXTO)
toc2 = ParagraphStyle("toc2", fontName="Jakarta", fontSize=9.5, leading=15, textColor=SUAVE,
                      leftIndent=16)


# ---------------------------------------------------------------------------
# Blocos


class TituloCapitulo(Flowable):
    """Número dourado grande + título, com registro no sumário."""

    def __init__(self, numero, titulo, subtitulo=""):
        super().__init__()
        self.numero, self.titulo, self.subtitulo = numero, titulo, subtitulo
        self.height = 32 * mm if subtitulo else 26 * mm

    def wrap(self, *_):
        return UTIL, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(DOURADO)
        c.setFont("Jakarta-Extra", 40)
        c.drawString(0, self.height - 15 * mm, f"{self.numero:02d}")
        c.setFillColor(VERDE)
        c.setFont("Jakarta-Extra", 22)
        c.drawString(24 * mm, self.height - 13.5 * mm, self.titulo)
        if self.subtitulo:
            c.setFillColor(SUAVE)
            c.setFont("Jakarta", 10.5)
            c.drawString(24 * mm, self.height - 20.5 * mm, self.subtitulo)
        c.setStrokeColor(DOURADO)
        c.setLineWidth(2)
        c.line(0, 2 * mm, 18 * mm, 2 * mm)
        c.setStrokeColor(BORDA)
        c.setLineWidth(0.6)
        c.line(19 * mm, 2 * mm, UTIL, 2 * mm)


class Documento(BaseDocTemplate):
    def afterFlowable(self, f):
        if isinstance(f, TituloCapitulo):
            chave = f"cap{f.numero}"
            self.canv.bookmarkPage(chave)
            self.canv.addOutlineEntry(f"{f.numero}. {f.titulo}", chave, level=0)
            self.notify("TOCEntry", (0, f"{f.numero}.  {f.titulo}", self.page, chave))
        elif isinstance(f, Paragraph) and f.style.name == "h2":
            chave = f"h2-{id(f)}"
            self.canv.bookmarkPage(chave)
            self.canv.addOutlineEntry(f.getPlainText(), chave, level=1, closed=True)
            self.notify("TOCEntry", (1, f.getPlainText(), self.page, chave))


def p(texto, estilo=corpo):
    return Paragraph(texto, estilo)


def itens(*textos):
    return [Paragraph(t, lista, bulletText="•") for t in textos]


class Numero(Flowable):
    """Círculo dourado com o número do passo."""

    def __init__(self, n):
        super().__init__()
        self.n = n

    def wrap(self, *_):
        return 6 * mm, 6 * mm

    def draw(self):
        c = self.canv
        c.setFillColor(DOURADO)
        c.circle(3 * mm, 3 * mm, 3 * mm, fill=1, stroke=0)
        c.setFillColor(VERDE_ESCURO)
        c.setFont("Jakarta-Negrito", 8.5)
        c.drawCentredString(3 * mm, 2.05 * mm, str(self.n))


def passos(*textos):
    """Passo a passo numerado com círculos dourados."""
    linhas = [[Numero(i), p(t, celula)] for i, t in enumerate(textos, 1)]
    t = Table(linhas, colWidths=[9 * mm, UTIL - 9 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (1, 0), (1, -1), 1.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [t, Spacer(1, 4)]


def caixa(tipo, titulo, texto):
    fundo, cor, rotulo = {
        "dica": (VERDE_SUAVE, VERDE, "DICA"),
        "atencao": (ATENCAO_SUAVE, ATENCAO, "ATENÇÃO"),
        "importante": (PERIGO_SUAVE, PERIGO, "IMPORTANTE"),
        "info": (INFO_SUAVE, INFO, "SAIBA MAIS"),
        "exemplo": (DOURADO_SUAVE, ATENCAO, "EXEMPLO"),
    }[tipo]
    cab = ParagraphStyle("cx", parent=celula, fontName="Jakarta-Negrito", textColor=cor,
                         fontSize=8, leading=11)
    conteudo = [p(f"{rotulo}" + (f"  ·  {titulo}" if titulo else ""), cab), Spacer(1, 2)]
    for bloco in texto if isinstance(texto, list) else [texto]:
        conteudo.append(p(bloco, ParagraphStyle("cxb", parent=celula, fontSize=9.3, leading=13.5,
                                                spaceAfter=3)))
    t = Table([[conteudo]], colWidths=[UTIL])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fundo),
        ("LINEBEFORE", (0, 0), (0, -1), 3, cor),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [KeepTogether([Spacer(1, 4), t, Spacer(1, 8)])]


def tabela(cabecalho, linhas, larguras):
    dados = [[p(c, celula_cab) for c in cabecalho]] + [
        [p(str(c), celula) for c in linha] for linha in linhas
    ]
    t = Table(dados, colWidths=[w * UTIL for w in larguras], repeatRows=1)
    estilo = [
        ("BACKGROUND", (0, 0), (-1, 0), VERDE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, BORDA),
    ]
    for i in range(1, len(dados)):
        if i % 2 == 0:
            estilo.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FBFAF6")))
    t.setStyle(TableStyle(estilo))
    return [t, Spacer(1, 10)]


def capitulo(numero, titulo, subtitulo=""):
    return [PageBreak(), TituloCapitulo(numero, titulo, subtitulo), Spacer(1, 6)]


def secao(titulo):
    return [CondPageBreak(40 * mm), Paragraph(titulo, h2)]


# ---------------------------------------------------------------------------
# Páginas


def capa(c, _doc):
    c.saveState()
    c.setFillColor(VERDE_ESCURO)
    c.rect(0, 0, LARGURA, ALTURA, fill=1, stroke=0)
    c.setFillColor(VERDE)
    c.rect(0, ALTURA * 0.42, LARGURA, ALTURA * 0.58, fill=1, stroke=0)
    lado = 62 * mm
    c.drawImage(str(ICONE), (LARGURA - lado) / 2, ALTURA - 118 * mm, lado, lado, mask="auto")
    c.setFillColor(CREME)
    c.setFont("Jakarta-Extra", 38)
    c.drawCentredString(LARGURA / 2, ALTURA - 140 * mm, "Meu Rebanho")
    c.setFillColor(DOURADO)
    c.roundRect(LARGURA / 2 - 9 * mm, ALTURA - 148 * mm, 18 * mm, 1.4 * mm, 0.7 * mm, fill=1,
                stroke=0)
    c.setFillColor(CREME)
    c.setFont("Jakarta-Semi", 16)
    c.drawCentredString(LARGURA / 2, ALTURA - 160 * mm, "Manual de instruções e uso")
    c.setFillColor(colors.HexColor("#C9D6CE"))
    c.setFont("Jakarta", 11)
    c.drawCentredString(LARGURA / 2, ALTURA - 169 * mm,
                        "Gestão de gado leiteiro no celular, mesmo sem internet")
    c.setFillColor(DOURADO)
    c.setFont("Jakarta-Negrito", 9)
    c.drawCentredString(LARGURA / 2, 30 * mm, "REBANHO  ·  REPRODUÇÃO  ·  PRODUÇÃO  ·  SANIDADE  ·  FINANÇAS")
    c.setFillColor(colors.HexColor("#9FB3A8"))
    c.setFont("Jakarta", 9)
    c.drawCentredString(LARGURA / 2, 22 * mm, "Versão 1.0  ·  setembro de 2026")
    c.restoreState()


def pagina(c, doc):
    c.saveState()
    c.setStrokeColor(BORDA)
    c.setLineWidth(0.6)
    c.line(MARGEM, ALTURA - 13 * mm, LARGURA - MARGEM, ALTURA - 13 * mm)
    c.setFont("Jakarta-Semi", 8)
    c.setFillColor(VERDE)
    c.drawString(MARGEM, ALTURA - 11 * mm, "MEU REBANHO")
    c.setFillColor(SUAVE)
    c.setFont("Jakarta", 8)
    c.drawRightString(LARGURA - MARGEM, ALTURA - 11 * mm, "Manual de instruções e uso")
    c.setFillColor(DOURADO)
    c.circle(LARGURA / 2, 11 * mm, 3.6 * mm, fill=1, stroke=0)
    c.setFillColor(VERDE_ESCURO)
    c.setFont("Jakarta-Negrito", 8)
    c.drawCentredString(LARGURA / 2, 10 * mm, str(doc.page))
    c.restoreState()


# ---------------------------------------------------------------------------
# Conteúdo

h = []

# Sumário
h += [NextPageTemplate("normal"), PageBreak()]
h += [p("Sumário", h1), Spacer(1, 6)]
sumario = TableOfContents()
sumario.levelStyles = [toc1, toc2]
sumario.dotsMinLevel = 0
h += [sumario]

# 1 -------------------------------------------------------------------------
h += capitulo(1, "Boas-vindas", "O que é o Meu Rebanho e como ele foi pensado")
h += [
    p("O <b>Meu Rebanho</b> é um aplicativo para quem cria gado leiteiro e quer ter o rebanho "
      "na palma da mão: cadastro dos animais, reprodução, produção de leite, tratamentos e "
      "finanças da fazenda, tudo no celular."),
    p("Ele foi feito para ser usado <b>no curral</b>, com uma mão, muitas vezes <b>sem internet</b> "
      "e sob sol forte. Por isso as telas têm botões grandes, letras legíveis, cores de alto "
      "contraste e poucas etapas para cada tarefa."),
]
h += secao("Os cinco princípios do app")
h += tabela(
    ["Princípio", "O que significa no dia a dia"],
    [
        ["<b>Funciona sem internet</b>", "Depois do primeiro acesso, todas as telas abrem e "
         "gravam sem rede. O que você lança fica guardado no aparelho e é enviado sozinho quando "
         "o sinal volta."],
        ["<b>Entrada rápida</b>", "Lançar uma ordenha ou um evento leva poucos toques. Os animais "
         "são encontrados pelo <b>nome</b>; o brinco fica no cadastro."],
        ["<b>Os eventos mandam</b>", "A situação de cada vaca (em lactação, seca, prenhe...) é "
         "calculada pelo app a partir dos eventos que você registra. Você nunca precisa "
         "\"marcar\" à mão que a vaca está prenhe ou seca."],
        ["<b>Sem distrações</b>", "Nada de animações ou enfeites: a tela responde na hora."],
        ["<b>Seus dados são seus</b>", "Cada fazenda só é vista por quem é membro dela. O "
         "financeiro é visível só para o dono."],
    ],
    [0.28, 0.72],
)
h += secao("O que dá para fazer")
h += itens(
    "<b>Rebanho:</b> cadastrar, buscar e acompanhar cada animal, com linha do tempo e produção.",
    "<b>Reprodução:</b> cio, inseminação, cobertura, diagnóstico, parto (com cadastro da cria), "
    "aborto e secagem, com previsões de parto e secagem calculadas sozinhas.",
    "<b>Produção:</b> lançar a ordenha de todas as vacas de uma vez, com gráfico e histórico.",
    "<b>Sanidade:</b> tratamentos com carência de leite e carne; o leite em carência já vem "
    "marcado para descarte na ordenha.",
    "<b>Alertas e lembretes:</b> partos próximos, secagens, diagnósticos, retornos de cio, "
    "carências, com notificação diária no celular.",
    "<b>Finanças:</b> preço do leite, despesas, custo por litro, resultado do mês, margem de cada "
    "vaca e sugestões de gestão.",
    "<b>Planilhas:</b> exportar tudo em CSV para abrir no Excel ou mandar pelo WhatsApp.",
)

# 2 -------------------------------------------------------------------------
h += capitulo(2, "Primeiros passos", "Entrar, criar a fazenda e conhecer as telas")
h += secao("Entrar com a conta Google")
h += passos(
    "Abra o app. Na tela de boas-vindas, toque em <b>Entrar com Google</b>.",
    "Escolha a sua conta Google e autorize.",
    "No primeiro acesso o app precisa de <b>internet</b>. Depois disso, ele funciona offline.",
)
h += secao("Criar a sua fazenda")
h += [p("No primeiro acesso o app pede os dados da fazenda:")]
h += passos(
    "Informe o <b>nome da fazenda</b>, o <b>município</b> e a <b>UF</b> (sigla do estado, ex.: PR).",
    "Toque em <b>Criar fazenda</b>. Você é o dono e a fazenda já vem com os prazos "
    "reprodutivos padrão (dá para mudar depois, veja o capítulo 10).",
)
h += secao("Conhecendo a tela")
h += [p("A navegação fica numa barra flutuante no rodapé, com quatro abas:")]
h += tabela(
    ["Aba", "Para que serve"],
    [
        ["<b>Painel</b>", "Resumo da fazenda (vacas em lactação, leite de ontem, média de 7 dias), "
         "sugestão financeira e a lista de <b>alertas</b> do dia."],
        ["<b>Rebanho</b>", "Lista de animais com busca e filtros. Daqui você cadastra animais e "
         "abre o detalhe de cada um para registrar eventos e tratamentos."],
        ["<b>Produção</b>", "Lançar ordenhas, ver o gráfico de leite no tanque e o histórico."],
        ["<b>Finanças</b>", "Preço do leite, despesas, resultado do mês, margem por animal e "
         "sugestões. Só o dono da fazenda vê."],
    ],
    [0.2, 0.8],
)
h += itens(
    "<b>Sua foto</b> (no canto superior do Painel, do Rebanho e da Produção) abre <b>Conta e "
    "fazenda</b>: prazos, tratamento em lote, planilhas, lembretes e sair.",
    "<b>Tocar na aba em que você já está</b> volta ao início dela (por exemplo, do detalhe de um "
    "animal de volta para a lista).",
    "O selo <b>Sincronizando</b> no topo aparece enquanto há dados aguardando envio para a internet.",
)
h += caixa("dica", "Datas",
           "Toda data tem os atalhos <b>Hoje</b> e <b>Ontem</b>. Para outra data, toque no campo "
           "e escolha no <b>calendário</b>. Tocar no nome do mês permite pular direto para outro "
           "mês ou ano, útil para datas de nascimento antigas. Datas futuras ficam bloqueadas, "
           "exceto no preço do leite.")
h += caixa("info", "Não perca o que digitou",
           "Se você preencheu um formulário e tentar voltar sem salvar, o app pergunta se quer "
           "<b>descartar</b> ou <b>continuar aqui</b>.")
h += caixa("dica", "Tela sempre em dia",
           "Você não precisa \"atualizar\" nenhuma tela. Tudo o que você grava aparece na hora, "
           "e o que outra pessoa gravar aparece sozinho quando houver internet.")

# 3 -------------------------------------------------------------------------
h += capitulo(3, "Usando sem internet", "Como o app guarda e envia os seus dados")
h += [
    p("O Meu Rebanho guarda uma cópia de todos os dados da fazenda no celular. Assim você pode "
      "lançar ordenhas, eventos e tratamentos no curral, sem sinal nenhum."),
]
h += secao("Como funciona")
h += itens(
    "Ao salvar, o registro vai <b>na hora</b> para as telas e fica numa fila no aparelho.",
    "Quando a internet volta, a fila é enviada sozinha, sem você fazer nada.",
    "Enquanto houver algo na fila, o selo <b>Sincronizando</b> aparece no topo das telas.",
    "O botão de salvar não espera a internet: você segue para a próxima tarefa imediatamente.",
)
h += caixa("importante", "Antes de sair da conta",
           ["Se você tocar em <b>Sair</b> com dados ainda não enviados, o app avisa: <i>\"Dados "
            "ainda não enviados\"</i>. Saindo assim, esses registros podem se perder.",
            "Conecte-se à internet e espere o selo <b>Sincronizando</b> sumir antes de sair."])
h += caixa("atencao", "Primeiro acesso e celular novo",
           "O primeiro login em um aparelho precisa de internet para baixar os dados da fazenda. "
           "Faça esse primeiro acesso em casa ou onde houver sinal.")
h += caixa("dica", "Não desinstale com dados na fila",
           "Desinstalar o app ou limpar os dados dele apaga a fila do aparelho. Se o selo "
           "Sincronizando estiver aparecendo, espere ter internet primeiro.")

# 4 -------------------------------------------------------------------------
h += capitulo(4, "Painel", "O resumo do dia e os alertas")
h += [
    p("O Painel é a primeira tela do app. No cartão verde estão o nome da fazenda e três números:"),
]
h += itens(
    "<b>Em lactação:</b> quantas vacas estão sendo ordenhadas.",
    "<b>Ontem:</b> litros entregues no tanque ontem (sem o leite descartado).",
    "<b>Média 7 dias:</b> média diária dos últimos sete dias com lançamento.",
)
h += [p("Logo abaixo, para o dono, aparece a <b>principal sugestão financeira</b> (ver capítulo 9). "
        "Tocar nela abre a aba Finanças.")]
h += caixa("dica", "Fazenda nova: primeiros passos",
           "Enquanto não houver nenhuma vaca em lactação, o Painel mostra um guia com atalhos: "
           "cadastrar os animais, registrar o último parto das vacas em lactação, lançar a "
           "primeira ordenha e cadastrar o preço do leite. O guia some sozinho quando a primeira "
           "vaca entra em lactação.")
h += secao("Alertas")
h += [p("Os alertas mostram o que precisa da sua atenção, do mais urgente para o menos urgente. "
        "<b>Toque em um alerta para abrir o animal</b> e registrar o que foi feito.")]
h += tabela(
    ["Alerta", "Quando aparece", "O que fazer"],
    [
        ["<b>Leite fora do tanque</b>", "Vaca em lactação com carência de leite ativa.",
         "Separar o leite dela na ordenha. O lançamento já vem marcado como descartado."],
        ["<b>Parto próximo</b> / já passou", "Prenhe com parto previsto nos próximos 15 dias "
         "(ou com a data já vencida).", "Preparar a maternidade. Ao parir, registrar o parto."],
        ["<b>Secar em breve</b> / atrasada", "Prenhe em lactação com secagem prevista nos "
         "próximos 7 dias (ou vencida).", "Secar a vaca e registrar a secagem."],
        ["<b>Diagnóstico pendente</b>", "Serviço sem diagnóstico há mais dias que o prazo de "
         "diagnóstico (padrão 35).", "Chamar o veterinário e registrar o diagnóstico."],
        ["<b>Observar retorno de cio</b>", "Entre 18 e 24 dias após o serviço (prazo padrão de "
         "21 dias, com 3 de tolerância).", "Observar a vaca. Se voltar ao cio, registrar cio ou "
         "novo serviço."],
        ["<b>Liberada e sem inseminação</b>", "Em lactação, vazia, e já 30 dias além do período "
         "de espera sem nenhum serviço.", "Programar a inseminação."],
    ],
    [0.24, 0.40, 0.36],
)
h += caixa("info", "De onde vêm os alertas",
           "Os alertas são calculados pelo app a partir dos eventos e tratamentos registrados. "
           "Quando você registra o que foi feito (o parto, a secagem, o diagnóstico), o alerta "
           "some sozinho.")

# 5 -------------------------------------------------------------------------
h += capitulo(5, "Rebanho", "Cadastro, busca e ficha completa de cada animal")
h += secao("Lista e busca")
h += itens(
    "Os animais aparecem em ordem alfabética pelo <b>nome</b>.",
    "A <b>busca</b> encontra pelo nome ou pelo brinco, sem ligar para acentos ou maiúsculas.",
    "Os <b>filtros</b> no topo mostram só uma parte do rebanho: <b>Todos, Lactação, Prenhes, "
    "Secas, Novilhas, Bezerras, Machos</b> e <b>Saíram</b> (vendidos, mortos e descartados).",
    "No filtro <b>Prenhes</b>, a lista é ordenada pela previsão de parto: quem vai parir primeiro "
    "aparece em cima, com a data e quantos dias faltam.",
)
h += secao("Cadastrar um animal")
h += passos(
    "Na aba Rebanho, toque no botão <b>Novo</b> (canto inferior direito).",
    "Preencha <b>Nome</b> e <b>Brinco</b>. Os dois são obrigatórios e não podem se repetir na fazenda.",
    "Complete os demais dados que tiver e toque em salvar.",
)
h += tabela(
    ["Campo", "Observação"],
    [
        ["<b>Nome *</b>", "Como o animal aparece em todas as telas. Único na fazenda (Mimosa e "
         "mimosa contam como iguais)."],
        ["<b>Brinco *</b>", "Número ou código do brinco. Único na fazenda."],
        ["Sexo", "Fêmea ou Macho."],
        ["Data de nascimento", "Define se a fêmea é <b>bezerra</b> (até 12 meses) ou <b>novilha</b>. "
         "A mudança de bezerra para novilha acontece sozinha com a idade."],
        ["Raça", "Livre (ex.: Holandesa, Jersey, Girolando)."],
        ["Pai (touro ou código do sêmen)", "Preenchido automaticamente quando a cria é "
         "cadastrada no parto, a partir do último serviço da mãe."],
        ["Mãe", "Opcional: busque a mãe pelo nome. Na cria cadastrada no parto, já vem "
         "preenchida."],
        ["Origem", "<b>Nasceu aqui</b> ou <b>Comprado</b>. Comprado pede a data de entrada na "
         "fazenda, usada no rateio de despesas."],
        ["Situação no rebanho", "Ativo, vendido, morto ou descartado. Os três últimos pedem a "
         "<b>data de saída</b> e o motivo."],
        ["Observações", "Qualquer anotação."],
    ],
    [0.3, 0.7],
)
h += caixa("dica", "Vacas que já chegam em lactação",
           "Ao cadastrar uma vaca que já pariu, registre em seguida o <b>último parto</b> dela "
           "(veja o capítulo 6). É o parto que coloca a vaca em lactação e na lista da ordenha.")
h += secao("A ficha do animal")
h += [p("Toque num animal para abrir a ficha. Ela reúne tudo sobre ele, de cima para baixo:")]
h += tabela(
    ["Parte da ficha", "O que mostra"],
    [
        ["Cabeçalho", "Nome, situação (Em lactação, Seca, Novilha, Prenhe...), raça e idade. "
         "O botão <b>Editar</b> fica no topo."],
        ["Avisos", "<b>Leite fora do tanque</b> (carência de leite) e <b>Carência de carne</b> "
         "(não abater nem vender para corte até a data)."],
        ["Botões <b>Evento</b> e <b>Tratamento</b>", "Registrar um evento reprodutivo (só "
         "fêmeas) ou um tratamento."],
        ["Reprodução", "Dias em lactação (DEL), número de partos, último parto, último serviço, "
         "previsões de parto e secagem e IEP médio. Avisos de <b>Liberada para inseminar</b> e "
         "<b>Aguardando diagnóstico</b>."],
        ["Produção", "Gráfico dos litros por dia nos últimos 30 dias e as últimas ordenhas."],
        ["Financeiro (dono)", "Receita do leite, custo rateado e margem da vaca no mês."],
        ["Linha do tempo", "Todos os eventos reprodutivos, do mais recente ao mais antigo. No "
         "parto, um atalho abre a cria."],
        ["Tratamentos", "Produto, tipo, dose, via e carências de cada tratamento."],
        ["Dados", "Brinco, sexo, nascimento, origem, pai, mãe (toque para abrir), crias, "
         "motivo de saída e observações."],
    ],
    [0.27, 0.73],
)
h += secao("Venda, morte ou descarte")
h += passos(
    "Abra o animal e toque em <b>Editar</b>.",
    "Em <b>Situação no rebanho</b>, escolha Vendido, Morto ou Descartado.",
    "Informe a <b>data de saída</b> e o motivo e salve.",
)
h += [p("O animal sai das listas do dia a dia e passa para o filtro <b>Saíram</b>. O histórico "
        "dele continua guardado.")]

# 6 -------------------------------------------------------------------------
h += capitulo(6, "Reprodução", "Eventos, previsões e a situação de cada vaca")
h += secao("Registrar um evento")
h += passos(
    "Abra a vaca no Rebanho (ou toque no alerta dela no Painel) e toque em <b>Evento</b>.",
    "Escolha o <b>tipo de evento</b>. O app mostra primeiro os tipos que fazem sentido para o "
    "momento da vaca (veja a tabela abaixo).",
    "Confira a <b>data</b> (vem com hoje) e preencha os campos que aparecem.",
    "Antes de salvar, o app mostra <b>o que vai mudar</b> (ex.: a previsão de parto). Toque em "
    "<b>Registrar</b>.",
)
h += tabela(
    ["Evento", "Campos extras", "O que muda"],
    [
        ["Cio", "Observações", "Só registra; ajuda a acompanhar retornos."],
        ["Inseminação", "Sêmen (touro ou código), inseminador", "Inicia a espera do diagnóstico e "
         "o alerta de retorno de cio."],
        ["Cobertura", "Touro", "Igual à inseminação (monta natural)."],
        ["Diagnóstico positivo", "Veterinário", "A vaca fica <b>prenhe</b>; calcula as previsões "
         "de parto e de secagem."],
        ["Diagnóstico negativo", "Veterinário", "A vaca volta a ficar vazia."],
        ["Parto", "Cadastro da cria", "A vaca entra <b>em lactação</b> e aparece na ordenha; "
         "conta um parto e o IEP."],
        ["Aborto", "Observações", "Encerra a prenhez (não conta como parto)."],
        ["Secagem", "Observações", "A vaca fica <b>seca</b> e sai da lista da ordenha."],
    ],
    [0.22, 0.3, 0.48],
)
h += secao("Tipos sugeridos para cada momento")
h += tabela(
    ["Momento da vaca", "Tipos mostrados primeiro"],
    [
        ["Vazia (novilha ou seca)", "Cio, Inseminação, Cobertura"],
        ["Vazia em lactação", "Cio, Inseminação, Cobertura, Secagem"],
        ["Aguardando diagnóstico", "Cio (retorno), Inseminação, Cobertura, Diagnósticos"],
        ["Prenhe", "Diagnósticos (reconfirmação), Parto, Aborto e, em lactação, Secagem"],
        ["Bezerra", "Nenhum sugerido; todos ficam liberados para corrigir o histórico"],
    ],
    [0.35, 0.65],
)
h += [p("O momento aparece no topo da grade (ex.: <i>\"Em lactação · vazia\"</i>). Se precisar "
        "de outro tipo, toque em <b>Mostrar outros tipos</b>. Isso serve para completar histórico "
        "antigo, como lançar o parto de uma vaca recém-cadastrada que já está em lactação.")]
h += caixa("info", "Por que inseminação aparece para vaca em lactação?",
           "Porque é normal: a vaca é inseminada durante a lactação, depois do período de espera "
           "após o parto (padrão 45 dias). Assim ela pare de novo em cerca de 13 meses.")
h += secao("Parto com cadastro da cria")
h += [p("No parto, a opção <b>Cadastrar agora</b> vem ligada. Informe <b>nome</b>, <b>brinco</b> "
        "e <b>sexo</b> da cria. Ela é cadastrada junto com o parto, com a mãe, a data de "
        "nascimento, a raça e o pai (do último serviço) já preenchidos.")]
h += secao("Como o app calcula a situação")
h += tabela(
    ["Situação", "Regra"],
    [
        ["Em lactação", "O último parto é mais recente que a última secagem."],
        ["Seca", "A última secagem é mais recente que o último parto."],
        ["Novilha", "Fêmea sem parto, com 12 meses ou mais."],
        ["Bezerra", "Fêmea sem parto, com menos de 12 meses."],
        ["Prenhe", "Diagnóstico positivo depois do último serviço, sem parto ou aborto depois."],
        ["Previsão de parto", "Data do serviço confirmado + dias de gestação (padrão 283)."],
        ["Previsão de secagem", "Previsão de parto − dias de secagem antes do parto (padrão 60)."],
        ["DEL", "Dias em lactação: de hoje até o último parto."],
        ["IEP", "Intervalo entre partos: dias entre um parto e o seguinte (média na ficha)."],
        ["Liberada para inseminar", "Em lactação, vazia e com DEL maior ou igual ao período de "
         "espera (padrão 45 dias)."],
    ],
    [0.3, 0.7],
)
h += caixa("dica", "Lançou errado?",
           "Na ficha da vaca, <b>segure o evento</b> na linha do tempo para excluí-lo. A situação "
           "e as previsões são recalculadas na hora. Se era um parto com cria, a cria continua "
           "no rebanho.")
h += caixa("atencao", "Datas no futuro",
           "O app não aceita eventos com data futura, antes do nascimento da vaca ou em machos.")

# 7 -------------------------------------------------------------------------
h += capitulo(7, "Produção de leite", "Lançar a ordenha de todas as vacas de uma vez")
h += secao("Lançar uma ordenha")
h += passos(
    "Na aba Produção, toque em <b>Lançar ordenha</b>.",
    "Confira a <b>data</b> e a <b>ordenha</b> (Manhã, Tarde ou Única). Antes do meio-dia o app "
    "sugere Manhã; depois, Tarde.",
    "Aparecem todas as <b>vacas em lactação</b>. Digite os litros de cada uma com o teclado "
    "numérico e toque em <b>próximo</b> no teclado para ir à seguinte. Sob o nome aparece "
    "<b>Anterior: X L</b>, os litros da vaca na ordenha anterior do mesmo turno, para conferir.",
    "Vacas em carência já vêm marcadas <b>Em carência · descartar</b>. Toque na marcação para "
    "descartar ou não o leite de qualquer vaca (mastite, colostro...).",
    "O rodapé mostra o <b>total no tanque</b>, quantas vacas foram lançadas e os litros "
    "descartados. Toque em <b>Salvar</b>.",
)
h += itens(
    "Vaca sem valor digitado fica de fora da ordenha (não conta como zero).",
    "Use vírgula para decimais (ex.: 12,5). O limite é 80 L por vaca por ordenha, para pegar "
    "erros de digitação.",
    "Os <b>totais entregues não incluem</b> o leite descartado.",
)
h += secao("Corrigir uma ordenha")
h += [p("Na aba Produção, toque no botão da ordenha (ex.: <i>Manhã 312 L</i>) no dia desejado. "
        "A tela abre com os valores salvos e o aviso <b>Editando lançamento salvo</b>. Salvar "
        "substitui os valores anteriores. Se um tratamento foi lançado depois, a vaca em carência "
        "já aparece marcada como descartada.")]
h += secao("Gráfico e histórico")
h += itens(
    "No topo: litros de <b>hoje</b>, <b>ontem</b> e a <b>média de 7 dias</b>.",
    "O gráfico <b>Leite no tanque</b> mostra os últimos 30 dias. <b>Toque numa barra</b> para "
    "ver o dia e os litros. Dia sem barra é dia sem lançamento.",
    "Abaixo, cada dia com o total e as ordenhas, com os litros descartados à parte.",
)

# 8 -------------------------------------------------------------------------
h += capitulo(8, "Sanidade", "Tratamentos, carências e leite descartado")
h += secao("Registrar um tratamento")
h += [p("Para <b>um animal</b>: abra a ficha e toque em <b>Tratamento</b>. Para <b>vários</b> "
        "(vacinação, vermifugação): toque na sua foto → <b>Tratamento em lote</b>.")]
h += passos(
    "Escolha os <b>animais</b>: busque pelo nome ou use os atalhos <b>+ Em lactação</b> e "
    "<b>+ Todo o rebanho</b>. Toque num nome escolhido para removê-lo.",
    "Escolha o <b>tipo</b> (Antibiótico, Vacina, Vermífugo, Hormônio, Outro), o <b>produto</b> e "
    "a <b>data da aplicação</b>.",
    "Informe a <b>carência de leite</b> e a <b>de carne</b>, em dias, conforme a bula (0 se não "
    "tiver).",
    "Opcional: dose, via (Intramuscular, Subcutânea, Intramamária, Oral, Pour-on), observações e, "
    "para o dono, o <b>custo total</b>.",
    "Toque em <b>Registrar</b> (ou <b>Registrar em N animais</b>).",
)
h += secao("Como a carência funciona")
h += itens(
    "O último dia de carência é a <b>data do tratamento + os dias de carência</b>, inclusive.",
    "Enquanto durar a carência de leite, a vaca aparece no alerta <b>Leite fora do tanque</b> e "
    "vem marcada para descarte na ordenha.",
    "Com vários tratamentos, vale a carência que termina mais tarde.",
    "A <b>carência de carne</b> aparece na ficha: não abater nem vender para corte até a data.",
)
h += caixa("exemplo", "Carência de 4 dias",
           "Antibiótico aplicado em 10/09 com 4 dias de carência de leite: o leite é descartado "
           "de 10/09 até 14/09. A partir de 15/09 volta para o tanque.")
h += caixa("dica", "Custo do tratamento",
           "Se você informar o custo total, ele vira automaticamente uma <b>despesa de "
           "Tratamentos</b> dividida entre os animais tratados. Excluir o tratamento de um "
           "animal tira a parte dele dessa despesa.")
h += [p("Para excluir um tratamento lançado errado, <b>segure-o</b> na ficha do animal. A carência "
        "é recalculada.")]

# 9 -------------------------------------------------------------------------
h += capitulo(9, "Finanças", "Preço do leite, despesas, resultado e margem por animal")
h += [p("A aba Finanças é visível <b>só para o dono da fazenda</b>. Os valores são calculados "
        "pelo app a partir das ordenhas, do preço do leite e das despesas que você lança. As "
        "setas no topo trocam o mês.")]
h += secao("Preço do leite")
h += [p("O preço vale a partir de uma data. <b>Quando você cadastra um preço novo, o anterior "
        "deixa de valer na véspera</b>. O histórico fica guardado, então a receita dos meses "
        "passados continua certa.")]
h += passos(
    "Em Finanças, toque no cartão do preço (ou em <b>Cadastrar preço do leite</b>).",
    "Toque em <b>Novo preço</b>, informe o valor por litro (até 4 casas, ex.: 2,4735) e a data "
    "em que ele passa a valer.",
    "O app avisa qual preço perde a vigência. Toque em <b>Salvar preço</b>.",
)
h += caixa("exemplo", "Vigências",
           ["R$ 2,30 a partir de 01/08 e R$ 2,50 a partir de 15/09:",
            "• ordenhas de 01/08 a 14/09 valem R$ 2,30 por litro;",
            "• ordenhas a partir de 15/09 valem R$ 2,50.",
            "O preço pode começar numa data passada (o laticínio costuma avisar depois). "
            "Cadastrar de novo na mesma data substitui o preço daquele dia. Segure um preço no "
            "histórico para excluí-lo."])
h += secao("Lançar despesas")
h += passos(
    "Em Finanças, toque em <b>Lançar despesa</b>.",
    "Escolha a <b>categoria</b>, o <b>valor total</b> e a <b>data</b>. A descrição é opcional.",
    "Opcional: <b>quantidade</b> e <b>unidade</b> (kg, sc, t, L, un). O app mostra o preço "
    "unitário, útil para comparar compras de ração.",
    "Escolha <b>para quem é</b> a despesa (base da divisão entre os animais) e salve.",
)
h += tabela(
    ["Categoria", "Exemplos", "\"Para quem\" sugerido"],
    [
        ["Ração e concentrado", "Ração, milho, farelo, sal mineral", "Vacas em lactação"],
        ["Silagem e volumoso", "Silagem, feno, pastagem", "Todo o rebanho"],
        ["Tratamentos", "Medicamentos, vacinas", "Animais escolhidos"],
        ["Sêmen e reprodução", "Sêmen, protocolos, inseminador", "Vacas em lactação"],
        ["Mão de obra", "Salários, diárias", "Todo o rebanho"],
        ["Combustível", "Diesel, gasolina", "Todo o rebanho"],
        ["Energia", "Luz, resfriador", "Todo o rebanho"],
        ["Manutenção", "Ordenhadeira, cercas, trator", "Todo o rebanho"],
        ["Outros", "Demais custos", "Todo o rebanho"],
    ],
    [0.27, 0.43, 0.30],
)
h += [p("Opções de <b>para quem é</b>: Todo o rebanho, Vacas em lactação, Vacas secas, Bezerras "
        "e novilhas, ou Animais escolhidos. Para ração e volumoso das vacas em lactação dá para "
        "escolher dividir <b>Igual por cabeça</b> ou <b>Pelos litros</b> de cada vaca.")]
h += [p("Toque num lançamento da lista do mês para editar ou excluir. Para despesas que se "
        "repetem (mão de obra, energia), abra a do mês anterior e toque em <b>Lançar de novo com "
        "a data de hoje</b>: o formulário vem preenchido.")]
h += secao("Resultado do mês")
h += tabela(
    ["Indicador", "Como é calculado"],
    [
        ["<b>Receita com leite</b>", "Litros entregues em cada ordenha × preço que valia naquele dia."],
        ["<b>Despesas</b>", "Soma das despesas com data no mês."],
        ["<b>Resultado</b>", "Receita − despesas (em vermelho quando negativo)."],
        ["<b>Custo por litro</b>", "Despesas ÷ litros produzidos (entregues + descartados)."],
        ["<b>Preço médio</b>", "Receita ÷ litros entregues."],
        ["<b>% alimentação</b>", "Ração + volumoso ÷ despesas. Referência de mercado: 50% a 60%."],
        ["<b>Ponto de equilíbrio</b>", "Quando o custo passa do preço: quantos litros por dia "
         "pagariam as despesas do mês."],
        ["<b>Leite descartado</b>", "Quanto o leite descartado teria rendido no preço do dia."],
    ],
    [0.28, 0.72],
)
h += caixa("atencao", "Litros sem preço",
           "Ordenhas anteriores ao primeiro preço cadastrado ficam fora da receita, e o app avisa "
           "quantos litros estão sem preço. Cadastre o preço com a data de início certa.")
h += secao("Resultado por animal e rateio")
h += [p("Em Finanças → <b>Resultado por animal</b>, cada animal aparece com receita, custo e "
        "<b>margem</b> no mês, das piores para as melhores (ou o contrário). A ficha de cada "
        "animal também tem o cartão <b>Financeiro</b>.")]
h += tabela(
    ["\"Para quem é\"", "Como a despesa é dividida"],
    [
        ["Animais escolhidos", "Em partes iguais entre os escolhidos."],
        ["Todo o rebanho, lactação, secas, bezerras e novilhas",
         "Por <b>cabeça-dia</b>: cada animal paga pelos dias do mês em que estava na fazenda e "
         "naquele grupo. A vaca que pariu no dia 10 entra em \"lactação\" a partir do dia 10."],
        ["Lactação \"Pelos litros\"", "Proporcional aos litros de cada vaca no mês (inclusive os "
         "descartados, porque ela comeu igual)."],
    ],
    [0.34, 0.66],
)
h += caixa("exemplo", "Cabeça-dia",
           ["R$ 3.000 de silagem em setembro para todo o rebanho. 20 animais ficaram o mês todo "
            "(20 × 30 = 600 cabeças-dia) e 1 entrou no dia 16 (15 cabeças-dia): 615 no total.",
            "Cada cabeça-dia custa R$ 3.000 ÷ 615 = R$ 4,88. Quem ficou o mês todo paga R$ 146,34; "
            "quem entrou no dia 16 paga R$ 73,17."])
h += itens(
    "<b>Margem = receita do leite da vaca − custo rateado.</b>",
    "Bezerras, novilhas e vacas secas não dão leite: a margem delas é negativa, e isso é "
    "<b>investimento</b>, não prejuízo. Olhe com atenção as vacas <b>em lactação</b> no vermelho.",
    "Despesa de um grupo sem nenhum animal no mês (ex.: Vacas secas num mês sem vaca seca) aparece "
    "como <b>sem rateio</b>: entra no resultado do mês, mas em nenhum animal.",
    "No mês corrente, a divisão considera os dias até hoje.",
)
h += secao("Sugestões")
h += [p("O app analisa o mês atual e os três anteriores e sugere onde agir. As sugestões aparecem "
        "no topo de Finanças; a principal aparece também no Painel. As que falam de uma vaca "
        "abrem a ficha dela.")]
h += tabela(
    ["Sugestão", "Quando aparece"],
    [
        ["Cadastre o preço do leite", "Há produção, mas nenhum preço cadastrado."],
        ["Preço sem atualização", "O preço vigente começou há mais de 45 dias."],
        ["Custo por litro acima do preço", "No mês atual, o custo por litro passou do preço médio."],
        ["Mês fechou no prejuízo", "O último mês completo teve resultado negativo."],
        ["Vaca deu prejuízo", "Vaca em lactação com margem negativa nos 3 últimos meses completos."],
        ["Vazia com DEL alto", "Em lactação, vazia, mais de 150 dias em lactação e margem abaixo "
         "da média das vacas."],
        ["Alimentação por litro subiu", "O custo de ração + volumoso por litro subiu mais de 15% "
         "de um mês para o outro."],
        ["Alimentação alta", "Ração + volumoso passaram de 70% das despesas."],
        ["Leite descartado", "Mais de R$ 50 em leite descartado no mês, com as vacas que mais pesaram."],
        ["Nenhuma despesa lançada", "Já passou do dia 10 e o mês ainda não tem despesas."],
    ],
    [0.34, 0.66],
)
h += caixa("dica", "Para os números ficarem certos",
           ["• Lance <b>todas</b> as despesas, inclusive mão de obra e energia.",
            "• Mantenha o <b>preço do leite</b> atualizado a cada pagamento do laticínio.",
            "• Registre partos e secagens em dia: é deles que sai quem está em cada grupo.",
            "• Informe a <b>data de entrada</b> dos animais comprados e a <b>data de saída</b> dos "
            "que saíram."])

# 10 ------------------------------------------------------------------------
h += capitulo(10, "Conta e fazenda", "Prazos, lembretes, planilhas e conta")
h += [p("Toque na <b>sua foto</b> no topo do Painel, do Rebanho ou da Produção. Tocar no "
        "<b>nome da fazenda</b> abre os dados dela (nome, município e UF), que o dono pode "
        "corrigir.")]
h += secao("Prazos reprodutivos")
h += [p("Os prazos alimentam as previsões e os alertas. Só o dono altera. Ao salvar, a situação "
        "de todas as vacas é recalculada. <b>Voltar ao padrão</b> restaura os valores abaixo.")]
h += tabela(
    ["Prazo", "Padrão", "Aceito", "Para que serve"],
    [
        ["Gestação", "283 dias", "260 a 300", "Serviço confirmado até o parto."],
        ["Secagem antes do parto", "60 dias", "30 a 90", "Quando secar antes do parto previsto."],
        ["Espera após o parto", "45 dias", "20 a 120", "Até a vaca ficar liberada para inseminar."],
        ["Diagnóstico de gestação", "35 dias", "28 a 90", "Após o serviço, para o alerta de "
         "diagnóstico pendente."],
        ["Retorno de cio", "21 dias", "17 a 25", "Após o serviço, para observar o cio."],
    ],
    [0.27, 0.13, 0.14, 0.46],
)
h += secao("Lembretes diários")
h += passos(
    "Toque em <b>Lembretes</b>, escolha o <b>horário</b> (5h a 19h) e toque em <b>Ligar lembretes</b>.",
    "Permita as notificações quando o celular pedir.",
)
h += itens(
    "Todo dia, no horário escolhido, chega uma notificação com as pendências do dia (partos, "
    "secagens, diagnósticos, cios, carências). Dia sem pendência não notifica.",
    "A tela mostra a <b>prévia</b> dos próximos lembretes.",
    "Os lembretes são agendados para a semana seguinte sempre que o app é aberto. Abra o app pelo "
    "menos uma vez por semana.",
    "Tocar na notificação abre o Painel. A preferência vale para este celular.",
)
h += caixa("atencao", "Não chega notificação?",
           "Confira se as notificações do Meu Rebanho estão permitidas nos ajustes do celular. Se "
           "estiverem bloqueadas, o app oferece o atalho <b>Abrir ajustes</b>.")
h += secao("Exportar planilhas")
h += [p("Toque em <b>Exportar planilha</b> e em <b>Compartilhar planilha</b> no item desejado. O "
        "celular oferece WhatsApp, e-mail, Drive e outros. Os arquivos CSV abrem direto no Excel "
        "ou no Google Planilhas, com vírgula decimal e datas dd/mm/aaaa.")]
h += tabela(
    ["Planilha", "Conteúdo"],
    [
        ["Animais", "Todos os animais, com situação, partos, previsões, carência, mãe e pai."],
        ["Produção", "Uma linha por vaca em cada ordenha (30 dias, 90 dias ou 1 ano)."],
        ["Eventos reprodutivos", "Todos os eventos, com touro/sêmen, responsável e cria."],
        ["Tratamentos", "Todos os tratamentos, com dose, via e carências."],
        ["Despesas (dono)", "Todas as despesas, com categoria, valor e a forma de rateio."],
        ["Resultado por animal (dono)", "Receita, leite descartado, custo e margem de cada animal "
         "no mês escolhido."],
    ],
    [0.3, 0.7],
)
h += secao("Sair da conta")
h += [p("Toque em <b>Sair</b>. Se houver dados ainda não enviados, o app avisa antes (veja o "
        "capítulo 3). Os lembretes agendados no celular são cancelados ao sair.")]

# 11 ------------------------------------------------------------------------
h += capitulo(11, "Perguntas frequentes", "E o que fazer quando algo não sai como esperado")
faq = [
    ("A vaca não aparece na lista da ordenha.",
     "Só vacas <b>em lactação</b> aparecem. Registre o <b>parto</b> dela (use Mostrar outros tipos "
     "se for histórico antigo). Se ela foi seca por engano, exclua a secagem na linha do tempo."),
    ("A previsão de parto não apareceu.",
     "A previsão sai do serviço confirmado. Registre a <b>inseminação ou cobertura</b> e depois o "
     "<b>diagnóstico positivo</b>. Diagnóstico positivo sem serviço (vaca comprada prenhe) deixa a "
     "vaca prenhe, mas sem data prevista."),
    ("Apareceu \"Já existe um animal com este nome\".",
     "Nomes e brincos não podem se repetir, sem diferenciar acentos e maiúsculas. Use outro nome "
     "(ex.: Mimosa II)."),
    ("Lancei um evento, tratamento ou preço errado.",
     "Segure o item (na linha do tempo, na lista de tratamentos ou no histórico de preços) para "
     "excluir. Despesas e ordenhas se corrigem abrindo e salvando de novo."),
    ("O selo Sincronizando não some.",
     "Há dados esperando internet. Conecte-se ao Wi-Fi ou aos dados móveis e mantenha o app "
     "aberto por alguns instantes."),
    ("A aba Finanças diz que é só para o dono.",
     "O financeiro é restrito ao dono da fazenda, por segurança."),
    ("A receita do mês está zerada.",
     "Cadastre o <b>preço do leite</b> com a data de início anterior às ordenhas do mês."),
    ("A margem de uma novilha é negativa.",
     "É esperado: ela ainda não produz leite. Esse custo é o investimento na futura vaca."),
    ("Troquei de celular.",
     "Instale o app e entre com a mesma conta Google, com internet. Tudo o que já estava "
     "sincronizado aparece. Os lembretes precisam ser ligados de novo no celular novo."),
]
for pergunta, resposta in faq:
    h += [KeepTogether([p(f"<b>{pergunta}</b>", h3), p(resposta)])]

# 12 ------------------------------------------------------------------------
h += capitulo(12, "Glossário", "Termos usados no app")
h += tabela(
    ["Termo", "Significado"],
    [
        ["Brinco", "Identificação física do animal. No app, fica no cadastro; nas telas vale o nome."],
        ["Cabeça-dia", "Um animal presente por um dia. Base da divisão das despesas."],
        ["Carência", "Período após um tratamento em que o leite (ou a carne) não pode ser vendido."],
        ["Cobertura", "Monta natural com touro."],
        ["Custo por litro", "Despesas do mês divididas pelos litros produzidos."],
        ["DEL", "Dias em lactação: dias desde o último parto."],
        ["IEP", "Intervalo entre partos. O ideal fica em torno de 12 a 13 meses."],
        ["Margem", "Receita do leite de um animal menos o custo rateado para ele."],
        ["Novilha", "Fêmea com 12 meses ou mais que ainda não pariu."],
        ["Período de espera", "Dias após o parto antes de inseminar de novo (padrão 45)."],
        ["Rateio", "Divisão de uma despesa entre os animais."],
        ["Secagem", "Interrupção da ordenha antes do próximo parto, para a vaca descansar."],
        ["Serviço", "Inseminação ou cobertura."],
        ["Sincronizar", "Enviar para a internet os dados guardados no celular."],
        ["Vazia", "Fêmea que não está prenhe."],
        ["Vigência", "Período em que um preço do leite vale."],
    ],
    [0.22, 0.78],
)

# 13 ------------------------------------------------------------------------
h += capitulo(13, "Referência rápida", "As tarefas do dia a dia em poucos toques")
h += tabela(
    ["Quero...", "Caminho"],
    [
        ["Lançar a ordenha", "Produção → Lançar ordenha → litros → Salvar"],
        ["Corrigir uma ordenha", "Produção → tocar na ordenha do dia → corrigir → Salvar"],
        ["Cadastrar animal", "Rebanho → Novo"],
        ["Registrar parto, cio, inseminação...", "Rebanho → animal → Evento"],
        ["Ver quem vai parir", "Rebanho → filtro Prenhes"],
        ["Tratar um animal", "Rebanho → animal → Tratamento"],
        ["Vacinar vários", "Foto → Tratamento em lote → + Todo o rebanho"],
        ["Registrar venda ou morte", "Rebanho → animal → Editar → Situação no rebanho"],
        ["Atualizar o preço do leite", "Finanças → cartão do preço → Novo preço"],
        ["Lançar uma despesa", "Finanças → Lançar despesa"],
        ["Ver a margem de cada vaca", "Finanças → Resultado por animal"],
        ["Mudar prazos", "Foto → Prazos reprodutivos"],
        ["Receber lembretes", "Foto → Lembretes → Ligar lembretes"],
        ["Mandar planilha", "Foto → Exportar planilha → Compartilhar planilha"],
        ["Excluir algo lançado errado", "Segurar o item na lista (evento, tratamento, preço)"],
    ],
    [0.38, 0.62],
)
h += [Spacer(1, 10)] + caixa("dica", "Rotina sugerida",
      ["<b>Todo dia:</b> lançar as ordenhas e olhar os alertas do Painel.",
       "<b>Quando acontecer:</b> registrar partos, serviços, diagnósticos, secagens e tratamentos.",
       "<b>A cada pagamento:</b> atualizar o preço do leite.",
       "<b>Toda semana:</b> lançar as despesas.",
       "<b>Todo mês:</b> olhar o resultado, o custo por litro, a margem das vacas e as sugestões."])


# ---------------------------------------------------------------------------

def gerar():
    doc = Documento(str(SAIDA), pagesize=A4, leftMargin=MARGEM, rightMargin=MARGEM,
                    topMargin=20 * mm, bottomMargin=20 * mm, title="Meu Rebanho — Manual",
                    author="Meu Rebanho", subject="Manual de instruções e uso")
    quadro = Frame(MARGEM, 20 * mm, UTIL, ALTURA - 40 * mm, id="f")
    doc.addPageTemplates([
        PageTemplate(id="capa", frames=[quadro], onPage=capa),
        PageTemplate(id="normal", frames=[quadro], onPage=pagina),
    ])
    doc.multiBuild(h)
    print(f"Gerado: {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    gerar()
