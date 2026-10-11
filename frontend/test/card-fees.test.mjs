import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCardFee, parseBrazilianAmount, saleAmountSchema } from '../src/lib/card-fees/calculator.ts';
test('valores brasileiros completos e rejeição de entradas parciais', () => {
  for (const [text, value] of [['1.000,00', 1000], ['1000,50', 1000.5], ['R$ 1.000,00', 1000], ['1.000', 1000], ['10', 10]]) assert.equal(parseBrazilianAmount(text), value);
  for (const text of ['', '12abc', '1,2,3', '-10', '1.23', 'NaN']) assert.ok(Number.isNaN(parseBrazilianAmount(text)));
  for (const value of [0, -1, Infinity, 1_000_000_001]) assert.equal(saleAmountSchema.safeParse(value).success, false);
});
test('repasse da taxa usa a fórmula do HTML', () => {
  assert.deepEqual(calculateCardFee(1000, "0.00", 1), { total: 1000, installment: 1000 });
  assert.deepEqual(calculateCardFee(1000, "0.00", 10), { total: 1000, installment: 100 });
  const visa = calculateCardFee(1000, "3.94", 2);
  assert.ok(Math.abs(visa.total * (1 - 0.0394) - 1000) < 0.000001);
  assert.equal(visa.installment, visa.total / 2);
  const link = calculateCardFee(1000, "16.66", 12);
  assert.ok(Math.abs(link.total - 1000 / (1 - 0.1666)) < 0.000001);
  for (const args of [[1000, "100.00", 2], [1000, "-1.00", 2], [1000, "3.94", 0], [1000, "3.94", 13]]) assert.throws(() => calculateCardFee(...args));
});

test('contrato exige percentual decimal em string com duas casas', () => {
  for (const rate of [3.94, 394, '3,94', '3.9', '3.940', 'NaN', '', '100.00', '-0.01']) {
    assert.throws(() => calculateCardFee(1000, rate, 2));
  }
  const result = calculateCardFee(1000, '99.99', 12);
  assert.ok(Math.abs(result.total - 10_000_000) < 0.001);
});
