// Package interactive — motor de renderização de tags personalizadas do Lollipopfics.
//
// Sintaxe suportada:
//
//	{{ nome_variavel }}
//	{{ cor_cabelo ; maiuscula }}
//	{{ cor_cabelo ; plural ; maiuscula }}
//
// Filtros disponíveis: maiuscula, minuscula, plural.
// Auto-capitalização é aplicada automaticamente em inícios de frase.
package interactive

import (
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

// tagRegex captura tags no formato {{ varname }} ou {{ varname ; filtro1 ; filtro2 }}.
//
//	Grupo 1 — nome da variável (sem espaços, ';' ou chaves)
//	Grupo 2 — cadeia de filtros após o primeiro ';' (opcional)
var tagRegex = regexp.MustCompile(`\{\{\s*([^\s;{}]+)\s*(?:;([^}]*))?\}\}`)

// sentenceStarters são os caracteres que indicam início de frase/fala.
// Ao encontrá-los imediatamente antes de uma tag (ignorando espaços), a
// auto-capitalização é ativada.
var sentenceStarters = map[rune]bool{
	'\n': true, '\r': true,
	'.': true, '!': true, '?': true,
	// Travessão, hífen e aspas de diálogo
	'—': true, '-': true,
	'"': true, '\'': true,
	'\u201C': true, '\u201D': true, // " "
	'\u2018': true, '\u2019': true, // ' '
}

// Maiuscula capitaliza a primeira runa Unicode de s.
// Trata corretamente caracteres acentuados do PT-BR (e.g. "ítalo" → "Ítalo").
func Maiuscula(s string) string {
	if s == "" {
		return s
	}
	r, size := utf8.DecodeRuneInString(s)
	if r == utf8.RuneError && size <= 1 {
		return s
	}
	return string(unicode.ToUpper(r)) + s[size:]
}

// PluralizePTBR aplica regras SIMPLIFICADAS de pluralização em PT-BR,
// focadas em adjetivos físicos e cores.
//
// Regras (em ordem):
//  1. Já termina em 's'/'S' → retorna sem modificar.
//  2. Termina em 'l'/'L'   → troca pela terminação "is"  (azul  → azuis).
//  3. Termina em 'm'/'M'   → troca pela terminação "ns"  (marrom → marrons).
//  4. Fallback              → adiciona 's'               (verde  → verdes).
func PluralizePTBR(word string) string {
	// Opera sobre a palavra sem espaços finais para identificar a última runa relevante.
	trimmed := strings.TrimRight(word, " \t")
	if trimmed == "" {
		return word
	}
	lastRune, size := utf8.DecodeLastRuneInString(trimmed)
	if lastRune == utf8.RuneError && size <= 1 {
		return word
	}
	lower := unicode.ToLower(lastRune)

	switch lower {
	case 's':
		// Regra 1: trava de segurança — já está no plural.
		return word
	case 'l':
		// Regra 2: azul → azuis, fiel → fieis
		return trimmed[:len(trimmed)-size] + "is"
	case 'm':
		// Regra 3: marrom → marrons
		return trimmed[:len(trimmed)-size] + "ns"
	default:
		// Regra 4 (fallback): verde → verdes, alto → altos
		return trimmed + "s"
	}
}

// shouldAutoCapitalize percorre o texto antes de bytePos de trás para frente,
// ignorando espaços e tabulações horizontais, e retorna true se a posição
// representa um início de frase (começo absoluto do texto, quebra de linha
// ou pontuação de finalização/diálogo).
func shouldAutoCapitalize(text string, bytePos int) bool {
	if bytePos == 0 {
		return true
	}
	// Converte o prefixo para runes para tratar corretamente o UTF-8.
	prefix := []rune(text[:bytePos])
	for i := len(prefix) - 1; i >= 0; i-- {
		r := prefix[i]
		// Ignora apenas espaço e tabulação horizontal — NÃO ignora '\n'/'\r'.
		if r == ' ' || r == '\t' {
			continue
		}
		return sentenceStarters[r]
	}
	// O prefixo inteiro era espaço em branco → início real do texto.
	return true
}

// RenderContent substitui as tags {{ variavel ; filtros }} no texto pelos
// valores fornecidos em vars, aplicando filtros e auto-capitalização.
//
// Comportamento:
//   - Variável encontrada: aplica auto-capitalização (se cabível), depois os
//     filtros explícitos em ordem, e substitui.
//   - Variável não encontrada: preserva a tag original intacta.
//   - Filtro ;minuscula: força minúsculas E impede a auto-capitalização.
func RenderContent(text string, vars map[string]string) string {
	allMatches := tagRegex.FindAllStringSubmatchIndex(text, -1)
	if len(allMatches) == 0 {
		return text
	}

	var b strings.Builder
	b.Grow(len(text))
	lastEnd := 0

	for _, loc := range allMatches {
		matchStart, matchEnd := loc[0], loc[1]
		varName := strings.TrimSpace(text[loc[2]:loc[3]])

		value, exists := vars[varName]
		if !exists {
			// Preserva tag original (inclusive os delimitadores {{ }})
			b.WriteString(text[lastEnd:matchEnd])
			lastEnd = matchEnd
			continue
		}

		// Emite o trecho de texto antes desta tag.
		b.WriteString(text[lastEnd:matchStart])

		// ── Parseia a lista de filtros ──────────────────────────────────────
		var filters []string
		hasMinuscula := false
		if loc[4] != -1 {
			for _, part := range strings.Split(text[loc[4]:loc[5]], ";") {
				f := strings.TrimSpace(part)
				if f == "" {
					continue
				}
				filters = append(filters, f)
				if f == "minuscula" {
					hasMinuscula = true
				}
			}
		}

		// ── Auto-capitalização (bloqueada por ;minuscula) ───────────────────
		if !hasMinuscula && shouldAutoCapitalize(text, matchStart) {
			value = Maiuscula(value)
		}

		// ── Aplica filtros explícitos em ordem ──────────────────────────────
		for _, f := range filters {
			switch f {
			case "maiuscula":
				value = Maiuscula(value)
			case "plural":
				value = PluralizePTBR(value)
			case "minuscula":
				value = strings.ToLower(value)
			}
		}

		b.WriteString(value)
		lastEnd = matchEnd
	}

	// Emite o restante do texto após a última tag.
	b.WriteString(text[lastEnd:])
	return b.String()
}
