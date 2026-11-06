-- =====================================================================
-- Nome da matéria passa de 40 para no máximo 20 caracteres (PRD 3.5, v1.5),
-- para caber nas pílulas da tela inicial sem quebrar o layout.
-- =====================================================================

alter table public.materia
  drop constraint materia_nome_check;

-- "not valid": a regra vale para TODA inserção e edição daqui em diante,
-- mas não reprova as matérias que já existem com nome maior (elas continuam
-- existindo; ao editar uma delas, será preciso encurtar o nome).
alter table public.materia
  add constraint materia_nome_check
  check (nome = btrim(nome) and char_length(nome) between 1 and 20)
  not valid;
