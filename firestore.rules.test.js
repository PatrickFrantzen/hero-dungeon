/**
 * Firestore Security Rules tests, run against the Firebase emulator (no real Firebase project
 * needed). Run with: npm run test:rules
 */
const { test, describe, before, after, afterEach } = require('node:test');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'hero-dungeon-rules-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('users/{userId}', () => {
  test("denies reading another user's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('users/bob').set({ userId: 'bob', userNickname: 'Bob' });
    });
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(aliceDb.doc('users/bob').get());
  });

  test('allows a user to read and write their own profile', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(aliceDb.doc('users/alice').set({ userId: 'alice', userNickname: 'Alice' }));
    await assertSucceeds(aliceDb.doc('users/alice').get());
  });

  test('denies anonymous access', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.doc('users/alice').get());
  });
});

describe('games/{gameId}/player/{playerId}', () => {
  test('allows a player to read and write their own save state', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(aliceDb.doc('games/game1/player/alice').set({ handstack: [] }));
    await assertSucceeds(aliceDb.doc('games/game1/player/alice').get());
  });

  test("denies reading or writing another player's save state", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('games/game1/player/bob').set({ handstack: ['card1'] });
    });
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(aliceDb.doc('games/game1/player/bob').get());
    await assertFails(aliceDb.doc('games/game1/player/bob').set({ handstack: [] }));
  });

  test('denies anonymous access to any player document', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.doc('games/game1/player/alice').set({ handstack: [] }));
  });
});

describe('games/{gameId}', () => {
  test('allows a signed-in user to create a game document while joining', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(
      aliceDb.doc('games/game1').set({
        choosenHeros: [{ playerId: 'alice', playerName: 'Alice', playerHero: 'Barbar' }],
      })
    );
  });

  test('allows any signed-in user to read a game document (needed to check for join)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('games/game1').set({
        choosenHeros: [{ playerId: 'alice', playerName: 'Alice', playerHero: 'Barbar' }],
      });
    });
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    await assertSucceeds(mallory.doc('games/game1').get());
  });

  test('denies anonymous reads and writes', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('games/game1').set({ choosenHeros: [] });
    });
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.doc('games/game1').get());
    await assertFails(anonDb.doc('games/game1').set({ choosenHeros: [] }));
  });
});

// Issue #77 (PR 5): 7-Tage-TTL auf lastActivityAt löscht games/{gameId}/player/{playerId}-
// Dokumente inaktiver anonymer Mitspieler, während games/{gameId} selbst (geteiltes Dokument)
// bewusst NICHT von der TTL-Policy erfasst ist (siehe services/CLAUDE.md) - eine laufende
// Gruppe darf durch das TTL-verschwundene Dokument eines Mitspielers nicht blockiert werden.
describe('games/{gameId} mit einem TTL-gelöschten Mitspieler-Dokument', () => {
  test('andere Spieler können weiterhin auf das geteilte games/{gameId}-Dokument zugreifen, obwohl bobs Spieler-Unterdokument fehlt', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      // bobs games/{gameId}/player/bob-Dokument existiert absichtlich NICHT (TTL-gelöscht) -
      // nur der geteilte Spieldokument-Eintrag in choosenHeros bleibt bestehen.
      await ctx.firestore().doc('games/game1').set({
        choosenHeros: [
          { playerId: 'alice', playerName: 'Alice', playerHero: 'Barbar' },
          { playerId: 'bob', playerName: 'Bob', playerHero: 'Dieb' },
        ],
      });
      await ctx.firestore().doc('games/game1/player/alice').set({ handstack: ['red'] });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(aliceDb.doc('games/game1').get());
    await assertSucceeds(aliceDb.doc('games/game1/player/alice').get());
    await assertSucceeds(aliceDb.doc('games/game1/player/alice').update({ handstack: ['blue'] }));
  });

  test('bobs verschwundenes Spieler-Dokument bleibt für andere Spieler weiterhin unzugreifbar (kein Ersatzzugriff durch die Lücke)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('games/game1').set({
        choosenHeros: [
          { playerId: 'alice', playerName: 'Alice', playerHero: 'Barbar' },
          { playerId: 'bob', playerName: 'Bob', playerHero: 'Dieb' },
        ],
      });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(aliceDb.doc('games/game1/player/bob').get());
    await assertFails(aliceDb.doc('games/game1/player/bob').set({ handstack: [] }));
  });
});
