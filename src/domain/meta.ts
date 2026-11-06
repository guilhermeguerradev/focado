// Regras da meta diária (PRD 1.4 e 7.3).

// Opções do pop-up. São as mesmas que o banco aceita (CHECK da tabela perfil).
export const OPCOES_META_MINUTOS = [15, 30, 45, 60, 90, 120] as const;

export const META_PADRAO_MINUTOS = 30;

// Mostra minutos de um jeito fácil de ler:
// 45 → "45 min", 60 → "1h", 90 → "1h30", 120 → "2h".
export function formatarMinutos(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas}h`;
  return `${horas}h${String(resto).padStart(2, '0')}`;
}
