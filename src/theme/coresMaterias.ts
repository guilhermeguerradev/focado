import type { CorMateria } from '@/domain/materia';

// Tom de cada cor de matéria, no estilo das "pílulas" do design:
// - principal: bolinha e destaques (gráficos)
// - fundo: fundo clarinho da pílula
// - texto: nome da matéria sobre o fundo clarinho (contraste legível)
// Mudou o design? Só este arquivo muda; o banco guarda apenas o nome da cor.
export const coresMaterias: Record<
  CorMateria,
  { principal: string; fundo: string; texto: string }
> = {
  roxo: { principal: '#7C6BF5', fundo: '#F0EDFF', texto: '#5B4BD8' },
  turquesa: { principal: '#14C4CE', fundo: '#E7FAFB', texto: '#0FA6B0' },
  laranja: { principal: '#FF7A59', fundo: '#FFEEE8', texto: '#E5603F' },
  amarelo: { principal: '#F5A623', fundo: '#FFF6E3', texto: '#E0910F' },
  verde: { principal: '#22C55E', fundo: '#E8F9EF', texto: '#16A34A' },
  rosa: { principal: '#EC4899', fundo: '#FDEAF4', texto: '#DB2777' },
  azul: { principal: '#3B82F6', fundo: '#E8F0FE', texto: '#2563EB' },
  vermelho: { principal: '#EF4444', fundo: '#FDECEC', texto: '#DC2626' },
};
