import { supabase } from './supabase';

// Leitura do perfil e definição da meta inicial (tabela public.perfil).

export type Perfil = {
  nome: string;
  fuso: string;
  meta_diaria_minutos: number;
  avatar: string | null;
  meta_escolhida_em: string | null; // vazio = pop-up da meta ainda não respondido
};

// Busca o perfil de quem está logado. O RLS do banco já garante que
// só a própria linha volta; o filtro por id deixa isso explícito.
export async function buscarMeuPerfil(): Promise<Perfil> {
  const { data: dadosSessao } = await supabase.auth.getSession();
  const usuario = dadosSessao.session?.user;
  if (!usuario) {
    throw new Error('Ninguém logado.');
  }

  const { data, error } = await supabase
    .from('perfil')
    .select('nome, fuso, meta_diaria_minutos, avatar, meta_escolhida_em')
    .eq('id', usuario.id)
    .single();

  if (error) {
    throw new Error('Não consegui carregar seu perfil.');
  }
  return data;
}

// Responde o pop-up da meta pela função do servidor (a "porta da frente").
// minutos = null significa "pulou": fica a meta padrão.
// Devolve a meta que ficou valendo.
export async function definirMetaInicial(minutos: number | null): Promise<number> {
  const { data, error } = await supabase.rpc(
    'definir_meta_inicial',
    minutos === null ? {} : { minutos },
  );

  // Confere de verdade o que o servidor mandou, em vez de só "confiar".
  if (error || typeof data !== 'number') {
    throw new Error('Não consegui salvar sua meta. Tente de novo.');
  }
  return data;
}
