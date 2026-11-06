import { describe, expect, it } from 'vitest';

import { somar } from './exemplo';

describe('somar (exemplo)', () => {
  it('soma dois números positivos', () => {
    expect(somar(2, 3)).toBe(5);
  });

  it('soma com número negativo', () => {
    expect(somar(10, -4)).toBe(6);
  });
});
