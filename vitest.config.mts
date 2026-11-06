import { defineConfig } from 'vitest/config';

// Configuração do Vitest (a ferramenta que roda os testes).
// Dois grupos ("projetos") de testes:
export default defineConfig({
  test: {
    projects: [
      {
        // Testes UNITÁRIOS: regras de negócio puras. Rodam sem banco.
        test: {
          name: 'unidade',
          include: ['src/domain/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Testes de INTEGRAÇÃO: contra o Supabase local de verdade.
        test: {
          name: 'integracao',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          // Antes de tudo, busca endereço e chaves do Supabase local.
          globalSetup: ['tests/integration/preparar-ambiente.ts'],
          // Chamadas ao banco demoram mais que funções puras.
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
