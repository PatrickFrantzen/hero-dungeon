import { CardEffectContext } from './card-effect.types';
import { HeiltrankEffect } from './heiltrank.effect';

describe('HeiltrankEffect', () => {
  let effect: HeiltrankEffect;
  let ctx: jasmine.SpyObj<CardEffectContext>;

  beforeEach(() => {
    effect = new HeiltrankEffect();
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
    ctx.saveHand.and.resolveTo();
    ctx.reclaimCardsFromDeliveryStack.and.resolveTo();
    ctx.reclaimCardsFromDeliveryStackForOtherPlayers.and.resolveTo();
  });

  it('lets every player (including the acting one) reclaim 3 cards from their delivery stack', async () => {
    await effect.apply(ctx, 'player-1', 'heiltrank', ['heiltrank']);

    expect(ctx.ensureGameTimerStarted).toHaveBeenCalled();
    expect(ctx.resumeGameTimerIfPaused).toHaveBeenCalled();
    expect(ctx.saveHand).toHaveBeenCalledWith('heiltrank', ['heiltrank']);
    expect(ctx.reclaimCardsFromDeliveryStack).toHaveBeenCalledWith(3);
    expect(
      ctx.reclaimCardsFromDeliveryStackForOtherPlayers,
    ).toHaveBeenCalledWith(3);
  });

  it('does not touch the current threat', async () => {
    await effect.apply(ctx, 'player-1', 'heiltrank', ['heiltrank']);

    expect(ctx.dispatchMonsterTokenUpdate).not.toHaveBeenCalled();
    expect(ctx.updateCurrentEnemyToken).not.toHaveBeenCalled();
    expect(ctx.checkForNextEnemy).not.toHaveBeenCalled();
  });
});
