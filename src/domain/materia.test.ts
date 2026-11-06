import { describe, expect, it } from 'vitest';

import { ehCorMateria, podeCriarMateria, validarNomeMateria } from './materia';

describe('validarNomeMateria', () => {
  it('aceita nome normal', () => {
    expect(validarNomeMateria('Inglês')).toBeUndefined();
  });

  it('recusa nome vazio ou só com espaços', () => {
    expect(validarNomeMateria('   ')).toBe('Dê um nome para a matéria.');
  });

  it('aceita 20 caracteres e recusa 21', () => {
    expect(validarNomeMateria('a'.repeat(20))).toBeUndefined();
    expect(validarNomeMateria('a'.repeat(21))).toBe('O nome pode ter no máximo 20 caracteres.');
  });

  it('não conta espaços das pontas no tamanho', () => {
    expect(validarNomeMateria(`  ${'a'.repeat(20)}  `)).toBeUndefined();
  });
});

describe('ehCorMateria', () => {
  it('reconhece as cores da paleta', () => {
    expect(ehCorMateria('roxo')).toBe(true);
    expect(ehCorMateria('vermelho')).toBe(true);
  });

  it('recusa cor fora da paleta', () => {
    expect(ehCorMateria('dourado')).toBe(false);
    expect(ehCorMateria('#7C6BF5')).toBe(false);
  });
});

describe('podeCriarMateria (plano gratuito)', () => {
  it('deixa criar até a 4ª matéria', () => {
    expect(podeCriarMateria(0)).toBe(true);
    expect(podeCriarMateria(3)).toBe(true);
  });

  it('não deixa criar com 4 ou mais', () => {
    expect(podeCriarMateria(4)).toBe(false);
    expect(podeCriarMateria(7)).toBe(false);
  });
});
