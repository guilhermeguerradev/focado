-- =====================================================================
-- MATÉRIAS (PRD 3.5 e 8.2): nome + cor, limite de 4 no plano Free.
-- =====================================================================

create table public.materia (
  id uuid primary key default gen_random_uuid(),

  -- Dono da matéria. Se o perfil (conta) for apagado, as matérias vão junto.
  dono_id uuid not null references public.perfil (id) on delete cascade,

  -- Nome: sem espaços sobrando nas pontas, de 1 a 40 caracteres.
  nome text not null
    check (nome = btrim(nome) and char_length(nome) between 1 and 40),

  -- Cor pelo NOME (o tom exato fica no tema do app). Só a paleta do PRD 3.5.
  cor text not null
    check (cor in ('roxo', 'turquesa', 'laranja', 'amarelo', 'verde', 'rosa', 'azul', 'vermelho')),

  criada_em timestamptz not null default now(),

  -- Excluir = arquivar (PRD 3.5). Vazio = ativa. Preenchido = arquivada.
  arquivada_em timestamptz
);

-- Nome não repete entre as matérias ATIVAS do mesmo dono, ignorando
-- maiúsculas ("Inglês" = "inglês"). Matéria arquivada não conta.
-- É uma regra do banco: vale mesmo se o app (ou eu) errar.
create unique index materia_nome_unico_entre_ativas
  on public.materia (dono_id, lower(nome))
  where arquivada_em is null;

-- ---------------------------------------------------------------------
-- SEGURANÇA
-- ---------------------------------------------------------------------
alter table public.materia enable row level security;

-- Permissões mínimas: logado pode LER e EDITAR nome e cor.
-- Criar e arquivar: só pelas funções abaixo (por causa do limite).
revoke all on table public.materia from anon, authenticated;
grant select on table public.materia to authenticated;
grant update (nome, cor) on table public.materia to authenticated;

create policy "usuario le as proprias materias"
  on public.materia
  for select
  to authenticated
  using ((select auth.uid()) = dono_id);

-- Só edita matéria própria e ATIVA (arquivada fica congelada).
create policy "usuario edita as proprias materias ativas"
  on public.materia
  for update
  to authenticated
  using ((select auth.uid()) = dono_id and arquivada_em is null)
  with check ((select auth.uid()) = dono_id);

-- ---------------------------------------------------------------------
-- CRIAR MATÉRIA (com limite do plano Free)
-- ---------------------------------------------------------------------
-- Código de erro próprio do Focado para "limite do plano atingido".
-- (Códigos que começam com letra fora do padrão do Postgres são livres.)
--   FC001 = limite do plano Free atingido
create function public.criar_materia(nome_materia text, cor_materia text)
returns public.materia
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  limite_free constant integer := 4; -- PRD 8.2. Premium chega na Etapa 13.
  total_ativas integer;
  nova public.materia;
begin
  if usuario is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  -- TRAVA: bloqueia a linha do perfil do usuário até o fim da transação.
  -- Se duas criações chegarem juntas, a segunda ESPERA a primeira terminar
  -- e só então conta. Assim nunca contam as duas "3" ao mesmo tempo.
  -- (Travar as matérias não bastaria: a matéria nova ainda não existe.)
  perform 1 from public.perfil where id = usuario for update;

  select count(*) into total_ativas
    from public.materia
   where dono_id = usuario
     and arquivada_em is null;

  if total_ativas >= limite_free then
    raise exception 'Você atingiu o limite de % matérias do plano gratuito.', limite_free
      using errcode = 'FC001';
  end if;

  insert into public.materia (dono_id, nome, cor)
  values (usuario, btrim(nome_materia), cor_materia)
  returning * into nova;

  return nova;
end;
$$;

-- ---------------------------------------------------------------------
-- ARQUIVAR MATÉRIA ("excluir")
-- ---------------------------------------------------------------------
-- Só arquiva matéria própria e ainda ativa. Chamar de novo, ou com o id
-- de matéria de outra pessoa, não faz nada (idempotente e seguro).
create function public.arquivar_materia(id_materia uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  update public.materia
     set arquivada_em = now()
   where id = id_materia
     and dono_id = auth.uid()
     and arquivada_em is null;
end;
$$;

revoke all on function public.criar_materia(text, text) from public, anon;
grant execute on function public.criar_materia(text, text) to authenticated;
revoke all on function public.arquivar_materia(uuid) from public, anon;
grant execute on function public.arquivar_materia(uuid) to authenticated;
