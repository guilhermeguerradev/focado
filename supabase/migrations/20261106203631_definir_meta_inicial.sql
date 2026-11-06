-- =====================================================================
-- Pop-up da meta diária (PRD 1.4): a "porta da frente" para a meta.
-- =====================================================================

-- Quando o usuário respondeu (ou pulou) o pop-up. Vazio = ainda não respondeu.
-- O app pode LER (permissão de leitura da tabela), mas não pode EDITAR:
-- a permissão de edição por coluna continua só para nome e fuso.
alter table public.perfil
  add column meta_escolhida_em timestamptz;

-- Define a meta pela primeira vez, a partir do pop-up.
-- - minutos: 15, 30, 45, 60, 90 ou 120. Vazio (null) = "pulou": fica a meta atual (30).
-- - Só vale UMA vez: se o pop-up já foi respondido, a chamada é ignorada
--   (idempotente: chamar 2x dá o mesmo resultado que 1x).
-- - Sempre age sobre o usuário logado (auth.uid()): ninguém define a meta de outro.
-- Devolve a meta que ficou valendo.
create function public.definir_meta_inicial(minutos integer default null)
returns integer
language plpgsql
-- Roda com permissão do dono do banco, porque o usuário não pode editar
-- essas colunas direto. As regras abaixo são o "porteiro".
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  meta_final integer;
begin
  if usuario is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  if minutos is not null and minutos not in (15, 30, 45, 60, 90, 120) then
    raise exception 'Meta inválida: escolha 15, 30, 45, 60, 90 ou 120 minutos.'
      using errcode = '22023';
  end if;

  -- Um único comando que confere E grava ao mesmo tempo:
  -- só altera se o pop-up ainda não foi respondido (meta_escolhida_em vazio).
  -- Duas chamadas simultâneas não conseguem gravar as duas: o banco trava a
  -- linha durante o UPDATE, e a segunda já encontra meta_escolhida_em preenchido.
  update public.perfil
     set meta_diaria_minutos = coalesce(minutos, meta_diaria_minutos),
         meta_escolhida_em = now() -- relógio do SERVIDOR, nunca o do celular
   where id = usuario
     and meta_escolhida_em is null;

  select meta_diaria_minutos into meta_final
    from public.perfil
   where id = usuario;

  return meta_final;
end;
$$;

-- Só usuário logado pode chamar a função.
revoke all on function public.definir_meta_inicial(integer) from public, anon;
grant execute on function public.definir_meta_inicial(integer) to authenticated;
