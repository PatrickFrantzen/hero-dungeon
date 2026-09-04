# Externe Skills — mattpocock/skills

Diese Skills stammen aus [github.com/mattpocock/skills](https://github.com/mattpocock/skills)
(MIT-Lizenz, siehe `LICENSE-mattpocock-skills`), vendored als editierbare Kopie (Stand-Commit
`3cca18b368ae95cdbdebbff572ccafa662551015`, 2026-09-04) statt als verwaltetes Claude-Code-Plugin
— so bleiben sie direkt im Repo anpassbar.

Übernommen wurden alle Skills aus den Buckets `engineering/`, `productivity/` und
`in-progress/` des Quell-Repos (flach nach Skill-Name benannt, analog zum eigenen
`scripts/link-skills.sh` der Quelle). Bewusst **nicht** übernommen: `skills/deprecated/` (vom
Autor als abgelöst markiert) und `skills/misc/` (laut Quell-READMEs nicht promotet).

**Namenskollision:** `code-review` existiert sowohl hier (mattpocock, projekt-lokal) als auch als
eingebauter Claude-Code-Skill — je nach Auflösungsreihenfolge kann einer den anderen
überschatten. Bei Bedarf hier umbenennen oder den eingebauten Skill bevorzugen.

**Update**: neue Version aus der Quelle erneut nach `.claude/skills/<name>/` kopieren (kein
Submodule/Symlink, da eigenständig im Projekt versioniert) und diesen Stand-Commit-Hinweis
aktualisieren.

**Einstieg**: `setup-matt-pocock-skills` einmal ausführen (Issue-Tracker/Triage-Label/Domain-Doc-
Konfiguration für dieses Repo), danach sind u.a. `tdd`, `code-review`, `to-tickets`,
`domain-modeling`, `codebase-design` nutzbar. Details je Skill in dessen `SKILL.md`.
