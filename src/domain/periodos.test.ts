import { describe, expect, it } from 'vitest';

import {
  ehPeriodoAtual,
  ehPeriodoPassado,
  hojeNoFuso,
  periodoAnterior,
  periodoQueContem,
  proximoPeriodo,
  somarDias,
  subtituloDoPeriodo,
  tituloDoPeriodo,
} from './periodos';

describe('hojeNoFuso: "que dia é hoje" depende do fuso do usuário', () => {
  // 03:30 UTC de 22/07 = 00:30 em São Paulo (dia 22), mas 23:30 em Manaus (dia 21).
  const instante = new Date('2026-07-22T03:30:00Z');

  it('São Paulo já está no dia 22', () => {
    expect(hojeNoFuso(instante, 'America/Sao_Paulo')).toBe('2026-07-22');
  });

  it('Manaus ainda está no dia 21', () => {
    expect(hojeNoFuso(instante, 'America/Manaus')).toBe('2026-07-21');
  });

  it('Lisboa (outro continente) também funciona', () => {
    expect(hojeNoFuso(new Date('2026-12-31T23:30:00Z'), 'Europe/Lisbon')).toBe('2026-12-31');
  });
});

describe('semana começa no DOMINGO (calendário fixo, PRD 4.2)', () => {
  it('quarta 08/07/2026 → semana de domingo 05/07 a sábado 11/07', () => {
    expect(periodoQueContem('semana', '2026-07-08')).toEqual({
      tipo: 'semana',
      inicio: '2026-07-05',
      fim: '2026-07-11',
    });
  });

  it('o próprio domingo já é o "dia 1" da semana nova', () => {
    expect(periodoQueContem('semana', '2026-07-12').inicio).toBe('2026-07-12');
  });

  it('o sábado ainda é da semana anterior', () => {
    expect(periodoQueContem('semana', '2026-07-11').inicio).toBe('2026-07-05');
  });

  it('semana que atravessa a virada do ano', () => {
    expect(periodoQueContem('semana', '2026-01-01')).toEqual({
      tipo: 'semana',
      inicio: '2025-12-28',
      fim: '2026-01-03',
    });
  });
});

describe('mês e ano (calendário fixo)', () => {
  it('mês vai do dia 1 ao último dia', () => {
    expect(periodoQueContem('mes', '2026-11-06')).toEqual({
      tipo: 'mes',
      inicio: '2026-11-01',
      fim: '2026-11-30',
    });
  });

  it('fevereiro de ano bissexto termina no dia 29', () => {
    expect(periodoQueContem('mes', '2028-02-10').fim).toBe('2028-02-29');
  });

  it('ano vai de 1º de janeiro a 31 de dezembro', () => {
    expect(periodoQueContem('ano', '2026-07-22')).toEqual({
      tipo: 'ano',
      inicio: '2026-01-01',
      fim: '2026-12-31',
    });
  });
});

describe('navegar entre períodos', () => {
  it('semana anterior e próxima', () => {
    const semana = periodoQueContem('semana', '2026-07-08');

    expect(periodoAnterior(semana).inicio).toBe('2026-06-28');
    expect(proximoPeriodo(semana).inicio).toBe('2026-07-12');
  });

  it('mês anterior a janeiro é dezembro do ano anterior', () => {
    expect(periodoAnterior(periodoQueContem('mes', '2026-01-15')).inicio).toBe('2025-12-01');
  });

  it('dia anterior atravessa a virada do mês', () => {
    expect(periodoAnterior(periodoQueContem('dia', '2026-03-01')).inicio).toBe('2026-02-28');
  });

  it('somarDias atravessa meses e anos', () => {
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('período atual, passado', () => {
  const hoje = '2026-11-06';

  it('reconhece o período que contém hoje', () => {
    expect(ehPeriodoAtual(periodoQueContem('semana', hoje), hoje)).toBe(true);
    expect(ehPeriodoAtual(periodoQueContem('semana', '2026-10-20'), hoje)).toBe(false);
  });

  it('reconhece período já passado', () => {
    expect(ehPeriodoPassado(periodoQueContem('mes', '2026-10-10'), hoje)).toBe(true);
    expect(ehPeriodoPassado(periodoQueContem('mes', hoje), hoje)).toBe(false);
  });
});

describe('textos da navegação', () => {
  const hoje = '2026-07-08'; // quarta

  it('títulos relativos: hoje/ontem, esta semana/semana passada, este mês, este ano', () => {
    expect(tituloDoPeriodo(periodoQueContem('dia', hoje), hoje)).toBe('Hoje');
    expect(tituloDoPeriodo(periodoQueContem('dia', '2026-07-07'), hoje)).toBe('Ontem');
    expect(tituloDoPeriodo(periodoQueContem('semana', hoje), hoje)).toBe('Esta semana');
    expect(tituloDoPeriodo(periodoQueContem('semana', '2026-07-01'), hoje)).toBe('Semana passada');
    expect(tituloDoPeriodo(periodoQueContem('mes', hoje), hoje)).toBe('Este mês');
    expect(tituloDoPeriodo(periodoQueContem('ano', '2025-03-01'), hoje)).toBe('Ano passado');
  });

  it('títulos de períodos mais antigos', () => {
    expect(tituloDoPeriodo(periodoQueContem('dia', '2026-07-01'), hoje)).toBe('1 de julho');
    expect(tituloDoPeriodo(periodoQueContem('mes', '2026-03-10'), hoje)).toBe('Março');
    expect(tituloDoPeriodo(periodoQueContem('ano', '2024-05-05'), hoje)).toBe('2024');
  });

  it('subtítulo da semana como no design: "5 – 11 de julho"', () => {
    expect(subtituloDoPeriodo(periodoQueContem('semana', hoje))).toBe('5 – 11 de julho');
  });

  it('semana entre dois meses mostra os dois', () => {
    expect(subtituloDoPeriodo(periodoQueContem('semana', '2026-07-01'))).toBe(
      '28 de junho – 4 de julho',
    );
  });
});
