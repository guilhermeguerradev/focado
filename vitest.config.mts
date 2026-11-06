import { defineConfig } from 'vitest/config';

// Configuração do Vitest (a ferramenta que roda os testes).
export default defineConfig({
  test: {
    // Onde ficam os testes:
    // - src/domain: testes unitários das regras de negócio puras
    // - tests/integration: testes contra o Supabase local
    include: ['src/domain/**/*.test.ts', 'tests/**/*.test.ts'],
    // Os testes rodam no Node (sem celular, sem navegador).
    environment: 'node',
  },
});
