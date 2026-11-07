import { describe, expect, it } from 'vitest';

import {
  mensagemDoCronometro,
  resumoAoFinalizar,
  type SituacaoCronometro,
} from './mensagemCronometro';

describe('resumoAoFinalizar (PRD 3.6)', () => {
  it('salva: comemora e diz quanto estudou', () => {
    expect(resumoAoFinalizar('salva', '25 min', 'Inglês')).toEqual({
      titulo: 'Sessão salva 🎉',
      mensagem: 'Você estudou 25 min de Inglês.',
    });
  });

  it('na fila: comemora e avisa que será enviada quando a internet voltar', () => {
    const { mensagem } = resumoAoFinalizar('na_fila', '25 min', 'Inglês');

    expect(mensagem).toContain('Você estudou 25 min de Inglês.');
    expect(mensagem).toContain('quando a conexão voltar');
  });

  it('curta: avisa que menos de 1 minuto não é salvo', () => {
    expect(resumoAoFinalizar('curta', 'menos de 1 min', 'Inglês').titulo).toBe(
      'Sessão muito curta',
    );
  });

  it('recusada: avisa que não foi salva', () => {
    expect(resumoAoFinalizar('recusada', '25 min', 'Inglês').titulo).toBe('Sessão não salva');
  });
});

const base: SituacaoCronometro = {
  temMaterias: true,
  temMateriaEscolhida: true,
  status: 'parado',
  noTeto: false,
};

describe('mensagemDoCronometro', () => {
  describe('sem sessão em andamento (parado)', () => {
    it('sem nenhuma matéria cadastrada, pede para cadastrar', () => {
      expect(mensagemDoCronometro({ ...base, temMaterias: false })).toBe(
        'Cadastre uma matéria abaixo',
      );
    });

    it('com matérias mas nenhuma escolhida, pede para escolher', () => {
      expect(mensagemDoCronometro({ ...base, temMateriaEscolhida: false })).toBe(
        'Escolha uma matéria abaixo',
      );
    });

    it('com matéria escolhida, convida a começar: "Bora estudar" (e NÃO diz "Pausado")', () => {
      expect(mensagemDoCronometro(base)).toBe('Bora estudar');
    });
  });

  describe('com sessão em andamento', () => {
    it('rodando: "Concentre-se!", como no design', () => {
      expect(mensagemDoCronometro({ ...base, status: 'rodando' })).toBe('Concentre-se!');
    });

    it('pausado: "Pausado"', () => {
      expect(mensagemDoCronometro({ ...base, status: 'pausado' })).toBe('Pausado');
    });

    it('no teto de 12h (rodando ou pausado): pede para finalizar', () => {
      expect(mensagemDoCronometro({ ...base, status: 'rodando', noTeto: true })).toBe(
        'Teto de 12h atingido — finalize',
      );
      expect(mensagemDoCronometro({ ...base, status: 'pausado', noTeto: true })).toBe(
        'Teto de 12h atingido — finalize',
      );
    });
  });
});
