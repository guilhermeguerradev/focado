import { describe, expect, it } from 'vitest';

import {
  atingiuTeto,
  finalizar,
  formatarCronometro,
  iniciarSessao,
  pausar,
  retomar,
  tempoDecorrido,
  TETO_SEGUNDOS,
} from './cronometro';

// Relógio de mentira: "minuto 0", "minuto 25" etc. a partir de uma data fixa.
const INICIO = new Date('2026-07-22T14:00:00Z');
const minuto = (m: number) => new Date(INICIO.getTime() + m * 60_000);
const hora = (h: number) => minuto(h * 60);

function novaSessao() {
  return iniciarSessao({ sessionId: 'sessao-1', materiaId: 'ingles', agora: INICIO });
}

describe('iniciar', () => {
  it('começa rodando, com saldo zero e guardando quando começou', () => {
    const sessao = novaSessao();

    expect(sessao.status).toBe('rodando');
    expect(sessao.saldoAcumulado).toBe(0);
    expect(sessao.iniciadaEm).toBe('2026-07-22T14:00:00.000Z');
    expect(tempoDecorrido(sessao, INICIO)).toBe(0);
  });
});

describe('rodando', () => {
  it('o tempo avança com o relógio: 25 min depois, marca 25 min', () => {
    expect(tempoDecorrido(novaSessao(), minuto(25))).toBe(25 * 60);
  });
});

describe('pausar e retomar', () => {
  it('pausado, o relógio não avança', () => {
    const pausada = pausar(novaSessao(), minuto(10));

    expect(tempoDecorrido(pausada, minuto(10))).toBe(600);
    expect(tempoDecorrido(pausada, minuto(50))).toBe(600);
  });

  it('retomar continua de onde parou, sem contar o tempo de pausa', () => {
    // estuda 10 min, pausa 30 min, volta e estuda mais 5 min
    const pausada = pausar(novaSessao(), minuto(10));
    const retomada = retomar(pausada, minuto(40));

    expect(tempoDecorrido(retomada, minuto(45))).toBe(15 * 60);
  });

  it('várias pausas somam certinho', () => {
    let sessao = pausar(novaSessao(), minuto(10)); // 10 min
    sessao = pausar(retomar(sessao, minuto(20)), minuto(25)); // +5 min
    const final = retomar(sessao, minuto(60)); // +3 min abaixo

    expect(tempoDecorrido(final, minuto(63))).toBe(18 * 60);
  });

  it('pausar duas vezes ou retomar duas vezes não muda nada', () => {
    const pausada = pausar(novaSessao(), minuto(10));
    const rodando = retomar(pausada, minuto(20));

    expect(pausar(pausada, minuto(30))).toEqual(pausada);
    expect(retomar(rodando, minuto(30))).toEqual(rodando);
  });
});

describe('app fechado e reaberto', () => {
  it('rodando: ao reabrir 2h depois, o tempo inclui as 2h (nada se perde)', () => {
    // O estado salvo é só um JSON; ler de volta e recalcular basta.
    const salvo = JSON.parse(JSON.stringify(novaSessao()));

    expect(tempoDecorrido(salvo, hora(2))).toBe(2 * 3600);
  });

  it('pausado: ao reabrir dias depois, continua com o mesmo tempo', () => {
    const salvo = JSON.parse(JSON.stringify(pausar(novaSessao(), minuto(30))));

    expect(tempoDecorrido(salvo, hora(72))).toBe(30 * 60);
  });
});

describe('teto de 12h (PRD 3.4)', () => {
  it('rodando há 20h, o tempo para em 12h e avisa que atingiu o teto', () => {
    const sessao = novaSessao();

    expect(tempoDecorrido(sessao, hora(20))).toBe(TETO_SEGUNDOS);
    expect(atingiuTeto(sessao, hora(20))).toBe(true);
    expect(atingiuTeto(sessao, hora(11))).toBe(false);
  });

  it('finalizar depois de 20h grava 12h (truncada, não descartada)', () => {
    expect(finalizar(novaSessao(), hora(20)).duracaoSegundos).toBe(TETO_SEGUNDOS);
  });

  it('o teto vale também somando várias pausas', () => {
    const pausada = pausar(novaSessao(), hora(8)); // 8h
    const retomada = retomar(pausada, hora(9));

    expect(tempoDecorrido(retomada, hora(15))).toBe(TETO_SEGUNDOS); // 8h + 6h → 12h
  });
});

describe('relógio do celular mexido', () => {
  it('se o relógio voltar para antes do início, o trecho conta 0 (nunca negativo)', () => {
    const pausada = pausar(retomar(pausar(novaSessao(), minuto(10)), minuto(20)), minuto(5));

    expect(tempoDecorrido(pausada, minuto(5))).toBe(10 * 60);
  });
});

describe('finalizar', () => {
  it('devolve a duração em segundos inteiros e os dados da sessão', () => {
    const resultado = finalizar(novaSessao(), new Date(minuto(25).getTime() + 900));

    expect(resultado).toEqual({
      sessionId: 'sessao-1',
      materiaId: 'ingles',
      iniciadaEm: '2026-07-22T14:00:00.000Z',
      duracaoSegundos: 1500,
    });
  });
});

describe('formatarCronometro', () => {
  it('abaixo de 1h mostra minutos:segundos', () => {
    expect(formatarCronometro(0)).toBe('00:00');
    expect(formatarCronometro(24 * 60 + 35)).toBe('24:35');
  });

  it('a partir de 1h mostra horas:minutos:segundos', () => {
    expect(formatarCronometro(3909)).toBe('1:05:09');
    expect(formatarCronometro(TETO_SEGUNDOS)).toBe('12:00:00');
  });

  it('ignora frações de segundo', () => {
    expect(formatarCronometro(59.9)).toBe('00:59');
  });
});
