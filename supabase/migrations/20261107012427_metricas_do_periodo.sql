-- =====================================================================
-- MÉTRICAS DE UM PERÍODO (PRD 4.3): calculadas pelo SERVIDOR, só com as
-- sessões do usuário logado. O app manda só o intervalo de datas
-- (no fuso do usuário); a coluna "dia" das sessões já está nesse fuso.
-- =====================================================================

create function public.metricas_do_periodo(inicio date, fim date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  resultado jsonb;
begin
  if usuario is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  -- Intervalo válido: fim não antes do início, e no máximo 1 ano (366 dias).
  if inicio is null or fim is null or fim < inicio or fim - inicio > 366 then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;

  with sessoes_do_periodo as (
    select s.materia_id, s.duracao_segundos
      from public.sessao_estudo s
     where s.dono_id = usuario
       and s.dia between inicio and fim
  ),
  por_materia as (
    -- Inclui matérias ARQUIVADAS: o estudo antigo continua contando (PRD 3.5).
    select m.id, m.nome, m.cor, sum(sp.duracao_segundos)::integer as segundos
      from sessoes_do_periodo sp
      join public.materia m on m.id = sp.materia_id
     group by m.id, m.nome, m.cor
  )
  select jsonb_build_object(
    'total_segundos', coalesce((select sum(duracao_segundos) from sessoes_do_periodo), 0)::integer,
    'sessoes', (select count(*) from sessoes_do_periodo)::integer,
    'media_segundos', coalesce((select round(avg(duracao_segundos)) from sessoes_do_periodo), 0)::integer,
    -- Da mais estudada para a menos; empate desempata pelo nome.
    'por_materia', coalesce(
      (select jsonb_agg(
                jsonb_build_object('materia_id', id, 'nome', nome, 'cor', cor, 'segundos', segundos)
                order by segundos desc, nome
              )
         from por_materia),
      '[]'::jsonb
    )
  ) into resultado;

  return resultado;
end;
$$;

revoke all on function public.metricas_do_periodo(date, date) from public, anon;
grant execute on function public.metricas_do_periodo(date, date) to authenticated;
