import { User } from './user.class';

describe('User', () => {
  it('can be constructed without userEmail (anonymous multiplayer accounts have none)', () => {
    const user = new User({
      userId: 'anon-uid',
      userNickname: 'Gast',
      choosenHero: {},
      handstack: [],
      deliveryStack: [],
    });

    expect(user.userEmail).toBeUndefined();
    expect(user.userId).toBe('anon-uid');
  });

  it('toJSON() omits userEmail when it was never set, instead of writing undefined', () => {
    const user = new User({
      userId: 'anon-uid',
      userNickname: 'Gast',
      choosenHero: {},
      handstack: [],
      deliveryStack: [],
    });

    // Firestore lehnt ein Feld mit dem Wert `undefined` ab ("Unsupported field value:
    // undefined") - toJSON() darf userEmail für anonyme Nutzer daher nicht mitschreiben.
    expect(user.toJSON()).not.toEqual(jasmine.objectContaining({ userEmail: jasmine.anything() }));
    expect('userEmail' in user.toJSON()).toBeFalse();
  });

  it('toJSON() includes userEmail when it was set (registered accounts)', () => {
    const user = new User({
      userId: 'uid-1',
      userEmail: 'alice@example.com',
      userNickname: 'Alice',
      choosenHero: {},
      handstack: [],
      deliveryStack: [],
    });

    expect(user.toJSON()).toEqual(jasmine.objectContaining({ userEmail: 'alice@example.com' }));
  });

  it('defaults lastActivityAt to null and accepts an explicit value', () => {
    const freshUser = new User();
    expect(freshUser.lastActivityAt).toBeNull();

    const withActivity = new User({
      userId: 'uid-1',
      userNickname: 'Alice',
      choosenHero: {},
      handstack: [],
      deliveryStack: [],
      lastActivityAt: 'server-timestamp-placeholder' as unknown as User['lastActivityAt'],
    });
    expect(withActivity.lastActivityAt).toBe('server-timestamp-placeholder' as unknown as User['lastActivityAt']);
  });
});
