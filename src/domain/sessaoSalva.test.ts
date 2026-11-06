import { describe, expect, it } from 'vitest';

import { iniciarSessao, pausar } from './cronometro';
import { lerSessaoSalva } from './sessaoSalva';

const agora = new Date('2026-07-22T14:00:00Z');
const rodando = iniciarSessao({ sessionId: 's1', materiaId: 'm1', agora });
const pausada = pausar(rodando, new Date('2026-07-22T14:10:00Z'));

// Simula o caminho real: objeto → texto JSON (AsyncStorage) → objeto de novo.
const idaEVolta = (valor: unknown) => JSON.parse(JSON.stringify(valor));

describe('lerSessaoSalva', () => {
  it('aceita sessão rodando e pausada salvas corretamente', () => {
    expect(lerSessaoSalva(idaEVolta(rodando))).toEqual(rodando);
    expect(lerSessaoSalva(idaEVolta(pausada))).toEqual(pausada);
  });

  it('ignora valores que não são objeto', () => {
    expect(lerSessaoSalva(null)).toBeNull();
    expect(lerSessaoSalva('texto qualquer')).toBeNull();
    expect(lerSessaoSalva(42)).toBeNull();
  });

  it('ignora campos faltando ou com tipo errado', () => {
    expect(lerSessaoSalva({ ...rodando, sessionId: undefined })).toBeNull();
    expect(lerSessaoSalva({ ...rodando, saldoAcumulado: '300' })).toBeNull();
    expect(lerSessaoSalva({ ...rodando, saldoAcumulado: -5 })).toBeNull();
    expect(lerSessaoSalva({ ...rodando, iniciadaEm: 'ontem' })).toBeNull();
  });

  it('aceita sessão salva por versão ANTIGA do app (sem o campo saiuEm)', () => {
    const { saiuEm: _semCampo, ...versaoAntiga } = rodando;

    expect(lerSessaoSalva(idaEVolta(versaoAntiga))).toEqual({ ...rodando, saiuEm: null });
  });

  it('aceita saiuEm com data válida e recusa saiuEm estragado', () => {
    const fora = { ...rodando, saiuEm: '2026-07-22T14:30:00.000Z' };

    expect(lerSessaoSalva(idaEVolta(fora))).toEqual(fora);
    expect(lerSessaoSalva({ ...rodando, saiuEm: 'ontem' })).toBeNull();
  });

  it('ignora status desconhecido ou incoerente com horaInicio', () => {
    expect(lerSessaoSalva({ ...rodando, status: 'finalizado' })).toBeNull();
    expect(lerSessaoSalva({ ...rodando, horaInicio: null })).toBeNull();
    expect(lerSessaoSalva({ ...pausada, horaInicio: '2026-07-22T14:00:00Z' })).toBeNull();
  });
});
