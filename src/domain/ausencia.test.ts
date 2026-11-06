import { describe, expect, it } from 'vitest';

import { registrarSaida, registrarVolta } from './ausencia';
import { finalizar, iniciarSessao, pausar, tempoDecorrido } from './cronometro';

// Relógio de mentira a partir de 14:00.
const INICIO = new Date('2026-07-22T14:00:00Z');
const minuto = (m: number) => new Date(INICIO.getTime() + m * 60_000);

function rodandoDesde14h() {
  return iniciarSessao({ sessionId: 's1', materiaId: 'm1', agora: INICIO });
}

describe('sair do app (registrarSaida)', () => {
  it('rodando: anota o horário em que saiu', () => {
    const sessao = registrarSaida(rodandoDesde14h(), minuto(30));

    expect(sessao.saiuEm).toBe(minuto(30).toISOString());
  });

  it('pausado: não anota nada (não há o que contar)', () => {
    const pausada = pausar(rodandoDesde14h(), minuto(10));

    expect(registrarSaida(pausada, minuto(30)).saiuEm).toBeNull();
  });

  it('sair de novo sem ter voltado não "renova" o prazo', () => {
    const primeira = registrarSaida(rodandoDesde14h(), minuto(30));

    expect(registrarSaida(primeira, minuto(50)).saiuEm).toBe(minuto(30).toISOString());
  });
});

describe('voltar ao app (registrarVolta)', () => {
  it('voltou dentro de 1h: segue rodando e o tempo fora CONTA', () => {
    // 14:00 inicia, 14:30 sai, 15:10 volta (40 min fora)
    const fora = registrarSaida(rodandoDesde14h(), minuto(30));
    const { sessao, pausadaPorAusencia } = registrarVolta(fora, minuto(70));

    expect(pausadaPorAusencia).toBe(false);
    expect(sessao.status).toBe('rodando');
    expect(sessao.saiuEm).toBeNull();
    expect(tempoDecorrido(sessao, minuto(70))).toBe(70 * 60);
  });

  it('voltou depois de 1h: pausa contando só até completar 1h fora', () => {
    // 14:00 inicia, 14:30 sai, 16:30 volta (2h fora) → conta até 15:30 = 90 min
    const fora = registrarSaida(rodandoDesde14h(), minuto(30));
    const { sessao, pausadaPorAusencia } = registrarVolta(fora, minuto(150));

    expect(pausadaPorAusencia).toBe(true);
    expect(sessao.status).toBe('pausado');
    expect(tempoDecorrido(sessao, minuto(150))).toBe(90 * 60);
  });

  it('exatamente 1h fora ainda está no prazo', () => {
    const fora = registrarSaida(rodandoDesde14h(), minuto(30));

    expect(registrarVolta(fora, minuto(90)).pausadaPorAusencia).toBe(false);
  });

  it('sem saída anotada, voltar não muda nada', () => {
    const sessao = rodandoDesde14h();

    expect(registrarVolta(sessao, minuto(500))).toEqual({ sessao, pausadaPorAusencia: false });
  });

  it('app fechado à força: ao reabrir dias depois, pausa em 1h fora', () => {
    // O estado salvo é só um JSON; ler de volta e aplicar a volta basta.
    const salvo = JSON.parse(JSON.stringify(registrarSaida(rodandoDesde14h(), minuto(20))));
    const { sessao } = registrarVolta(salvo, minuto(3 * 24 * 60));

    expect(tempoDecorrido(sessao, minuto(3 * 24 * 60))).toBe(80 * 60); // 20 min + 1h
  });
});

describe('o tempo nunca passa de 1h fora, mesmo antes de "voltar"', () => {
  it('fora há 3h e ainda não voltou: o relógio para em 1h fora', () => {
    const fora = registrarSaida(rodandoDesde14h(), minuto(30));

    expect(tempoDecorrido(fora, minuto(210))).toBe(90 * 60);
  });

  it('finalizar (ex.: pelo envio da fila) também respeita o limite', () => {
    const fora = registrarSaida(rodandoDesde14h(), minuto(30));

    expect(finalizar(fora, minuto(600)).duracaoSegundos).toBe(90 * 60);
  });
});
