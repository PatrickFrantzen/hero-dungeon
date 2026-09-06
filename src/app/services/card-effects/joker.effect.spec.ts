import { CardEffectContext } from './card-effect.types';
import { JokerEffect } from './joker.effect';

describe('JokerEffect', () => {
  let effect: JokerEffect;
  let ctx: jasmine.SpyObj<CardEffectContext>;

  beforeEach(() => {
    effect = new JokerEffect();
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

  it('consumes the first token of the current threat and reports the resulting threat', async () => {
    let enemy = { name: 'Goblin', type: 'Monster', token: ['red', 'green'] };
    ctx.currentEnemy.and.callFake(() => enemy);
    ctx.dispatchMonsterTokenUpdate.and.callFake((tokens: string[]) => (enemy = { ...enemy, token: tokens }));

    await effect.apply(ctx, 'player-1', 'joker', ['joker']);

    expect(ctx.dispatchMonsterTokenUpdate).toHaveBeenCalledWith(['green']);
    expect(ctx.updateCurrentEnemyToken).toHaveBeenCalledWith(jasmine.objectContaining({ token: ['green'] }));
    expect(ctx.checkForNextEnemy).toHaveBeenCalledWith(jasmine.objectContaining({ token: ['green'] }));
    expect(ctx.saveHand).toHaveBeenCalledWith('joker', ['joker']);
    expect(ctx.ensureGameTimerStarted).toHaveBeenCalled();
    expect(ctx.resumeGameTimerIfPaused).toHaveBeenCalled();
  });

  it('does nothing when the current threat has no tokens left', async () => {
    ctx.currentEnemy.and.returnValue({ name: 'Goblin', type: 'Monster', token: [] });

    await effect.apply(ctx, 'player-1', 'joker', ['joker']);

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

    await effect.apply(ctx, 'player-1', 'joker', ['joker']);

    expect(ctx.dispatchMonsterTokenUpdate).not.toHaveBeenCalled();
    expect(ctx.ensureGameTimerStarted).not.toHaveBeenCalled();
  });
});
