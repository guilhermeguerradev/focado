import { describe, expect, it } from 'vitest';

import { formatarMinutos, OPCOES_META_MINUTOS } from './meta';

describe('formatarMinutos', () => {
  it('mostra só minutos quando é menos de 1 hora', () => {
    expect(formatarMinutos(15)).toBe('15 min');
    expect(formatarMinutos(45)).toBe('45 min');
  });

  it('mostra só as horas quando é hora cheia', () => {
    expect(formatarMinutos(60)).toBe('1h');
    expect(formatarMinutos(120)).toBe('2h');
  });

  it('mostra horas e minutos com dois dígitos', () => {
    expect(formatarMinutos(90)).toBe('1h30');
    expect(formatarMinutos(65)).toBe('1h05');
  });
});

describe('opções de meta', () => {
  it('são as mesmas do PRD 1.4', () => {
    expect(OPCOES_META_MINUTOS).toEqual([15, 30, 45, 60, 90, 120]);
  });
});
