import { GameComponent } from './components/game/game.component';
import { routes } from './app.routes';

describe('routes', () => {
  it('local-game/:id renders the game without requiring a login', () => {
    const localGameRoute = routes.find((route) => route.path === 'local-game/:id');

    expect(localGameRoute?.component).toBe(GameComponent);
    expect(localGameRoute?.canActivate).toBeUndefined();
  });

  it('startscreen is reachable without requiring a login', () => {
    const startscreenRoute = routes.find((route) => route.path === 'startscreen');

    expect(startscreenRoute?.canActivate).toBeUndefined();
  });
});
