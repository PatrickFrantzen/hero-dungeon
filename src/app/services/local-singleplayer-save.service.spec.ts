import { TestBed } from '@angular/core/testing';
import { Game } from 'src/models/game';

import { LocalSingleplayerSave, LocalSingleplayerSaveService } from './local-singleplayer-save.service';

function buildSave(saveId: string): LocalSingleplayerSave {
  return {
    saveId,
    updatedAt: 1000,
    game: { gameId: saveId } as Game,
    player: {
      playerId: 'solo-player',
      choosenHero: { heroname: 'Dieb' },
      handstack: [],
      cardstack: [],
      deliveryStack: [],
    },
  };
}

describe('LocalSingleplayerSaveService', () => {
  let service: LocalSingleplayerSaveService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalSingleplayerSaveService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('listSaves returns an empty array when nothing was saved yet', () => {
    expect(service.listSaves()).toEqual([]);
  });

  it('createSave makes the save show up in listSaves', () => {
    service.createSave(buildSave('save-1'));

    expect(service.listSaves()).toEqual([buildSave('save-1')]);
  });

  it('getSave returns undefined for an unknown saveId', () => {
    service.createSave(buildSave('save-1'));

    expect(service.getSave('unknown-save')).toBeUndefined();
  });

  it('getSave returns the matching save', () => {
    service.createSave(buildSave('save-1'));
    service.createSave(buildSave('save-2'));

    expect(service.getSave('save-2')).toEqual(buildSave('save-2'));
  });

  it('updateSave overwrites the given save without touching the others', () => {
    service.createSave(buildSave('save-1'));
    service.createSave(buildSave('save-2'));

    const updated = { ...buildSave('save-2'), updatedAt: 2000 };
    service.updateSave('save-2', updated);

    expect(service.getSave('save-2')).toEqual(updated);
    expect(service.getSave('save-1')).toEqual(buildSave('save-1'));
  });

  it('deleteSave removes the given save without touching the others (Issue #85)', () => {
    service.createSave(buildSave('save-1'));
    service.createSave(buildSave('save-2'));

    service.deleteSave('save-1');

    expect(service.getSave('save-1')).toBeUndefined();
    expect(service.getSave('save-2')).toEqual(buildSave('save-2'));
  });

  it('deleteSave on an unknown saveId is a no-op', () => {
    service.createSave(buildSave('save-1'));

    service.deleteSave('unknown-save');

    expect(service.listSaves()).toEqual([buildSave('save-1')]);
  });
});
