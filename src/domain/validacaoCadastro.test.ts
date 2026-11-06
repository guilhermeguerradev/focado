import { describe, expect, it } from 'vitest';

import { semErros, validarCadastro, validarLogin } from './validacaoCadastro';

const cadastroValido = { nome: 'Ana', email: 'ana@exemplo.com', senha: '12345678' };

describe('validarCadastro', () => {
  it('aceita nome, e-mail e senha válidos', () => {
    expect(semErros(validarCadastro(cadastroValido))).toBe(true);
  });

  it('recusa nome vazio ou só com espaços', () => {
    expect(validarCadastro({ ...cadastroValido, nome: '   ' }).nome).toBe('Informe seu nome.');
  });

  it('aceita nome com 255 caracteres e recusa com 256', () => {
    expect(validarCadastro({ ...cadastroValido, nome: 'a'.repeat(255) }).nome).toBeUndefined();
    expect(validarCadastro({ ...cadastroValido, nome: 'a'.repeat(256) }).nome).toBeDefined();
  });

  it('recusa e-mail sem @ ou sem domínio', () => {
    expect(validarCadastro({ ...cadastroValido, email: 'ana.exemplo.com' }).email).toBe(
      'E-mail inválido.',
    );
    expect(validarCadastro({ ...cadastroValido, email: 'ana@exemplo' }).email).toBe(
      'E-mail inválido.',
    );
  });

  it('aceita senha com 8 caracteres e recusa com 7', () => {
    expect(validarCadastro({ ...cadastroValido, senha: '12345678' }).senha).toBeUndefined();
    expect(validarCadastro({ ...cadastroValido, senha: '1234567' }).senha).toBe(
      'A senha precisa ter pelo menos 8 caracteres.',
    );
  });

  it('aponta todos os campos com problema de uma vez', () => {
    const erros = validarCadastro({ nome: '', email: '', senha: '' });

    expect(Object.keys(erros).sort()).toEqual(['email', 'nome', 'senha']);
  });
});

describe('validarLogin', () => {
  it('aceita e-mail e senha preenchidos', () => {
    expect(semErros(validarLogin({ email: 'ana@exemplo.com', senha: 'qualquer' }))).toBe(true);
  });

  it('pede e-mail e senha quando estão vazios', () => {
    expect(validarLogin({ email: '', senha: '' })).toEqual({
      email: 'Informe seu e-mail.',
      senha: 'Informe sua senha.',
    });
  });
});
