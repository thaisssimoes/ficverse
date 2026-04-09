// Substitui placeholders {{nome}} ou {nome} no conteúdo HTML por respostas do usuário.
// Lógica extraída de chapter-reader.js — nenhuma mudança de comportamento.
export function substitutePlaceholders(content, answers) {
  let processed = content;

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  for (const [placeholder, answer] of Object.entries(answers)) {
    const escaped = escapeRegex(placeholder);
    const regex = new RegExp(`\\{\\{${escaped}\\}\\}|\\{${escaped}\\}`, 'g');
    processed = processed.replace(regex, answer);
  }

  return processed;
}
