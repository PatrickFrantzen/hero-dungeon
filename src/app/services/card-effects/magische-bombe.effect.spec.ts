import { CardEffectContext } from './card-effect.types';
import { MagischeBombeEffect } from './magische-bombe.effect';

describe('MagischeBombeEffect', () => {
  let effect: MagischeBombeEffect;
  let ctx: jasmine.SpyObj<CardEffectContext>;

  beforeEach(() => {
    effect = new MagischeBombeEffect();
    ctx = jasmine.createSpyObj<CardEffectContext>('CardEffectContext', [
      'currentEnemy',
      'dispatchMonsterTokenUpdate',
      'updateCurrentEnemyToken',
      'checkForNextEnemy',
      'ensureGameTimerStarted',
      'resumeGameTimerIfPaused',
      'freezeGameTimer',
      'saveHand',
      'drawCardsIgnoringHandsize',
      'drawCardsForOtherPlayers',
      'reclaimCardsFromDeliveryStack',
      'reclaimCardsFromDeliveryStackForOtherPlayers',
    ]);
    ctx.ensureGameTimerStarted.and.resolveTo();
    ctx.resumeGameTimerIfPaused.and.resolveTo();
    ctx.updateCurrentEnemyToken.and.resolveTo();
    ctx.checkForNextEnemy.and.resolveTo();
    ctx.saveHand.and.resolveTo();
  });

  it('removes one occurrence of each present symbol and reports the resulting threat', async () => {
    let enemy = {
      name: 'Zola, die Gorgone',
      type: 'Boss',
      token: ['red', 'red', 'yellow', 'purple'],
    };
    ctx.currentEnemy.and.callFake(() => enemy);
    ctx.dispatchMonsterTokenUpdate.and.callFake(
      (tokens: string[]) => (enemy = { ...enemy, token: tokens }),
    );

    await effect.apply(ctx, 'player-1', 'magischeBombe', ['magischeBombe']);

    expect(ctx.dispatchMonsterTokenUpdate).toHaveBeenCalledWith(['red']);
    expect(ctx.updateCurrentEnemyToken).toHaveBeenCalledWith(
      jasmine.objectContaining({ token: ['red'] }),
    );
    expect(ctx.checkForNextEnemy).toHaveBeenCalledWith(
      jasmine.objectContaining({ token: ['red'] }),
    );
    expect(ctx.saveHand).toHaveBeenCalledWith('magischeBombe', [
      'magischeBombe',
    ]);
    expect(ctx.ensureGameTimerStarted).toHaveBeenCalled();
    expect(ctx.resumeGameTimerIfPaused).toHaveBeenCalled();
  });

  it('does nothing when the current threat has no tokens left', async () => {
    ctx.currentEnemy.and.returnValue({
      name: 'Goblin',
      type: 'Monster',
      token: [],
    });

    await effect.apply(ctx, 'player-1', 'magischeBombe', ['magischeBombe']);

    expect(ctx.dispatchMonsterTokenUpdate).not.toHaveBeenCalled();
    expect(ctx.ensureGameTimerStarted).not.toHaveBeenCalled();
    expect(ctx.saveHand).not.toHaveBeenCalled();
  });

  it('does nothing against an event threat', async () => {
    ctx.currentEnemy.and.returnValue({
      name: 'Chaos',
      type: 'Jeder gibt seine Handkarten einem Mitspieler.',
      token: ['event'],
    });

    await effect.apply(ctx, 'player-1', 'magischeBombe', ['magischeBombe']);

    expect(ctx.dispatchMonsterTokenUpdate).not.toHaveBeenCalled();
    expect(ctx.ensureGameTimerStarted).not.toHaveBeenCalled();
  });
});
