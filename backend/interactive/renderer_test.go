package interactive

import (
	"testing"
)

// ─────────────────────────────────────────────────────────────────────────────
// Maiuscula
// ─────────────────────────────────────────────────────────────────────────────

func TestMaiuscula(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		{"string vazia", "", ""},
		{"já maiúscula", "Azul", "Azul"},
		{"ASCII minúsculo", "azul", "Azul"},
		{"acento inicial minúsculo", "ítalo", "Ítalo"},
		{"cedilha inicial", "çumaré", "Çumaré"},
		{"til inicial a-til", "ãngulo", "Ãngulo"},
		{"circunflexo inicial", "âmbar", "Âmbar"},
		{"string de um caractere", "a", "A"},
		{"maiúscula no meio não muda o resto", "aZUL", "AZUL"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Maiuscula(tc.input)
			if got != tc.want {
				t.Errorf("Maiuscula(%q) = %q; quer %q", tc.input, got, tc.want)
			}
		})
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// PluralizePTBR
// ─────────────────────────────────────────────────────────────────────────────

func TestPluralizePTBR(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  string
	}{
		// Regra 1: trava de segurança — já termina em 's'
		{"trava: já plural minúsculo", "pretos", "pretos"},
		{"trava: já plural maiúsculo S", "PRETOS", "PRETOS"},
		{"trava: termina em s minúsculo", "verdes", "verdes"},

		// Regra 2: termina em 'l' → 'is'
		{"azul → azuis", "azul", "azuis"},
		{"fiel → fieis", "fiel", "fieis"},
		{"AZUL maiúsculo → AZUis", "AZUL", "AZUis"},

		// Regra 3: termina em 'm' → 'ns'
		{"marrom → marrons", "marrom", "marrons"},
		{"ruim → ruins", "ruim", "ruins"},
		{"MARROM maiúsculo → MARROns", "MARROM", "MARROns"},

		// Regra 4: fallback → adiciona 's'
		{"verde → verdes", "verde", "verdes"},
		{"alto → altos", "alto", "altos"},
		{"rosa → rosas", "rosa", "rosas"},
		{"amarelo → amarelos", "amarelo", "amarelos"},

		// Edge cases
		{"string vazia retorna vazia", "", ""},
		{"só espaços retorna original", "   ", "   "},
		{"palavra com espaço final: azul ", "azul ", "azuis"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := PluralizePTBR(tc.input)
			if got != tc.want {
				t.Errorf("PluralizePTBR(%q) = %q; quer %q", tc.input, got, tc.want)
			}
		})
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// shouldAutoCapitalize (auxiliar, testada indiretamente via RenderContent
// mas também diretamente para garantir cobertura das regras de posição)
// ─────────────────────────────────────────────────────────────────────────────

func TestShouldAutoCapitalize(t *testing.T) {
	cases := []struct {
		name    string
		text    string
		bytePos int
		want    bool
	}{
		{"início absoluto do texto", "{{x}}", 0, true},
		{"só espaços antes", "   {{x}}", 3, true},
		{"após ponto final", "Fim. {{x}}", 5, true},
		{"após exclamação", "Viva! {{x}}", 6, true},
		{"após interrogação", "Tudo? {{x}}", 6, true},
		{"após quebra de linha \\n", "Linha.\n{{x}}", 7, true},
		{"após travessão —", "— {{x}}", 3, true},
		{"após hífen -", "- {{x}}", 2, true},
		{"após aspas duplas \"", "\"{{x}}", 1, true},
		{"após aspas simples '", "'{{x}}", 1, true},
		// NÃO deve capitalizar
		{"após vírgula ,", "Olá, {{x}}", 5, false},
		{"após letra normal a", "era {{x}}", 4, false},
		{"no meio da sentença", "O {{x}} chegou", 2, false},
		{"após dois pontos :", "Cor: {{x}}", 5, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := shouldAutoCapitalize(tc.text, tc.bytePos)
			if got != tc.want {
				t.Errorf("shouldAutoCapitalize(%q, %d) = %v; quer %v",
					tc.text, tc.bytePos, got, tc.want)
			}
		})
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// RenderContent — integração completa
// ─────────────────────────────────────────────────────────────────────────────

func TestRenderContent(t *testing.T) {
	cases := []struct {
		name string
		text string
		vars map[string]string
		want string
	}{
		// ── Substituição básica ──────────────────────────────────────────────
		{
			name: "substituição simples sem filtros",
			text: "Olá, {{nome}}!",
			vars: map[string]string{"nome": "maria"},
			want: "Olá, maria!",
		},
		{
			name: "sintaxe com espaços {{ nome }}",
			text: "Cor: {{ nome }}.",
			vars: map[string]string{"nome": "azul"},
			want: "Cor: azul.",
		},
		{
			name: "variável desconhecida preserva tag original",
			text: "Cor: {{desconhecida}}.",
			vars: map[string]string{},
			want: "Cor: {{desconhecida}}.",
		},
		{
			name: "nenhuma tag no texto",
			text: "Texto simples sem tags.",
			vars: map[string]string{"nome": "maria"},
			want: "Texto simples sem tags.",
		},
		{
			name: "múltiplas tags no mesmo texto",
			text: "{{nome}} tem cabelo {{cor_cabelo}}.",
			vars: map[string]string{"nome": "sofia", "cor_cabelo": "preto"},
			want: "Sofia tem cabelo preto.",
		},

		// ── Auto-capitalização ───────────────────────────────────────────────
		{
			name: "auto-cap no início absoluto do texto",
			text: "{{nome}} chegou.",
			vars: map[string]string{"nome": "ela"},
			want: "Ela chegou.",
		},
		{
			name: "auto-cap após ponto final",
			text: "Fim. {{nome}} sorriu.",
			vars: map[string]string{"nome": "ela"},
			want: "Fim. Ela sorriu.",
		},
		{
			name: "auto-cap após exclamação",
			text: "Incrível! {{nome}} voltou.",
			vars: map[string]string{"nome": "ela"},
			want: "Incrível! Ela voltou.",
		},
		{
			name: "auto-cap após quebra de linha",
			text: "Capítulo 1.\n{{nome}} acordou cedo.",
			vars: map[string]string{"nome": "ela"},
			want: "Capítulo 1.\nEla acordou cedo.",
		},
		{
			name: "auto-cap após travessão — (diálogo PT-BR)",
			text: "— {{nome}} disse baixinho.",
			vars: map[string]string{"nome": "ele"},
			want: "— Ele disse baixinho.",
		},
		{
			name: "SEM auto-cap no meio de sentença",
			text: "O cabelo de {{nome}} é lindo.",
			vars: map[string]string{"nome": "ela"},
			want: "O cabelo de ela é lindo.",
		},
		{
			name: "SEM auto-cap após vírgula",
			text: "Lindo, {{adjetivo}}.",
			vars: map[string]string{"adjetivo": "perfeito"},
			want: "Lindo, perfeito.",
		},

		// ── Filtro maiuscula explícito ────────────────────────────────────────
		{
			name: "filtro maiuscula no meio da frase",
			text: "Seu cabelo é {{ cor_cabelo ; maiuscula }}.",
			vars: map[string]string{"cor_cabelo": "preto"},
			want: "Seu cabelo é Preto.",
		},

		// ── Filtro plural ────────────────────────────────────────────────────
		{
			name: "filtro plural: fallback (adiciona s)",
			text: "Seus cabelos são {{ cor_cabelo ; plural }}.",
			vars: map[string]string{"cor_cabelo": "verde"},
			want: "Seus cabelos são verdes.",
		},
		{
			name: "filtro plural: termina em l",
			text: "Olhos {{ cor_olho ; plural }}.",
			vars: map[string]string{"cor_olho": "azul"},
			want: "Olhos azuis.",
		},
		{
			name: "filtro plural: termina em m",
			text: "Fios {{ cor ; plural }}.",
			vars: map[string]string{"cor": "marrom"},
			want: "Fios marrons.",
		},
		{
			name: "filtro plural: trava de segurança (já plural em s)",
			text: "Olhos {{ cor_olho ; plural }}.",
			vars: map[string]string{"cor_olho": "pretos"},
			want: "Olhos pretos.",
		},

		// ── Múltiplos filtros ────────────────────────────────────────────────
		{
			name: "plural + maiuscula em sequência",
			text: "{{ cor_cabelo ; plural ; maiuscula }} cabelos.",
			vars: map[string]string{"cor_cabelo": "azul"},
			want: "Azuis cabelos.",
		},
		{
			name: "plural + maiuscula com auto-cap (início do texto)",
			text: "{{ cor ; plural ; maiuscula }} olhos.",
			vars: map[string]string{"cor": "verde"},
			want: "Verdes olhos.",
		},

		// ── Válvula de escape ;minuscula ─────────────────────────────────────
		{
			name: "minuscula impede auto-capitalização no início do texto",
			text: "{{ nome ; minuscula }} estava aqui.",
			vars: map[string]string{"nome": "MARIA"},
			want: "maria estava aqui.",
		},
		{
			name: "minuscula impede auto-cap após ponto final",
			text: "Fim. {{ nome ; minuscula }} entrou.",
			vars: map[string]string{"nome": "SOFIA"},
			want: "Fim. sofia entrou.",
		},
		{
			name: "minuscula no meio da frase (sem auto-cap de qualquer forma)",
			text: "O nome {{ nome ; minuscula }} apareceu.",
			vars: map[string]string{"nome": "CARLOS"},
			want: "O nome carlos apareceu.",
		},

		// ── UTF-8 / PT-BR ────────────────────────────────────────────────────
		{
			name: "auto-cap com runa acentuada inicial",
			text: "{{adjetivo}} é sua cor.",
			vars: map[string]string{"adjetivo": "ígneo"},
			want: "Ígneo é sua cor.",
		},
		{
			name: "variável com valor acentuado não sofre dano",
			text: "Cor: {{cor}}.",
			vars: map[string]string{"cor": "âmbar"},
			want: "Cor: âmbar.",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := RenderContent(tc.text, tc.vars)
			if got != tc.want {
				t.Errorf("\ntexto:    %q\nvars:     %v\nobteve:   %q\nesperado: %q",
					tc.text, tc.vars, got, tc.want)
			}
		})
	}
}
