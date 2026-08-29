# enemy/ — Container/Presenter-Paar

- **`enemy-container/enemy-container.component.ts`** — liest Store (`gameId`, `currentEnemy`
  aus `EncounterSelectors`, `questCardStatus`) und schreibt per `effect()` den Quest-Card-Status
  zurück (Store-Dispatch + `GameRepositoryService.updateQuestStatus()`). Kein eigenes Markup
  außer dem Weiterreichen an `<app-enemy>`.
- **`enemy.component.ts`** (+ `.html`/`.scss`) — reine Darstellung, bekommt alles über
  `input()` (`gameId`, `currentEnemy`, `questCardStatus`), kein Store-/Firestore-Zugriff.

Neues Feature, das Gegner-Zustand anzeigt: an `EnemyComponent`s Inputs andocken statt einen
zweiten Store-Zugriffspunkt zu schaffen. Neue Ableitung/Seiteneffekt aus dem Gegner-Zustand
gehört in den Container (`computed()`/`effect()`), nicht in die Presenter-Komponente.
