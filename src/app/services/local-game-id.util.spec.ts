import { isLocalGameId } from './local-game-id.util';

describe('isLocalGameId', () => {
  it('is true for a local- prefixed gameId', () => {
    expect(isLocalGameId('local-abc123')).toBeTrue();
  });

  it('is false for a plain Firestore gameId', () => {
    expect(isLocalGameId('abc123')).toBeFalse();
  });
});
