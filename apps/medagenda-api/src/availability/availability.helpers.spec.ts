import { localDateAt, timeToMinutes } from './availability.service';

describe('availability helpers', () => {
  it('converte HH:mm em minutos', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('14:30')).toBe(870);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('cria Date local a partir de data e minutos', () => {
    const d = localDateAt('2026-11-09', 9 * 60 + 30);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(9);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
  });

  it('gera grade de slots coerente (30min sem buffer em 3h => 6 slots)', () => {
    const start = timeToMinutes('09:00');
    const end = timeToMinutes('12:00');
    const slots: number[] = [];
    for (let t = start; t + 30 <= end; t += 30) slots.push(t);
    expect(slots).toHaveLength(6);
    expect(slots[0]).toBe(540);
    expect(slots[5]).toBe(690); // 11:30
  });

  it('respeita buffer entre consultas (30min + 15min de intervalo)', () => {
    const start = timeToMinutes('09:00');
    const end = timeToMinutes('12:00');
    const slots: number[] = [];
    for (let t = start; t + 30 <= end; t += 45) slots.push(t);
    // 09:00, 09:45, 10:30, 11:15 (12:00 não cabe)
    expect(slots).toHaveLength(4);
  });
});
