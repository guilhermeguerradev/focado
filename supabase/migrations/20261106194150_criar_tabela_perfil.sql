-- =====================================================================
-- Tabela PERFIL: os dados de cada usuário do Focado (PRD 1.3, 1.4 e 7).
-- Cada linha pertence a exatamente um usuário do Supabase Auth.
-- =====================================================================

-- Confere se um texto é um fuso horário IANA que o Postgres conhece
-- (ex.: 'America/Sao_Paulo'). Usado na regra (CHECK) da coluna fuso.
create function public.fuso_valido(fuso text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_timezone_names where name = fuso
  );
$$;

create table public.perfil (
  -- Mesmo id do usuário no Auth. Se a conta for apagada, o perfil vai junto.
  id uuid primary key references auth.users (id) on delete cascade,

  -- Nome obrigatório: sem espaços sobrando nas pontas, de 1 a 255 caracteres.
  -- (No Postgres, "text + CHECK de tamanho" é o recomendado no lugar de varchar(n).)
  nome text not null
    check (nome = btrim(nome) and char_length(nome) between 1 and 255),

  -- Avatar pré-definido: escolhido na Etapa 7. Vazio até lá.
  avatar text,

  -- Meta diária: só os valores do pop-up (PRD 1.4). Padrão: 30 min.
  meta_diaria_minutos integer not null default 30
    check (meta_diaria_minutos in (15, 30, 45, 60, 90, 120)),

  -- Fuso IANA do usuário. Só aceita fusos que existem de verdade.
  fuso text not null
    check (public.fuso_valido(fuso)),

  -- Horário de criação, sempre em UTC, pelo relógio do servidor.
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SEGURANÇA
-- ---------------------------------------------------------------------

-- 1) RLS ligado: sem uma política que permita, ninguém lê nem escreve nada.
alter table public.perfil enable row level security;

-- 2) Permissões por coluna (defesa em profundidade).
--    Por padrão o Supabase deixa o app fazer tudo na tabela.
--    Aqui tiramos tudo e devolvemos só o mínimo:
--    - visitante sem login (anon): nada.
--    - usuário logado: pode LER, e EDITAR apenas nome e fuso.
--    Meta e avatar mudam só por funções no servidor (etapas futuras).
--    Criar perfil: só o próprio servidor, no cadastro (próximo passo).
revoke all on table public.perfil from anon, authenticated;
grant select on table public.perfil to authenticated;
grant update (nome, fuso) on table public.perfil to authenticated;

-- 3) Políticas de RLS: cada um só enxerga e edita a PRÓPRIA linha.
--    auth.uid() é o id de quem está logado, decidido pelo servidor
--    a partir do token de login (o app não consegue fingir outro id).
create policy "usuario le o proprio perfil"
  on public.perfil
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "usuario edita o proprio perfil"
  on public.perfil
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
