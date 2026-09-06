import { CardEffectContext } from './card-effect.types';
import { GoettlicherSchildEffect } from './goettlicher-schild.effect';

describe('GoettlicherSchildEffect', () => {
  let effect: GoettlicherSchildEffect;
  let ctx: jasmine.SpyObj<CardEffectContext>;

  beforeEach(() => {
    effect = new GoettlicherSchildEffect();
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
    ctx.freezeGameTimer.and.resolveTo();
    ctx.saveHand.and.resolveTo();
    ctx.drawCardsIgnoringHandsize.and.resolveTo();
    ctx.drawCardsForOtherPlayers.and.resolveTo();
  });

  it('freezes the timer and lets every player draw one card, ignoring the hand size limit', async () => {
    await effect.apply(ctx, 'player-1', 'göttlicherSchild', [
      'göttlicherSchild',
    ]);

    expect(ctx.ensureGameTimerStarted).toHaveBeenCalled();
    expect(ctx.freezeGameTimer).toHaveBeenCalled();
    expect(ctx.saveHand).toHaveBeenCalledWith('göttlicherSchild', [
      'göttlicherSchild',
    ]);
    expect(ctx.drawCardsIgnoringHandsize).toHaveBeenCalledWith(1);
    expect(ctx.drawCardsForOtherPlayers).toHaveBeenCalledWith(1);
  });

  it('does not touch the current threat', async () => {
    await effect.apply(ctx, 'player-1', 'göttlicherSchild', [
      'göttlicherSchild',
    ]);

    expect(ctx.dispatchMonsterTokenUpdate).not.toHaveBeenCalled();
    expect(ctx.updateCurrentEnemyToken).not.toHaveBeenCalled();
    expect(ctx.checkForNextEnemy).not.toHaveBeenCalled();
  });
});
