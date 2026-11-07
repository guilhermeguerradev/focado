import { describe, expect, it } from 'vitest';

import { formatarHorasMinutos, progressoDaMeta, saudacao, voltasDaMeta } from './inicio';

describe('saudacao', () => {
  it('bom dia das 5h às 11h59', () => {
    expect(saudacao(5)).toBe('Bom dia');
    expect(saudacao(11)).toBe('Bom dia');
  });

  it('boa tarde das 12h às 17h59', () => {
    expect(saudacao(12)).toBe('Boa tarde');
    expect(saudacao(17)).toBe('Boa tarde');
  });

  it('boa noite das 18h às 4h59', () => {
    expect(saudacao(18)).toBe('Boa noite');
    expect(saudacao(0)).toBe('Boa noite');
    expect(saudacao(4)).toBe('Boa noite');
  });
});

describe('progressoDaMeta', () => {
  it('meta de 2h e 1h estudada = metade', () => {
    expect(progressoDaMeta(3600, 120)).toBe(0.5);
  });

  it('nada estudado = 0', () => {
    expect(progressoDaMeta(0, 30)).toBe(0);
  });

  it('passou da meta = 1 (anel cheio, não dá a volta)', () => {
    expect(progressoDaMeta(5 * 3600, 60)).toBe(1);
  });

  it('meta inválida (0) não quebra: devolve 0', () => {
    expect(progressoDaMeta(600, 0)).toBe(0);
  });
});

describe('voltasDaMeta (anel do cronômetro)', () => {
  it('antes da meta: nenhuma volta completa, enchendo a 1ª', () => {
    expect(voltasDaMeta(15 * 60, 30)).toEqual({ voltasCompletas: 0, progressoDaVolta: 0.5 });
  });

  it('exatamente na meta: 1 volta completa e a 2ª ainda vazia', () => {
    expect(voltasDaMeta(30 * 60, 30)).toEqual({ voltasCompletas: 1, progressoDaVolta: 0 });
  });

  it('passou da meta: segunda volta enchendo por cima', () => {
    expect(voltasDaMeta(45 * 60, 30)).toEqual({ voltasCompletas: 1, progressoDaVolta: 0.5 });
  });

  it('quantas voltas forem necessárias: 75 min com meta 30 = 2 voltas + metade', () => {
    expect(voltasDaMeta(75 * 60, 30)).toEqual({ voltasCompletas: 2, progressoDaVolta: 0.5 });
  });

  it('meta inválida (0) não quebra', () => {
    expect(voltasDaMeta(600, 0)).toEqual({ voltasCompletas: 0, progressoDaVolta: 0 });
  });
});

describe('formatarHorasMinutos', () => {
  it('abaixo de 1h mostra só minutos', () => {
    expect(formatarHorasMinutos(0)).toBe('0min');
    expect(formatarHorasMinutos(25 * 60 + 59)).toBe('25min');
  });

  it('hora cheia mostra só horas', () => {
    expect(formatarHorasMinutos(4 * 3600)).toBe('4h');
  });

  it('horas e minutos com espaço, como no design', () => {
    expect(formatarHorasMinutos(2 * 3600 + 10 * 60)).toBe('2h 10min');
  });
});
