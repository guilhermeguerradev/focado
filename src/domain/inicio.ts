// Regras puras da tela inicial (aba Estudar), seguindo o design.

// "Bom dia" (5h–11h), "Boa tarde" (12h–17h), "Boa noite" (18h–4h).
export function saudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Quanto da meta diária já foi cumprido: de 0 (nada) a 1 (meta batida).
// Passou da meta? Continua 1 (o anel fica cheio, não "dá a volta").
export function progressoDaMeta(segundosEstudados: number, metaMinutos: number): number {
  if (metaMinutos <= 0) return 0;
  const progresso = segundosEstudados / (metaMinutos * 60);
  return Math.min(1, Math.max(0, progresso));
}

// Voltas do anel do cronômetro: cada volta completa = uma meta diária.
// Ex.: meta 30 min e 45 min estudados → 1 volta completa + metade da 2ª.
// O anel desenha a volta atual por cima das que já fechou (quantas forem).
export function voltasDaMeta(
  segundosEstudados: number,
  metaMinutos: number,
): { voltasCompletas: number; progressoDaVolta: number } {
  if (metaMinutos <= 0) return { voltasCompletas: 0, progressoDaVolta: 0 };
  const voltas = Math.max(0, segundosEstudados) / (metaMinutos * 60);
  const voltasCompletas = Math.floor(voltas);
  return { voltasCompletas, progressoDaVolta: voltas - voltasCompletas };
}

// Formato do card "Tempo estudado hoje": "0min", "25min", "2h", "2h 10min".
export function formatarHorasMinutos(segundos: number): string {
  const totalMinutos = Math.floor(Math.max(0, segundos) / 60);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}min`;
}
