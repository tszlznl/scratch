# [S1] Problem

Scratch is an English-only application. All ~350-400 user-facing strings are hardcoded in English across ~20 component files. The user wants full Chinese localization.

# [S2] Solution Overview

Add i18n infrastructure using i18next (no React bindings) with a custom `useTranslation` hook. Auto-detect system language: Chinese systems get `zh-CN`, others get `en`. All strings extracted into JSON locale files.

# [S3] Architecture

```
src/
  i18n/
    index.ts              # i18next init + language detection
    useTranslation.ts     # Custom React hook wrapping i18next
    locales/
      en.json             # English translations (source of truth)
      zh-CN.json          # Chinese translations
```

- i18next initialized in `src/main.tsx` before React render
- Language detection: Tauri window language API → `navigator.language` fallback
- No runtime language switcher needed (auto-detect only)

# [S4] Key Naming Convention

Pattern: `component.area.key`

```
editor.toolbar.bold
editor.menu.copyMarkdown
sidebar.search.placeholder
settings.general.folderLocation
commandPalette.searchPlaceholder
toast.copiedMarkdown
dialog.deleteNote.title
git.branch
```

# [S5] Hook API

```typescript
const { t } = useTranslation();

// Simple
t('editor.toolbar.bold')

// With interpolation
t('toast.noteDeleted', { name: note.title })
t('git.filesChanged', { count: n })
```

The hook returns `{ t, i18n }` where `t` is the translation function and `i18n` is the i18next instance.

# [S6] Translation Coverage

Full translation of all user-facing strings (~350-400 unique keys):

| Component Area | Approximate Keys |
|----------------|-----------------|
| Editor toolbar + menu + status | ~55 |
| Sidebar | ~10 |
| Footer (Git) | ~15 |
| Settings pages (all) | ~117 |
| Command Palette | ~30 |
| NoteList + FolderTreeView | ~30 |
| FolderPicker | ~5 |
| AI components | ~14 |
| Search/Link/Math editors | ~13 |
| Slash Commands | ~32 |
| Shortcuts descriptions | ~45 |
| App.tsx | ~12 |
| Context error messages | ~27 |

**Not translated**: code blocks, CSS classes, HTML attributes, URLs, technical terms (KaTeX, TipTap, Git), platform variables (mod, shift).

# [S7] Implementation Steps

1. Install i18next, create `src/i18n/` structure
2. Create `en.json` with all extracted English strings
3. Create `zh-CN.json` with Chinese translations
4. Create `src/i18n/index.ts` (init config)
5. Create `src/i18n/useTranslation.ts` (hook)
6. Update `src/main.tsx` to initialize i18n
7. Replace hardcoded strings in all ~20 component files with `t()` calls

# [S8] Files Modified

**New files:**
- `src/i18n/index.ts`
- `src/i18n/useTranslation.ts`
- `src/i18n/locales/en.json`
- `src/i18n/locales/zh-CN.json`

**Modified files:**
- `package.json` (add i18next)
- `src/main.tsx` (init i18n)
- `src/components/editor/Editor.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/FolderPicker.tsx`
- `src/components/command-palette/CommandPalette.tsx`
- `src/components/notes/NoteList.tsx`
- `src/components/notes/FolderTreeView.tsx`
- `src/components/notes/FolderNameDialog.tsx`
- `src/components/settings/SettingsPage.tsx`
- `src/components/settings/GeneralSettingsSection.tsx`
- `src/components/settings/EditorSettingsSection.tsx`
- `src/components/settings/AboutSettingsSection.tsx`
- `src/components/settings/ToolsSettingsSection.tsx`
- `src/components/ai/AiEditModal.tsx`
- `src/components/ai/AiResponseToast.tsx`
- `src/components/editor/SearchToolbar.tsx`
- `src/components/editor/SlashCommand.tsx`
- `src/components/editor/SlashCommandList.tsx`
- `src/components/editor/WikilinkSuggestionList.tsx`
- `src/components/editor/LinkEditor.tsx`
- `src/components/editor/BlockMathEditor.tsx`
- `src/components/editor/CodeBlockView.tsx`
- `src/components/shortcuts/KeyboardShortcutsModal.tsx`
- `src/components/preview/PreviewApp.tsx`
- `src/App.tsx`
- `src/context/NotesContext.tsx`
- `src/context/GitContext.tsx`
- `src/lib/shortcuts.ts`

# [S9] Verification

1. `npm run build` — TypeScript compilation passes
2. `npm run tauri dev` — App launches, UI displays in Chinese on Chinese system
3. Manual check: all visible strings are translated
4. Fallback: on non-Chinese system, English strings display correctly
