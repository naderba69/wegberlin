# ADR-063 — Contextual German keyboard and bilingual grammar glossary

Date: 2026-09-11 — Africa/Tunis

Closes software acceptance for P2-381 and P2-383.

## Context

Arabic-keyboard and mobile learners repeatedly need `ä`, `ö`, `ü`, and `ß`, while grammar labels such as Dativ, Satzklammer, or Funktionsverbgefüge can make a complete course feel inaccessible. Sending learners to system-keyboard settings or an external glossary breaks the guided flow.

## Decision

### Contextual character dock

`virtual-german-character-keyboard-v1` watches focus only on editable `lang=de` inputs and textareas. It displays `ä ö ü ß Ä Ö Ü`, inserts at the current selection through the native value setter, dispatches a normal input event for controlled React fields, preserves cursor position, and returns focus to the field. It:

- never inspects or stores the value;
- never corrects or submits an answer;
- disappears outside German fields and under print media;
- collapses to a small reopen button after a character insertion or normal typing so it never covers the next form action;
- can be dismissed with Escape or its labeled close button;
- stays above the mobile bottom navigation.

### Bilingual grammar glossary

`bilingual-grammar-glossary-v1` provides 24 authored terms, six for each A1–B2 level. Every record includes German term, Arabic learning label, plain-Arabic definition, German example, and Arabic meaning. The Search surface exposes a collapsed, searchable, level-filtered glossary before larger strategy explorers. Opening or searching creates no progress, mastery, tracking, or network request.

## Acceptance

- All seven special characters insert or replace at the correct selection and update controlled fields.
- The dock is globally mounted but appears only for eligible German fields.
- The glossary has 24 unique IDs and exact 6/6/6/6 level balance.
- Desktop/mobile browser tests verify insertion inside the real A1 mediation response.
- Search browser tests verify 24 records, A2 filtering, and Dativ lookup.
- Language/Bidi and 320 px overflow audits remain green.

## Boundaries

The glossary is authored support, not an official CEFR terminology standard or a second grammar sequence. The virtual keyboard does not replace native input methods and does not guarantee that every third-party mobile keyboard behaves identically; real-device review remains in the final manual round.
