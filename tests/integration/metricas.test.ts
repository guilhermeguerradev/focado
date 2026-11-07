import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import {
  apagarUsuarios,
  criarClienteVisitante,
  criarUsuarioDeTeste,
  type UsuarioDeTeste,
} from './ajudantes';

const VALOR_INVALIDO = '22023';

const criados: UsuarioDeTeste[] = [];
async function novoUsuario(nome: string) {
  const usuario = await criarUsuarioDeTeste(nome, 'America/Sao_Paulo');
  criados.push(usuario);
  return usuario;
}

async function criarMateria(usuario: UsuarioDeTeste, nome: string, cor: string) {
  const { data } = await usuario.cliente.rpc('criar_materia', {
    nome_materia: nome,
    cor_materia: cor,
  });
  return data.id as string;
}

// Sessão às 12:00 de São Paulo (15:00 UTC) do dia informado, numa hora própria
// (para nunca sobrepor outra sessão do mesmo dia).
async function estudar(
  usuario: UsuarioDeTeste,
  materiaId: string,
  dia: string,
  minutos: number,
  hora = 12,
) {
  const { error } = await usuario.cliente.rpc('finalizar_sessao', {
    id_sessao: randomUUID(),
    id_materia: materiaId,
    iniciada_em: `${dia}T${String(hora + 3).padStart(2, '0')}:00:00Z`,
    duracao_segundos: minutos * 60,
  });
  if (error) throw new Error(`Falha ao criar sessão de teste: ${error.message}`);
}

function metricas(usuario: UsuarioDeTeste, inicio: string, fim: string) {
  return usuario.cliente.rpc('metricas_do_periodo', { inicio, fim });
}

afterAll(async () => {
  await apagarUsuarios(criados);
});

describe('métricas do período (calculadas pelo servidor)', () => {
  it('soma total, sessões, média e tempo por matéria (da mais para a menos estudada)', async () => {
    const ana = await novoUsuario('Ana');
    const ingles = await criarMateria(ana, 'Inglês', 'turquesa');
    const calculo = await criarMateria(ana, 'Cálculo', 'roxo');
    await estudar(ana, ingles, '2026-07-06', 30, 9);
    await estudar(ana, calculo, '2026-07-06', 60, 14);
    await estudar(ana, calculo, '2026-07-08', 30, 10);

    const { data, error } = await metricas(ana, '2026-07-05', '2026-07-11');

    expect(error).toBeNull();
    expect(data).toEqual({
      total_segundos: 120 * 60,
      sessoes: 3,
      media_segundos: 40 * 60,
      por_materia: [
        { materia_id: calculo, nome: 'Cálculo', cor: 'roxo', segundos: 90 * 60 },
        { materia_id: ingles, nome: 'Inglês', cor: 'turquesa', segundos: 30 * 60 },
      ],
    });
  });

  it('conta só os dias DENTRO do intervalo (início e fim inclusive)', async () => {
    const bia = await novoUsuario('Bia');
    const mat = await criarMateria(bia, 'Mat', 'azul');
    await estudar(bia, mat, '2026-07-04', 10); // sábado: semana anterior
    await estudar(bia, mat, '2026-07-05', 20); // domingo: 1º dia
    await estudar(bia, mat, '2026-07-11', 30); // sábado: último dia
    await estudar(bia, mat, '2026-07-12', 40); // domingo: semana seguinte

    const { data } = await metricas(bia, '2026-07-05', '2026-07-11');

    expect(data.total_segundos).toBe(50 * 60);
    expect(data.sessoes).toBe(2);
  });

  it('período sem estudo devolve tudo zerado', async () => {
    const caio = await novoUsuario('Caio');

    const { data } = await metricas(caio, '2026-07-05', '2026-07-11');

    expect(data).toEqual({ total_segundos: 0, sessoes: 0, media_segundos: 0, por_materia: [] });
  });

  it('matéria ARQUIVADA continua aparecendo nas estatísticas', async () => {
    const duda = await novoUsuario('Duda');
    const hist = await criarMateria(duda, 'História', 'amarelo');
    await estudar(duda, hist, '2026-07-06', 25);
    await duda.cliente.rpc('arquivar_materia', { id_materia: hist });

    const { data } = await metricas(duda, '2026-07-05', '2026-07-11');

    expect(data.por_materia).toEqual([
      { materia_id: hist, nome: 'História', cor: 'amarelo', segundos: 25 * 60 },
    ]);
  });

  it('recusa período inválido (fim antes do início, ou mais de 1 ano)', async () => {
    const edu = await novoUsuario('Edu');

    const invertido = await metricas(edu, '2026-07-11', '2026-07-05');
    const longo = await metricas(edu, '2025-01-01', '2026-07-05');

    expect(invertido.error?.code).toBe(VALOR_INVALIDO);
    expect(longo.error?.code).toBe(VALOR_INVALIDO);
  });
});

describe('métricas: segurança', () => {
  it('usuário B NÃO enxerga o estudo de A nas próprias métricas', async () => {
    const ana = await novoUsuario('Ana B');
    const bruno = await novoUsuario('Bruno B');
    const mat = await criarMateria(ana, 'Química', 'verde');
    await estudar(ana, mat, '2026-07-06', 45);

    const { data } = await metricas(bruno, '2026-07-05', '2026-07-11');

    expect(data.total_segundos).toBe(0);
    expect(data.por_materia).toEqual([]);
  });

  it('visitante sem login NÃO consulta métricas', async () => {
    const visitante = criarClienteVisitante();

    const { error } = await visitante.rpc('metricas_do_periodo', {
      inicio: '2026-07-05',
      fim: '2026-07-11',
    });

    expect(error).not.toBeNull();
  });
});
