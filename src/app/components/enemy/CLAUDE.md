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

## Kategorie-Icon (Person/Hindernis/Monster)

`EnemyComponent.typeIcon` (`computed()`) mappt `currentEnemy().type` über das lokale
`typeIconByType`-Record (`'Person' → 'person'`, `'Hindernis' → 'hindernis'`,
`'Monster' → 'monster'`) auf einen Dateinamen unter `assets/img/monsterToken/`. Boss/Mini-Boss
und die freitextigen Ereigniskarten-Beschreibungen (siehe `Mob.type` in
`monster-collection.data.ts`) haben keinen Eintrag — `typeIcon()` liefert dann `undefined`, das
`@if (typeIcon(); as icon)` im Template rendert dann nichts. Das Icon wird im `@for` über
`currentEnemy().token` als zusätzliches, letztes `<img>` in `.enemy-tokens` angehängt (gleiches
Styling wie die Kampf-Token-Icons, kein eigener CSS-Block nötig). Die drei Bilder sind wie die
Kartenbilder auf 256 Farben quantisiert und auf 160×160px zugeschnitten (Rendergröße max. 44px,
siehe `enemy.component.scss`).
