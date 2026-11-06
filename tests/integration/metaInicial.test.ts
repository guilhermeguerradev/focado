import { afterAll, describe, expect, it } from 'vitest';

import {
  apagarUsuarios,
  criarClienteVisitante,
  criarUsuarioDeTeste,
  type UsuarioDeTeste,
} from './ajudantes';

const PERMISSAO_NEGADA = '42501';
const VALOR_INVALIDO = '22023';

// Cada teste cria um usuário novo, porque o pop-up só pode ser respondido uma vez.
const criados: UsuarioDeTeste[] = [];
async function novoUsuario(nome: string): Promise<UsuarioDeTeste> {
  const usuario = await criarUsuarioDeTeste(nome);
  criados.push(usuario);
  return usuario;
}

async function lerMeta(usuario: UsuarioDeTeste) {
  const { data } = await usuario.cliente
    .from('perfil')
    .select('meta_diaria_minutos, meta_escolhida_em')
    .eq('id', usuario.id)
    .single();
  return data;
}

afterAll(async () => {
  await apagarUsuarios(criados);
});

describe('definir meta inicial (pop-up)', () => {
  it('começa sem resposta do pop-up e com meta padrão de 30 min', async () => {
    const usuario = await novoUsuario('Carla');

    expect(await lerMeta(usuario)).toEqual({ meta_diaria_minutos: 30, meta_escolhida_em: null });
  });

  it('grava a meta escolhida e marca o pop-up como respondido', async () => {
    const usuario = await novoUsuario('Davi');

    const { data, error } = await usuario.cliente.rpc('definir_meta_inicial', { minutos: 60 });
    const meta = await lerMeta(usuario);

    expect(error).toBeNull();
    expect(data).toBe(60);
    expect(meta?.meta_diaria_minutos).toBe(60);
    expect(meta?.meta_escolhida_em).not.toBeNull();
  });

  it('ao pular, mantém 30 min e marca o pop-up como respondido', async () => {
    const usuario = await novoUsuario('Eva');

    const { data } = await usuario.cliente.rpc('definir_meta_inicial', {});
    const meta = await lerMeta(usuario);

    expect(data).toBe(30);
    expect(meta?.meta_escolhida_em).not.toBeNull();
  });

  it('ignora a segunda chamada: o pop-up só vale uma vez (idempotência)', async () => {
    const usuario = await novoUsuario('Fábio');

    await usuario.cliente.rpc('definir_meta_inicial', { minutos: 45 });
    const { data } = await usuario.cliente.rpc('definir_meta_inicial', { minutos: 120 });

    expect(data).toBe(45);
    expect((await lerMeta(usuario))?.meta_diaria_minutos).toBe(45);
  });

  it('duas chamadas ao mesmo tempo gravam só uma (race condition)', async () => {
    const usuario = await novoUsuario('Gabi');

    const [primeira, segunda] = await Promise.all([
      usuario.cliente.rpc('definir_meta_inicial', { minutos: 60 }),
      usuario.cliente.rpc('definir_meta_inicial', { minutos: 90 }),
    ]);
    const metaFinal = (await lerMeta(usuario))?.meta_diaria_minutos;

    // Ganha quem chegar primeiro; as duas respostas devem concordar com o banco.
    expect([60, 90]).toContain(metaFinal);
    expect(primeira.data).toBe(metaFinal);
    expect(segunda.data).toBe(metaFinal);
  });

  it('recusa valor fora da lista (ex.: 1 minuto)', async () => {
    const usuario = await novoUsuario('Hugo');

    const { error } = await usuario.cliente.rpc('definir_meta_inicial', { minutos: 1 });

    expect(error?.code).toBe(VALOR_INVALIDO);
    expect(await lerMeta(usuario)).toEqual({ meta_diaria_minutos: 30, meta_escolhida_em: null });
  });

  it('visitante sem login NÃO consegue chamar a função', async () => {
    const visitante = criarClienteVisitante();

    const { error } = await visitante.rpc('definir_meta_inicial', { minutos: 60 });

    expect(error).not.toBeNull();
  });

  it('usuário NÃO consegue marcar o pop-up como respondido direto pela API', async () => {
    const usuario = await novoUsuario('Íris');

    const { error } = await usuario.cliente
      .from('perfil')
      .update({ meta_escolhida_em: new Date().toISOString() })
      .eq('id', usuario.id);

    expect(error?.code).toBe(PERMISSAO_NEGADA);
  });
});
