import { afterAll, describe, expect, it } from 'vitest';

import {
  apagarUsuarios,
  criarClienteVisitante,
  criarUsuarioDeTeste,
  type UsuarioDeTeste,
} from './ajudantes';

const PERMISSAO_NEGADA = '42501';
const NOME_REPETIDO = '23505'; // unique_violation
const REGRA_VIOLADA = '23514'; // check_violation
const LIMITE_DO_PLANO = 'FC001'; // código próprio do Focado

const criados: UsuarioDeTeste[] = [];
async function novoUsuario(nome: string): Promise<UsuarioDeTeste> {
  const usuario = await criarUsuarioDeTeste(nome);
  criados.push(usuario);
  return usuario;
}

function criarMateria(usuario: UsuarioDeTeste, nome: string, cor = 'roxo') {
  return usuario.cliente.rpc('criar_materia', { nome_materia: nome, cor_materia: cor });
}

async function nomesAtivos(usuario: UsuarioDeTeste): Promise<string[]> {
  const { data } = await usuario.cliente
    .from('materia')
    .select('nome')
    .is('arquivada_em', null)
    .order('nome');
  return (data ?? []).map((linha) => linha.nome);
}

afterAll(async () => {
  await apagarUsuarios(criados);
});

describe('matérias: criar', () => {
  it('cria a matéria com nome e cor, sem espaços sobrando no nome', async () => {
    const usuario = await novoUsuario('Ana');

    const { data, error } = await criarMateria(usuario, '  Inglês  ', 'turquesa');

    expect(error).toBeNull();
    expect(data).toMatchObject({ nome: 'Inglês', cor: 'turquesa', arquivada_em: null });
  });

  it('recusa nome repetido entre as ativas, ignorando maiúsculas', async () => {
    const usuario = await novoUsuario('Bia');
    await criarMateria(usuario, 'Inglês');

    const { error } = await criarMateria(usuario, 'INGLÊS');

    expect(error?.code).toBe(NOME_REPETIDO);
  });

  it('recusa cor fora da paleta e nome com mais de 20 caracteres', async () => {
    const usuario = await novoUsuario('Caio');

    const corInvalida = await criarMateria(usuario, 'Física', 'dourado');
    const nomeLongo = await criarMateria(usuario, 'a'.repeat(21));
    const nomeNoLimite = await criarMateria(usuario, 'a'.repeat(20));

    expect(corInvalida.error?.code).toBe(REGRA_VIOLADA);
    expect(nomeLongo.error?.code).toBe(REGRA_VIOLADA);
    expect(nomeNoLimite.error).toBeNull();
  });

  it('recusa EDITAR o nome para mais de 20 caracteres', async () => {
    const usuario = await novoUsuario('Caio 2');
    const { data } = await criarMateria(usuario, 'Física');

    const { error } = await usuario.cliente
      .from('materia')
      .update({ nome: 'a'.repeat(21) })
      .eq('id', data.id);

    expect(error?.code).toBe(REGRA_VIOLADA);
  });
});

describe('matérias: limite do plano Free (4)', () => {
  it('recusa a 5ª matéria', async () => {
    const usuario = await novoUsuario('Duda');
    for (const nome of ['Mat', 'Port', 'Hist', 'Geo']) {
      await criarMateria(usuario, nome);
    }

    const { error } = await criarMateria(usuario, 'Bio');

    expect(error?.code).toBe(LIMITE_DO_PLANO);
    expect(await nomesAtivos(usuario)).toHaveLength(4);
  });

  it('6 criações AO MESMO TEMPO não furam o limite (race condition)', async () => {
    const usuario = await novoUsuario('Edu');

    const resultados = await Promise.all(
      ['A', 'B', 'C', 'D', 'E', 'F'].map((nome) => criarMateria(usuario, nome)),
    );
    const sucessos = resultados.filter((r) => r.error === null);
    const recusadas = resultados.filter((r) => r.error?.code === LIMITE_DO_PLANO);

    expect(sucessos).toHaveLength(4);
    expect(recusadas).toHaveLength(2);
    expect(await nomesAtivos(usuario)).toHaveLength(4);
  });

  it('arquivar libera a vaga e o nome pode ser usado de novo', async () => {
    const usuario = await novoUsuario('Fê');
    const criadas = [];
    for (const nome of ['Mat', 'Port', 'Hist', 'Geo']) {
      criadas.push((await criarMateria(usuario, nome)).data);
    }

    await usuario.cliente.rpc('arquivar_materia', { id_materia: criadas[0].id });
    const { error } = await criarMateria(usuario, 'Mat');

    expect(error).toBeNull();
    expect(await nomesAtivos(usuario)).toEqual(['Geo', 'Hist', 'Mat', 'Port']);
  });
});

describe('matérias: segurança (tentativas de ataque)', () => {
  it('usuário B NÃO vê, NÃO edita e NÃO arquiva as matérias de A', async () => {
    const ana = await novoUsuario('Ana A');
    const bruno = await novoUsuario('Bruno B');
    const { data: materiaDaAna } = await criarMateria(ana, 'Química');

    const leitura = await bruno.cliente.from('materia').select('*').eq('id', materiaDaAna.id);
    await bruno.cliente.from('materia').update({ nome: 'Hackeada' }).eq('id', materiaDaAna.id);
    await bruno.cliente.rpc('arquivar_materia', { id_materia: materiaDaAna.id });

    expect(leitura.data).toEqual([]);
    expect(await nomesAtivos(ana)).toEqual(['Química']);
  });

  it('NÃO dá para criar matéria direto na tabela (pulando o limite)', async () => {
    const usuario = await novoUsuario('Gil');

    const { error } = await usuario.cliente
      .from('materia')
      .insert({ dono_id: usuario.id, nome: 'Atalho', cor: 'roxo' });

    expect(error?.code).toBe(PERMISSAO_NEGADA);
  });

  it('NÃO dá para desarquivar direto pela API (furando o limite)', async () => {
    const usuario = await novoUsuario('Hel');
    const { data } = await criarMateria(usuario, 'Artes');
    await usuario.cliente.rpc('arquivar_materia', { id_materia: data.id });

    const { error } = await usuario.cliente
      .from('materia')
      .update({ arquivada_em: null })
      .eq('id', data.id);

    expect(error?.code).toBe(PERMISSAO_NEGADA);
    expect(await nomesAtivos(usuario)).toEqual([]);
  });

  it('visitante sem login NÃO cria matéria', async () => {
    const visitante = criarClienteVisitante();

    const { error } = await visitante.rpc('criar_materia', {
      nome_materia: 'X',
      cor_materia: 'roxo',
    });

    expect(error).not.toBeNull();
  });
});

describe('matérias: editar', () => {
  it('o dono edita nome e cor da própria matéria', async () => {
    const usuario = await novoUsuario('Ivo');
    const { data } = await criarMateria(usuario, 'Fisica', 'azul');

    const { error } = await usuario.cliente
      .from('materia')
      .update({ nome: 'Física', cor: 'verde' })
      .eq('id', data.id);
    const { data: depois } = await usuario.cliente
      .from('materia')
      .select('nome, cor')
      .eq('id', data.id)
      .single();

    expect(error).toBeNull();
    expect(depois).toEqual({ nome: 'Física', cor: 'verde' });
  });
});
