-- =====================================================================
-- Perfil criado AUTOMATICAMENTE no cadastro (PRD 1.4).
-- Quando o Supabase Auth cria um usuário, um gatilho (trigger) chama a
-- função abaixo, que cria a linha em public.perfil.
-- O app nunca insere o perfil direto: só manda nome e fuso no cadastro.
-- =====================================================================

create function public.criar_perfil_do_novo_usuario()
returns trigger
language plpgsql
-- "security definer": a função roda com as permissões de quem a criou
-- (o dono do banco), porque o usuário recém-criado não pode inserir
-- na tabela perfil por conta própria.
security definer
-- search_path vazio: obriga a escrever o nome completo (public.perfil),
-- impedindo que alguém "engane" a função com uma tabela de mesmo nome.
set search_path = ''
as $$
declare
  -- Dados enviados pelo app no cadastro (campo "data" do signUp).
  nome_recebido text := btrim(coalesce(new.raw_user_meta_data ->> 'nome', ''));
  fuso_recebido text := new.raw_user_meta_data ->> 'fuso';
begin
  -- Fuso ausente ou inválido: usa o padrão (o app sempre manda o detectado).
  if fuso_recebido is null or not public.fuso_valido(fuso_recebido) then
    fuso_recebido := 'America/Sao_Paulo';
  end if;

  -- Nome vazio é barrado pelo CHECK da tabela, e aí o cadastro inteiro
  -- é desfeito (usuário + perfil): é tudo uma transação só.
  insert into public.perfil (id, nome, fuso)
  values (new.id, nome_recebido, fuso_recebido);

  return new;
end;
$$;

-- Ninguém de fora pode chamar essa função diretamente; só o gatilho.
revoke all on function public.criar_perfil_do_novo_usuario() from public, anon, authenticated;

create trigger ao_criar_usuario_criar_perfil
  after insert on auth.users
  for each row
  execute function public.criar_perfil_do_novo_usuario();
