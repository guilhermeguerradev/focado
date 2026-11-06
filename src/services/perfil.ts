import { supabase } from './supabase';

// Leitura do perfil do usuário logado (tabela public.perfil).

export type Perfil = {
  nome: string;
  fuso: string;
  meta_diaria_minutos: number;
  avatar: string | null;
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
    .select('nome, fuso, meta_diaria_minutos, avatar')
    .eq('id', usuario.id)
    .single();

  if (error) {
    throw new Error('Não consegui carregar seu perfil.');
  }
  return data;
}
