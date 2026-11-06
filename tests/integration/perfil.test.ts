import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  apagarUsuarios,
  criarClienteVisitante,
  criarUsuarioDeTeste,
  type UsuarioDeTeste,
} from './ajudantes';

// Código de erro do Postgres para "permissão negada".
const PERMISSAO_NEGADA = '42501';

describe('perfil', () => {
  let ana: UsuarioDeTeste; // usuário A
  let bruno: UsuarioDeTeste; // usuário B (o "atacante")

  beforeAll(async () => {
    ana = await criarUsuarioDeTeste('Ana', 'America/Manaus');
    bruno = await criarUsuarioDeTeste('Bruno');
  });

  afterAll(async () => {
    await apagarUsuarios([ana, bruno]);
  });

  describe('criação no cadastro', () => {
    it('cria o perfil automaticamente com o nome e o fuso enviados', async () => {
      const { data, error } = await ana.cliente
        .from('perfil')
        .select('nome, fuso, meta_diaria_minutos')
        .eq('id', ana.id)
        .single();

      expect(error).toBeNull();
      expect(data).toEqual({ nome: 'Ana', fuso: 'America/Manaus', meta_diaria_minutos: 30 });
    });
  });

  describe('o próprio usuário', () => {
    it('lê o próprio perfil', async () => {
      const { data } = await bruno.cliente.from('perfil').select('nome').eq('id', bruno.id);

      expect(data).toEqual([{ nome: 'Bruno' }]);
    });

    it('edita o próprio nome', async () => {
      const { error } = await bruno.cliente
        .from('perfil')
        .update({ nome: 'Bruno Silva' })
        .eq('id', bruno.id);
      const { data } = await bruno.cliente.from('perfil').select('nome').eq('id', bruno.id);

      expect(error).toBeNull();
      expect(data).toEqual([{ nome: 'Bruno Silva' }]);
    });
  });

  describe('segurança: tentativas de ataque', () => {
    it('usuário B NÃO consegue ler o perfil do usuário A', async () => {
      const { data } = await bruno.cliente.from('perfil').select('*').eq('id', ana.id);

      expect(data).toEqual([]);
    });

    it('usuário B só enxerga o próprio perfil ao pedir todos', async () => {
      const { data } = await bruno.cliente.from('perfil').select('id');

      expect(data).toEqual([{ id: bruno.id }]);
    });

    it('usuário B NÃO consegue editar o nome do usuário A', async () => {
      await bruno.cliente.from('perfil').update({ nome: 'Hackeado' }).eq('id', ana.id);

      // Confere pelo lado da Ana: o nome continua o mesmo.
      const { data } = await ana.cliente.from('perfil').select('nome').eq('id', ana.id);
      expect(data).toEqual([{ nome: 'Ana' }]);
    });

    it('usuário NÃO consegue mudar a própria meta direto pela API', async () => {
      const { error } = await bruno.cliente
        .from('perfil')
        .update({ meta_diaria_minutos: 15 })
        .eq('id', bruno.id);

      expect(error?.code).toBe(PERMISSAO_NEGADA);
    });

    it('visitante sem login NÃO lê nenhum perfil', async () => {
      const visitante = criarClienteVisitante();
      const { error } = await visitante.from('perfil').select('*');

      expect(error?.code).toBe(PERMISSAO_NEGADA);
    });
  });
});
