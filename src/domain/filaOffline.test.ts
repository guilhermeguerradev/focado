import { describe, expect, it } from 'vitest';

import type { SessaoFinalizada } from './cronometro';
import {
  adicionarNaFila,
  ehCurtaDemais,
  lerFilaSalva,
  removerDaFila,
  segundosNaFilaHoje,
} from './filaOffline';

// Horários ao meio-dia: longe da meia-noite em qualquer fuso do Brasil.
const sessao = (id: string, dia: string, segundos = 1500): SessaoFinalizada => ({
  sessionId: id,
  materiaId: 'ingles',
  iniciadaEm: new Date(`${dia}T12:00:00`).toISOString(),
  duracaoSegundos: segundos,
});

describe('ehCurtaDemais (PRD 3.6)', () => {
  it('menos de 1 minuto é curta demais; 1 minuto já vale', () => {
    expect(ehCurtaDemais(sessao('a', '2026-11-06', 59))).toBe(true);
    expect(ehCurtaDemais(sessao('a', '2026-11-06', 60))).toBe(false);
  });
});

describe('adicionar e remover', () => {
  it('adiciona no fim, mantendo a ordem em que foram finalizadas', () => {
    const fila = adicionarNaFila(
      adicionarNaFila([], sessao('1', '2026-11-06')),
      sessao('2', '2026-11-06'),
    );

    expect(fila.map((s) => s.sessionId)).toEqual(['1', '2']);
  });

  it('não duplica a mesma sessão (mesmo sessionId)', () => {
    const fila = adicionarNaFila([sessao('1', '2026-11-06')], sessao('1', '2026-11-06'));

    expect(fila).toHaveLength(1);
  });

  it('remove só a sessão confirmada', () => {
    const fila = [sessao('1', '2026-11-06'), sessao('2', '2026-11-06')];

    expect(removerDaFila(fila, '1').map((s) => s.sessionId)).toEqual(['2']);
  });
});

describe('segundosNaFilaHoje', () => {
  it('soma só as sessões da fila que começaram hoje', () => {
    const fila = [
      sessao('ontem', '2026-11-05', 900),
      sessao('hoje-1', '2026-11-06', 600),
      sessao('hoje-2', '2026-11-06', 300),
    ];

    expect(segundosNaFilaHoje(fila, new Date('2026-11-06T18:00:00'))).toBe(900);
  });

  it('fila vazia = 0', () => {
    expect(segundosNaFilaHoje([], new Date())).toBe(0);
  });
});

describe('lerFilaSalva', () => {
  it('lê a fila salva (ida e volta pelo JSON)', () => {
    const fila = [sessao('1', '2026-11-06'), sessao('2', '2026-11-06')];

    expect(lerFilaSalva(JSON.parse(JSON.stringify(fila)))).toEqual(fila);
  });

  it('valor que não é lista vira fila vazia', () => {
    expect(lerFilaSalva(null)).toEqual([]);
    expect(lerFilaSalva({ sessionId: '1' })).toEqual([]);
  });

  it('descarta só os itens estragados e mantém os bons', () => {
    const boa = sessao('boa', '2026-11-06');
    const fila = [boa, { ...boa, sessionId: '' }, { ...boa, duracaoSegundos: '1500' }, 'lixo'];

    expect(lerFilaSalva(fila)).toEqual([boa]);
  });
});
