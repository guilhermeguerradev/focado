import { describe, expect, it } from 'vitest';

import { mensagemDoCronometro, type SituacaoCronometro } from './mensagemCronometro';

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
