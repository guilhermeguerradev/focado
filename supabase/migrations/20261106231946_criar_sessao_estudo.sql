-- =====================================================================
-- SESSÕES DE ESTUDO (PRD 3.4, 3.6) — gravadas pelo servidor ao finalizar.
-- O servidor RECALCULA e valida tudo: nunca confia no total vindo do app.
-- =====================================================================

-- Extensão que permite a regra "sem sessões sobrepostas" (ver constraint abaixo).
create extension if not exists btree_gist with schema extensions;

create table public.sessao_estudo (
  id uuid primary key default gen_random_uuid(),

  -- Identificador gerado no celular. UNIQUE = a mesma sessão nunca conta 2x.
  session_id uuid not null unique,

  dono_id uuid not null references public.perfil (id) on delete cascade,
  materia_id uuid not null references public.materia (id) on delete cascade,

  -- Primeiro início da sessão, em UTC.
  iniciada_em timestamptz not null,

  -- Duração já validada pelo servidor: de 1 min a 12h (PRD 3.4 e 3.6).
  duracao_segundos integer not null check (duracao_segundos between 60 and 43200),

  -- Intervalo [início, início + duração]. Sem as pausas, é sempre MENOR ou
  -- igual ao tempo real da sessão; serve para barrar sessões sobrepostas.
  periodo tstzrange not null,

  -- Dia da sessão no fuso do usuário (PRD 1.3 e 3.6), calculado pelo servidor.
  dia date not null,

  -- Quando o servidor recebeu (relógio do servidor).
  recebida_em timestamptz not null default now(),

  -- Regra do banco: o mesmo usuário não pode ter duas sessões cujos
  -- períodos se cruzem (ninguém estuda duas coisas ao mesmo tempo).
  constraint sessao_sem_sobreposicao
    exclude using gist (dono_id with =, periodo with &&)
);

create index sessao_estudo_dono_dia on public.sessao_estudo (dono_id, dia);

-- ---------------------------------------------------------------------
-- SEGURANÇA: cada um só LÊ as próprias sessões. Ninguém insere, edita
-- ou apaga direto — gravar é só pela função finalizar_sessao.
-- ---------------------------------------------------------------------
alter table public.sessao_estudo enable row level security;

revoke all on table public.sessao_estudo from anon, authenticated;
grant select on table public.sessao_estudo to authenticated;

create policy "usuario le as proprias sessoes"
  on public.sessao_estudo
  for select
  to authenticated
  using ((select auth.uid()) = dono_id);

-- ---------------------------------------------------------------------
-- FINALIZAR SESSÃO (idempotente)
-- Códigos de erro próprios do Focado (recusas DEFINITIVAS: a sessão sai da fila):
--   FC002 = sessão curta demais (menos de 1 minuto, já com as correções)
--   FC003 = matéria inválida (não existe ou é de outra pessoa)
--   FC004 = sessão no futuro
--   FC005 = esse session_id já pertence a outra pessoa
--   23P01 = sobrepõe outra sessão (regra do banco)
-- ---------------------------------------------------------------------
create function public.finalizar_sessao(
  id_sessao uuid,
  id_materia uuid,
  iniciada_em timestamptz,
  duracao_segundos integer
)
returns public.sessao_estudo
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  teto constant integer := 43200;              -- 12h (PRD 3.4)
  minimo constant integer := 60;               -- 1 min (PRD 3.6)
  tolerancia constant interval := interval '5 minutes'; -- relógio do celular um pouco adiantado
  existente public.sessao_estudo;
  segundos_reais integer;
  duracao_final integer;
  fuso_usuario text;
  gravada public.sessao_estudo;
begin
  if usuario is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  -- 1) IDEMPOTÊNCIA: essa sessão já chegou antes? Devolve a mesma, sem contar de novo.
  select * into existente from public.sessao_estudo s where s.session_id = id_sessao;
  if found then
    if existente.dono_id <> usuario then
      raise exception 'Sessão inválida.' using errcode = 'FC005';
    end if;
    return existente;
  end if;

  -- 2) Matéria precisa ser do próprio usuário (arquivada vale: a sessão
  --    pode ter começado antes de arquivar).
  if not exists (
    select 1 from public.materia m where m.id = id_materia and m.dono_id = usuario
  ) then
    raise exception 'Matéria inválida.' using errcode = 'FC003';
  end if;

  -- 3) Nada no futuro (com pequena tolerância para relógio adiantado).
  if iniciada_em > now() + tolerancia then
    raise exception 'Sessão no futuro.' using errcode = 'FC004';
  end if;

  -- 4) O SERVIDOR decide a duração: nunca mais que 12h e nunca mais que o
  --    tempo que realmente passou desde o início (pelo relógio DELE).
  segundos_reais := floor(extract(epoch from (now() + tolerancia - iniciada_em)))::integer;
  duracao_final := least(greatest(duracao_segundos, 0), teto, segundos_reais);

  if duracao_final < minimo then
    raise exception 'Sessão muito curta.' using errcode = 'FC002';
  end if;

  -- 5) Dia da sessão = dia em que começou, no fuso do usuário.
  select p.fuso into fuso_usuario from public.perfil p where p.id = usuario;

  -- "on conflict do nothing": se duas cópias da mesma sessão chegarem ao
  -- mesmo tempo, só uma grava; a outra encontra a gravada logo abaixo.
  insert into public.sessao_estudo
    (session_id, dono_id, materia_id, iniciada_em, duracao_segundos, periodo, dia)
  values (
    id_sessao,
    usuario,
    id_materia,
    iniciada_em,
    duracao_final,
    tstzrange(iniciada_em, iniciada_em + make_interval(secs => duracao_final)),
    (iniciada_em at time zone fuso_usuario)::date
  )
  on conflict (session_id) do nothing
  returning * into gravada;

  if gravada.id is null then
    select * into gravada from public.sessao_estudo s where s.session_id = id_sessao;
    if gravada.dono_id <> usuario then
      raise exception 'Sessão inválida.' using errcode = 'FC005';
    end if;
  end if;

  return gravada;
end;
$$;

-- ---------------------------------------------------------------------
-- TEMPO ESTUDADO HOJE: soma das sessões do dia atual, no fuso do usuário.
-- ---------------------------------------------------------------------
create function public.tempo_estudado_hoje()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(s.duracao_segundos), 0)::integer
    from public.sessao_estudo s
    join public.perfil p on p.id = s.dono_id
   where s.dono_id = auth.uid()
     and s.dia = (now() at time zone p.fuso)::date;
$$;

revoke all on function public.finalizar_sessao(uuid, uuid, timestamptz, integer) from public, anon;
grant execute on function public.finalizar_sessao(uuid, uuid, timestamptz, integer) to authenticated;
revoke all on function public.tempo_estudado_hoje() from public, anon;
grant execute on function public.tempo_estudado_hoje() to authenticated;
