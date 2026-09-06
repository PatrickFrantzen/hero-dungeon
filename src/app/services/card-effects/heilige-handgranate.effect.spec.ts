import { CardEffectContext } from './card-effect.types';
import { HeiligeHandgranateEffect } from './heilige-handgranate.effect';

describe('HeiligeHandgranateEffect', () => {
  let effect: HeiligeHandgranateEffect;
  let ctx: jasmine.SpyObj<CardEffectContext>;

  beforeEach(() => {
    effect = new HeiligeHandgranateEffect();
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

  it('clears every token of the current threat, even a Boss, and reports it as defeated', async () => {
    ctx.currentEnemy.and.returnValue({ name: 'Zola, die Gorgone', type: 'Boss', token: ['red', 'red', 'yellow'] });

    await effect.apply(ctx, 'player-1', 'heiligeHandgranate', ['heiligeHandgranate']);

    expect(ctx.dispatchMonsterTokenUpdate).toHaveBeenCalledWith([]);
    expect(ctx.updateCurrentEnemyToken).toHaveBeenCalledWith(jasmine.objectContaining({ token: [] }));
    expect(ctx.checkForNextEnemy).toHaveBeenCalledWith(jasmine.objectContaining({ token: [] }));
    expect(ctx.saveHand).toHaveBeenCalledWith('heiligeHandgranate', ['heiligeHandgranate']);
    expect(ctx.ensureGameTimerStarted).toHaveBeenCalled();
    expect(ctx.resumeGameTimerIfPaused).toHaveBeenCalled();
  });

  it('also clears an already-empty threat (jederzeit spielbar)', async () => {
    ctx.currentEnemy.and.returnValue({ name: 'Goblin', type: 'Monster', token: [] });

    await effect.apply(ctx, 'player-1', 'heiligeHandgranate', ['heiligeHandgranate']);

    expect(ctx.dispatchMonsterTokenUpdate).toHaveBeenCalledWith([]);
    expect(ctx.saveHand).toHaveBeenCalledWith('heiligeHandgranate', ['heiligeHandgranate']);
  });
});
