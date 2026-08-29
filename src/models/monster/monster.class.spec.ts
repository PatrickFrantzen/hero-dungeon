import { Monster } from './monster.class';

describe('Monster', () => {
  it('creates a singleplayer dungeon with five normal monsters and one solo-safe event for Baby-Barbar', () => {
    const mob = new Monster().createMob(1, 'Baby-Barbar', 'easy');

    expect(mob.length).toBe(6);
    expect(mob.filter((entry) => entry.token.includes('event')).length).toBe(1);
    expect(mob.filter((entry) => !entry.token.includes('event')).length).toBe(5);
    expect(mob.some((entry) => entry.name === 'Chaos')).toBeFalse();
  });
});
