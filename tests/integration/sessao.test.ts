import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import {
  apagarUsuarios,
  criarClienteVisitante,
  criarUsuarioDeTeste,
  type UsuarioDeTeste,
} from './ajudantes';

const PERMISSAO_NEGADA = '42501';
const SOBREPOSTA = '23P01'; // exclusion_violation (regra do banco)
const CURTA_DEMAIS = 'FC002';
const MATERIA_INVALIDA = 'FC003';
const NO_FUTURO = 'FC004';
const ID_DE_OUTRO = 'FC005';

const DOZE_HORAS = 12 * 3600;
const atras = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString();

const criados: UsuarioDeTeste[] = [];
async function novoUsuario(nome: string, fuso?: string) {
  const usuario = await criarUsuarioDeTeste(nome, fuso);
  criados.push(usuario);
  const { data } = await usuario.cliente.rpc('criar_materia', {
    nome_materia: 'Inglês',
    cor_materia: 'turquesa',
  });
  return { ...usuario, materiaId: data.id as string };
}

type Envio = { sessionId?: string; materiaId: string; iniciadaEm: string; duracao: number };
function finalizar(usuario: UsuarioDeTeste, envio: Envio) {
  return usuario.cliente.rpc('finalizar_sessao', {
    id_sessao: envio.sessionId ?? randomUUID(),
    id_materia: envio.materiaId,
    iniciada_em: envio.iniciadaEm,
    duracao_segundos: envio.duracao,
  });
}

async function totalGravado(usuario: UsuarioDeTeste): Promise<number> {
  const { data } = await usuario.cliente.from('sessao_estudo').select('duracao_segundos');
  return (data ?? []).reduce((soma, s) => soma + s.duracao_segundos, 0);
}

afterAll(async () => {
  await apagarUsuarios(criados);
});

describe('finalizar sessão: caminho normal', () => {
  it('grava a sessão com a duração enviada', async () => {
    const ana = await novoUsuario('Ana');

    const { data, error } = await finalizar(ana, {
      materiaId: ana.materiaId,
      iniciadaEm: atras(30),
      duracao: 1500,
    });

    expect(error).toBeNull();
    expect(data.duracao_segundos).toBe(1500);
    expect(await totalGravado(ana)).toBe(1500);
  });

  it('aceita sessão de matéria arquivada (começou antes de arquivar)', async () => {
    const bia = await novoUsuario('Bia');
    await bia.cliente.rpc('arquivar_materia', { id_materia: bia.materiaId });

    const { error } = await finalizar(bia, {
      materiaId: bia.materiaId,
      iniciadaEm: atras(30),
      duracao: 600,
    });

    expect(error).toBeNull();
  });

  it('atribui ao dia em que COMEÇOU, no fuso do usuário', async () => {
    // 03:30 UTC de 22/07 = 00:30 em São Paulo (dia 22), mas 23:30 em Manaus (dia 21).
    const paulo = await novoUsuario('Paulo', 'America/Sao_Paulo');
    const manu = await novoUsuario('Manu', 'America/Manaus');
    const inicio = '2026-07-22T03:30:00Z';

    const sp = await finalizar(paulo, {
      materiaId: paulo.materiaId,
      iniciadaEm: inicio,
      duracao: 600,
    });
    const am = await finalizar(manu, {
      materiaId: manu.materiaId,
      iniciadaEm: inicio,
      duracao: 600,
    });

    expect(sp.data.dia).toBe('2026-07-22');
    expect(am.data.dia).toBe('2026-07-21');
  });

  it('soma o tempo estudado hoje', async () => {
    const caio = await novoUsuario('Caio');
    await finalizar(caio, { materiaId: caio.materiaId, iniciadaEm: atras(60), duracao: 900 });
    await finalizar(caio, { materiaId: caio.materiaId, iniciadaEm: atras(30), duracao: 600 });

    const { data } = await caio.cliente.rpc('tempo_estudado_hoje');

    expect(data).toBe(1500);
  });
});

describe('finalizar sessão: idempotência', () => {
  it('a mesma sessão enviada 2× conta 1×', async () => {
    const duda = await novoUsuario('Duda');
    const envio = {
      sessionId: randomUUID(),
      materiaId: duda.materiaId,
      iniciadaEm: atras(30),
      duracao: 1500,
    };

    await finalizar(duda, envio);
    const segunda = await finalizar(duda, envio);

    expect(segunda.error).toBeNull();
    expect(await totalGravado(duda)).toBe(1500);
  });

  it('a mesma sessão enviada 2× AO MESMO TEMPO conta 1×', async () => {
    const edu = await novoUsuario('Edu');
    const envio = {
      sessionId: randomUUID(),
      materiaId: edu.materiaId,
      iniciadaEm: atras(30),
      duracao: 1500,
    };

    const [a, b] = await Promise.all([finalizar(edu, envio), finalizar(edu, envio)]);

    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    expect(await totalGravado(edu)).toBe(1500);
  });
});

describe('finalizar sessão: o servidor não confia no app (ataques)', () => {
  it('sessão de 20h é gravada como 12h', async () => {
    const fe = await novoUsuario('Fê');

    const { data } = await finalizar(fe, {
      materiaId: fe.materiaId,
      iniciadaEm: atras(20 * 60),
      duracao: 20 * 3600,
    });

    expect(data.duracao_segundos).toBe(DOZE_HORAS);
  });

  it('duração maior que o tempo real (relógio adiantado) é cortada pelo relógio do servidor', async () => {
    const gil = await novoUsuario('Gil');

    // Diz que começou há 10 min, mas que estudou 3h: impossível.
    const { data } = await finalizar(gil, {
      materiaId: gil.materiaId,
      iniciadaEm: atras(10),
      duracao: 3 * 3600,
    });

    expect(data.duracao_segundos).toBeLessThanOrEqual(15 * 60); // 10 min + tolerância de 5
  });

  it('recusa sessão no futuro', async () => {
    const hel = await novoUsuario('Hel');

    const { error } = await finalizar(hel, {
      materiaId: hel.materiaId,
      iniciadaEm: atras(-60),
      duracao: 600,
    });

    expect(error?.code).toBe(NO_FUTURO);
  });

  it('recusa sessões sobrepostas (estudar duas coisas ao mesmo tempo)', async () => {
    const ivo = await novoUsuario('Ivo');
    await finalizar(ivo, { materiaId: ivo.materiaId, iniciadaEm: atras(120), duracao: 3600 });

    // Começa 30 min depois da primeira, que ainda "estava rodando".
    const { error } = await finalizar(ivo, {
      materiaId: ivo.materiaId,
      iniciadaEm: atras(90),
      duracao: 3600,
    });

    expect(error?.code).toBe(SOBREPOSTA);
    expect(await totalGravado(ivo)).toBe(3600);
  });

  it('recusa sessão com menos de 1 minuto', async () => {
    const ju = await novoUsuario('Ju');

    const { error } = await finalizar(ju, {
      materiaId: ju.materiaId,
      iniciadaEm: atras(5),
      duracao: 59,
    });

    expect(error?.code).toBe(CURTA_DEMAIS);
  });

  it('recusa sessão em matéria de OUTRA pessoa', async () => {
    const ana = await novoUsuario('Ana 2');
    const bruno = await novoUsuario('Bruno 2');

    const { error } = await finalizar(bruno, {
      materiaId: ana.materiaId,
      iniciadaEm: atras(30),
      duracao: 600,
    });

    expect(error?.code).toBe(MATERIA_INVALIDA);
  });

  it('não dá para "sequestrar" o session_id de outra pessoa', async () => {
    const ana = await novoUsuario('Ana 3');
    const bruno = await novoUsuario('Bruno 3');
    const idDaAna = randomUUID();
    await finalizar(ana, {
      sessionId: idDaAna,
      materiaId: ana.materiaId,
      iniciadaEm: atras(30),
      duracao: 600,
    });

    const { error } = await finalizar(bruno, {
      sessionId: idDaAna,
      materiaId: bruno.materiaId,
      iniciadaEm: atras(30),
      duracao: 600,
    });

    expect(error?.code).toBe(ID_DE_OUTRO);
    expect(await totalGravado(bruno)).toBe(0);
  });

  it('usuário B NÃO lê as sessões de A', async () => {
    const ana = await novoUsuario('Ana 4');
    const bruno = await novoUsuario('Bruno 4');
    await finalizar(ana, { materiaId: ana.materiaId, iniciadaEm: atras(30), duracao: 600 });

    const { data } = await bruno.cliente.from('sessao_estudo').select('*');

    expect(data).toEqual([]);
  });

  it('NÃO dá para gravar sessão direto na tabela (pulando as regras)', async () => {
    const kai = await novoUsuario('Kai');

    const { error } = await kai.cliente.from('sessao_estudo').insert({
      session_id: randomUUID(),
      dono_id: kai.id,
      materia_id: kai.materiaId,
      iniciada_em: atras(30),
      duracao_segundos: 43200,
      periodo: '[2026-01-01,2026-01-02)',
      dia: '2026-01-01',
    });

    expect(error?.code).toBe(PERMISSAO_NEGADA);
  });

  it('visitante sem login NÃO grava sessão', async () => {
    const visitante = criarClienteVisitante();

    const { error } = await visitante.rpc('finalizar_sessao', {
      id_sessao: randomUUID(),
      id_materia: randomUUID(),
      iniciada_em: atras(30),
      duracao_segundos: 600,
    });

    expect(error).not.toBeNull();
  });
});
