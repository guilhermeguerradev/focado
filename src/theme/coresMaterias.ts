import type { CorMateria } from '@/domain/materia';

// Tom de cada cor de matéria, no estilo das "pílulas" do design:
// - principal: bolinha e destaques (gráficos), 1ª volta do anel
// - fundo: fundo clarinho da pílula e trilha vazia do anel
// - texto: nome da matéria sobre o fundo clarinho (contraste legível)
// - escuro: voltas pares do anel (2ª, 4ª...), para se destacar sobre a anterior
// Mudou o design? Só este arquivo muda; o banco guarda apenas o nome da cor.
export const coresMaterias: Record<
  CorMateria,
  { principal: string; fundo: string; texto: string; escuro: string }
> = {
  roxo: { principal: '#7C6BF5', fundo: '#F0EDFF', texto: '#5B4BD8', escuro: '#4E3FD0' },
  turquesa: { principal: '#14C4CE', fundo: '#E7FAFB', texto: '#0FA6B0', escuro: '#0B8A92' },
  laranja: { principal: '#FF7A59', fundo: '#FFEEE8', texto: '#E5603F', escuro: '#D9502F' },
  amarelo: { principal: '#F5A623', fundo: '#FFF6E3', texto: '#E0910F', escuro: '#C27C08' },
  verde: { principal: '#22C55E', fundo: '#E8F9EF', texto: '#16A34A', escuro: '#15803D' },
  rosa: { principal: '#EC4899', fundo: '#FDEAF4', texto: '#DB2777', escuro: '#BE185D' },
  azul: { principal: '#3B82F6', fundo: '#E8F0FE', texto: '#2563EB', escuro: '#1D4ED8' },
  vermelho: { principal: '#EF4444', fundo: '#FDECEC', texto: '#DC2626', escuro: '#B91C1C' },
};
