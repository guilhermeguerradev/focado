import type { PostgrestError } from '@supabase/supabase-js';

import { ehCorMateria, type CorMateria } from '@/domain/materia';

import { supabase } from './supabase';

// Matérias do usuário logado (tabela public.materia).
// Criar e arquivar passam pelas funções do servidor (limite do plano).

export type Materia = { id: string; nome: string; cor: CorMateria };

// Traduz os códigos de erro do banco para mensagens em português.
function traduzirErro(erro: PostgrestError): string {
  switch (erro.code) {
    case 'FC001':
      return 'Você atingiu o limite de 4 matérias do plano gratuito.';
    case '23505':
      return 'Você já tem uma matéria com esse nome.';
    case '23514':
      return 'Nome ou cor inválidos.';
    default:
      return 'Algo deu errado. Tente de novo.';
  }
}

// Confere cada linha que veio do banco antes de entregar para a tela.
function paraMateria(linha: { id: string; nome: string; cor: string }): Materia {
  if (!ehCorMateria(linha.cor)) {
    throw new Error(`Cor desconhecida vinda do servidor: ${linha.cor}`);
  }
  return { id: linha.id, nome: linha.nome, cor: linha.cor };
}

export async function listarMateriasAtivas(): Promise<Materia[]> {
  const { data, error } = await supabase
    .from('materia')
    .select('id, nome, cor')
    .is('arquivada_em', null)
    .order('criada_em');

  if (error) throw new Error('Não consegui carregar suas matérias.');
  return data.map(paraMateria);
}

export async function buscarMateria(id: string): Promise<Materia> {
  const { data, error } = await supabase
    .from('materia')
    .select('id, nome, cor')
    .eq('id', id)
    .is('arquivada_em', null)
    .single();

  if (error) throw new Error('Matéria não encontrada.');
  return paraMateria(data);
}

export async function criarMateria(nome: string, cor: CorMateria): Promise<void> {
  const { error } = await supabase.rpc('criar_materia', {
    nome_materia: nome.trim(),
    cor_materia: cor,
  });
  if (error) throw new Error(traduzirErro(error));
}

export async function editarMateria(id: string, nome: string, cor: CorMateria): Promise<void> {
  const { data, error } = await supabase
    .from('materia')
    .update({ nome: nome.trim(), cor })
    .eq('id', id)
    .select('id');

  if (error) throw new Error(traduzirErro(error));
  // Nenhuma linha alterada = a matéria não existe mais (ou não é sua).
  if (data.length === 0) throw new Error('Matéria não encontrada.');
}

export async function arquivarMateria(id: string): Promise<void> {
  const { error } = await supabase.rpc('arquivar_materia', { id_materia: id });
  if (error) throw new Error(traduzirErro(error));
}
