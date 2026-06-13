import { mod, shift } from "./platform";
import i18n from "../i18n";

export interface Shortcut {
  keys: string[];
  description: string;
}

export interface ShortcutCategory {
  id: string;
  title: string;
  shortcuts: Shortcut[];
}

export function getShortcutCategories(): ShortcutCategory[] {
  const t = i18n.t;
  return [
    {
      id: "navigation",
      title: t("shortcuts.category.navigation"),
      shortcuts: [
        { keys: [mod, "P"], description: t("shortcuts.cmd.commandPalette") },
        { keys: [mod, shift, "F"], description: t("shortcuts.cmd.searchNotes") },
        { keys: [mod, "\\"], description: t("shortcuts.cmd.toggleSidebar") },
        { keys: [mod, ","], description: t("shortcuts.cmd.settings") },
        { keys: [mod, "/"], description: t("shortcuts.cmd.keyboardShortcuts") },
        { keys: [mod, "W"], description: t("shortcuts.cmd.closeWindow") },
        { keys: [mod, "="], description: t("shortcuts.cmd.zoomIn") },
        { keys: [mod, "-"], description: t("shortcuts.cmd.zoomOut") },
        { keys: [mod, "0"], description: t("shortcuts.cmd.resetZoom") },
      ],
    },
    {
      id: "notes",
      title: t("shortcuts.category.notes"),
      shortcuts: [
        { keys: [mod, "N"], description: t("shortcuts.cmd.newNote") },
        { keys: [mod, "D"], description: t("shortcuts.cmd.duplicateNote") },
        { keys: [mod, "R"], description: t("shortcuts.cmd.reloadNote") },
        { keys: ["Delete"], description: t("shortcuts.cmd.deleteNote") },
        { keys: [mod, "Backspace"], description: t("shortcuts.cmd.deleteNote") },
        { keys: ["↑", "↓"], description: t("shortcuts.cmd.navigateNotes") },
        { keys: ["Enter"], description: t("shortcuts.cmd.focusEditor") },
        { keys: ["Esc"], description: t("shortcuts.cmd.backToList") },
      ],
    },
    {
      id: "editor",
      title: t("shortcuts.category.editor"),
      shortcuts: [
        { keys: [mod, "B"], description: t("shortcuts.cmd.bold") },
        { keys: [mod, "I"], description: t("shortcuts.cmd.italic") },
        { keys: [mod, "K"], description: t("shortcuts.cmd.addEditLink") },
        { keys: [mod, "F"], description: t("shortcuts.cmd.findInNote") },
        { keys: [mod, shift, "C"], description: t("shortcuts.cmd.copyExport") },
        { keys: [mod, shift, "P"], description: t("shortcuts.cmd.printPdf") },
        { keys: [mod, shift, "M"], description: t("shortcuts.cmd.markdownSource") },
        { keys: [mod, shift, "Enter"], description: t("shortcuts.cmd.focusMode") },
        { keys: ["/"], description: t("shortcuts.cmd.slashCommands") },
      ],
    },
    {
      id: "settings",
      title: t("shortcuts.category.settings"),
      shortcuts: [
        { keys: [mod, "1"], description: t("settings.tabGeneral") },
        { keys: [mod, "2"], description: t("settings.tabEditor") },
        { keys: [mod, "3"], description: t("settings.tabShortcuts") },
        { keys: [mod, "4"], description: t("settings.tabAbout") },
      ],
    },
    {
      id: "markdownSyntax",
      title: t("shortcuts.category.markdownSyntax"),
      shortcuts: [
        { keys: ["#"], description: t("shortcuts.md.h1") },
        { keys: ["##"], description: t("shortcuts.md.h2") },
        { keys: ["###"], description: t("shortcuts.md.h3") },
        { keys: ["**bold**"], description: t("shortcuts.md.boldText") },
        { keys: ["*italic*"], description: t("shortcuts.md.italicText") },
        { keys: ["~~text~~"], description: t("shortcuts.md.strikethrough") },
        { keys: ["-"], description: t("shortcuts.md.bulletList") },
        { keys: ["1."], description: t("shortcuts.md.numberedList") },
        { keys: ["- [ ]"], description: t("shortcuts.md.taskList") },
        { keys: [">"], description: t("shortcuts.md.blockquote") },
        { keys: ["`code`"], description: t("shortcuts.md.inlineCode") },
        { keys: ["```"], description: t("shortcuts.md.codeBlock") },
        { keys: ["---"], description: t("shortcuts.md.horizontalRule") },
        { keys: ["[text](url)"], description: t("shortcuts.md.link") },
        { keys: ["[[Note]]"], description: t("shortcuts.md.wikilink") },
        { keys: ["![alt](url)"], description: t("shortcuts.md.image") },
        { keys: ["| | |"], description: t("shortcuts.md.table") },
        { keys: ["$$...$$"], description: t("shortcuts.md.blockMath") },
        { keys: ["```mermaid"], description: t("shortcuts.md.mermaidDiagram") },
      ],
    },
  ];
}
