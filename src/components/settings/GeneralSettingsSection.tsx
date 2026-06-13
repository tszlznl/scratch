import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useNotes } from "../../context/NotesContext";
import { useTheme } from "../../context/ThemeContext";
import { useGit } from "../../context/GitContext";
import { Button } from "../ui";
import { Input } from "../ui";
import {
  FolderIcon,
  FoldersIcon,
  ExternalLinkIcon,
  SpinnerIcon,
  CloudPlusIcon,
  ChevronRightIcon,
  XIcon,
} from "../icons";
import type { Settings } from "../../types/note";
import { useTranslation } from "../../i18n/useTranslation";

// Format remote URL for display - extract user/repo from full URL
function formatRemoteUrl(url: string | null, t: (key: string) => string): string {
  if (!url) return t("settings.general.connected");
  // Extract repo path from URL
  // SSH: git@github.com:user/repo.git
  // HTTPS: https://github.com/user/repo.git
  const sshMatch = url.match(/:([^/]+\/[^/]+?)(?:\.git)?$/);
  const httpsMatch = url.match(/\/([^/]+\/[^/]+?)(?:\.git)?$/);
  return sshMatch?.[1] || httpsMatch?.[1] || url;
}

// Convert git remote URL to a browsable web URL
function getRemoteWebUrl(url: string | null): string | null {
  if (!url) return null;
  // SSH: git@github.com:user/repo.git -> https://github.com/user/repo
  const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  // HTTPS: https://github.com/user/repo.git -> https://github.com/user/repo
  const httpsMatch = url.match(/^(https?:\/\/.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return httpsMatch[1];
  }
  return null;
}

export function GeneralSettingsSection() {
  const { t } = useTranslation();
  const { notesFolder, setNotesFolder } = useNotes();
  const { reloadSettings } = useTheme();
  const {
    status,
    gitAvailable,
    gitEnabled,
    isUpdatingGitEnabled,
    setGitEnabled,
    initRepo,
    isLoading,
    addRemote,
    setRemoteUrl: updateRemoteUrl,
    removeRemote,
    pushWithUpstream,
    isAddingRemote,
    isPushing,
    lastError,
    clearError,
  } = useGit();

  const [remoteUrl, setRemoteUrl] = useState("");
  const [showRemoteInput, setShowRemoteInput] = useState(false);
  const [isEditingRemote, setIsEditingRemote] = useState(false);
  const [noteTemplate, setNoteTemplate] = useState<string>("Untitled");
  const [previewNoteName, setPreviewNoteName] = useState<string>("Untitled");
  // Load template from settings on mount
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const settings = await invoke<Settings>("get_settings");
        const template = settings.defaultNoteName || "Untitled";
        setNoteTemplate(template);

        // Update preview
        const preview = await invoke<string>("preview_note_name", { template });
        setPreviewNoteName(preview);
      } catch (error) {
        console.error("Failed to load template:", error);
      }
    };
    loadTemplate();
  }, []);

  // Update preview when template changes (debounced)
  useEffect(() => {
    const updatePreview = async () => {
      try {
        const preview = await invoke<string>("preview_note_name", {
          template: noteTemplate,
        });
        setPreviewNoteName(preview);
      } catch (error) {
        setPreviewNoteName("Invalid template");
      }
    };

    const timer = setTimeout(updatePreview, 300);
    return () => clearTimeout(timer);
  }, [noteTemplate]);

  const handleSaveTemplate = async () => {
    try {
      const settings = await invoke<Settings>("get_settings");
      await invoke("update_settings", {
        newSettings: {
          ...settings,
          defaultNoteName: noteTemplate || undefined,
        },
      });
      toast.success(t("settings.general.toast.defaultNameSaved"));
    } catch (error) {
      console.error("Failed to save default name:", error);
      toast.error(t("settings.general.toast.failedToSaveDefaultName"));
    }
  };

  const handleChangeFolder = async () => {
    try {
      const selected = await invoke<string | null>("open_folder_dialog", {
        defaultPath: notesFolder || null,
      });

      if (selected) {
        await setNotesFolder(selected);
        // Reload theme/font settings from the new folder's .scratch/settings.json
        await reloadSettings();
      }
    } catch (err) {
      console.error("Failed to select folder:", err);
      toast.error(t("settings.general.toast.failedToSelectFolder"));
    }
  };

  const handleOpenFolder = async () => {
    if (!notesFolder) return;
    try {
      await invoke("open_in_file_manager", { path: notesFolder });
    } catch (err) {
      console.error("Failed to open folder:", err);
      toast.error(t("settings.general.toast.failedToOpenFolder"));
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await invoke("open_url_safe", { url });
    } catch (err) {
      console.error("Failed to open URL:", err);
      toast.error(err instanceof Error ? err.message : t("settings.general.toast.failedToOpenUrl"));
    }
  };

  // Format path for display - truncate middle if too long
  const formatPath = (path: string | null): string => {
    if (!path) return t("settings.general.notSet");
    const maxLength = 50;
    if (path.length <= maxLength) return path;

    // Show start and end of path
    const start = path.slice(0, 20);
    const end = path.slice(-25);
    return `${start}...${end}`;
  };

  const handleAddRemote = async () => {
    // Guard against concurrent submissions
    if (isAddingRemote) return;
    if (!remoteUrl.trim()) return;
    const success = await addRemote(remoteUrl.trim());
    if (success) {
      setRemoteUrl("");
      setShowRemoteInput(false);
    }
  };

  const handleStartEditRemote = () => {
    setRemoteUrl(status?.remoteUrl || "");
    setIsEditingRemote(true);
    clearError();
  };

  const handleCancelEditRemote = () => {
    setIsEditingRemote(false);
    setRemoteUrl("");
    clearError();
  };

  const handleSaveRemoteUrl = async () => {
    if (isAddingRemote) return;
    const trimmed = remoteUrl.trim();
    if (!trimmed) return;
    if (trimmed === status?.remoteUrl) {
      setIsEditingRemote(false);
      return;
    }
    const success = await updateRemoteUrl(trimmed);
    if (success) {
      setRemoteUrl("");
      setIsEditingRemote(false);
    }
  };

  const handleRemoveRemote = async () => {
    if (isAddingRemote) return;
    const success = await removeRemote();
    if (success) {
      setRemoteUrl("");
      setIsEditingRemote(false);
    }
  };

  const handlePushWithUpstream = async () => {
    await pushWithUpstream();
  };

  const handleCancelRemote = () => {
    setShowRemoteInput(false);
    setRemoteUrl("");
    clearError();
  };

  const handleToggleGitEnabled = async (enabled: boolean) => {
    if (isUpdatingGitEnabled) return;

    const success = await setGitEnabled(enabled);
    if (!success) {
      toast.error(t("settings.general.toast.failedToToggleGit"));
      return;
    }

    if (!enabled) {
      setShowRemoteInput(false);
      setIsEditingRemote(false);
      setRemoteUrl("");
    }
  };

  return (
    <div className="space-y-8 py-8">
      {/* Folder Location */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-0.5">{t("settings.general.folderLocation")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.general.folderDescription")}
        </p>
        <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] border border-border mb-2.5">
          <div className="p-2 rounded-md bg-bg-muted">
            <FolderIcon className="w-4.5 h-4.5 stroke-[1.5] text-text-muted" />
          </div>
          <p
            className="text-sm text-text-muted truncate"
            title={notesFolder || undefined}
          >
            {formatPath(notesFolder)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={handleChangeFolder}
            variant="outline"
            size="md"
            className="gap-1.25"
          >
            <FoldersIcon className="w-4.5 h-4.5 stroke-[1.5]" />
            {t("settings.general.changeFolder")}
          </Button>
          {notesFolder && (
            <Button
              onClick={handleOpenFolder}
              variant="ghost"
              size="md"
              className="gap-1.25 text-text"
            >
              {t("settings.general.openFolder")}
            </Button>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Folders Section */}
      <section className="pb-2">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-0.75">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium">{t("settings.general.enableFolders")}</h2>
            </div>
            <p className="text-sm text-text-muted max-w-lg">
              {t("settings.general.foldersDescription")}
            </p>
          </div>
          <FoldersToggle />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Git Section */}
      <section className="pb-2 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-0.75">
            <h2 className="text-xl font-medium">{t("settings.general.versionControl")}</h2>
            <p className="text-sm text-text-muted max-w-lg">
              {t("settings.general.gitDescription")}
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-[10px] border border-border">
            <Button
              onClick={() => handleToggleGitEnabled(false)}
              variant={!gitEnabled ? "primary" : "ghost"}
              size="xs"
              disabled={isUpdatingGitEnabled}
            >
              {t("settings.general.off")}
            </Button>
            <Button
              onClick={() => handleToggleGitEnabled(true)}
              variant={gitEnabled ? "primary" : "ghost"}
              size="xs"
              disabled={isUpdatingGitEnabled}
            >
              {t("settings.general.on")}
            </Button>
          </div>
        </div>
        {!gitEnabled ? null : !gitAvailable ? (
          <div className="bg-bg-secondary rounded-[10px] border border-border p-4">
            <p className="text-sm text-text-muted">
              {t("settings.general.gitNotAvailable")}{" "}
              <a
                href="https://git-scm.com/downloads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted border-b border-text-muted/50 hover:text-text hover:border-text cursor-pointer transition-colors"
              >
                {t("settings.general.installGit")}
              </a>{" "}
              {t("settings.general.toEnableVC")}
            </p>
          </div>
        ) : isLoading ? (
          <div className="rounded-[10px] border border-border p-4 flex items-center justify-center">
            <SpinnerIcon className="w-4.5 h-4.5 stroke-[1.5] animate-spin text-text-muted" />
          </div>
        ) : !status?.isRepo ? (
          <div className="bg-bg-secondary rounded-[10px] border border-border p-4">
            <p className="text-sm text-text-muted mb-2">
              {t("settings.general.enableGitDescription")}
            </p>
            <Button
              onClick={initRepo}
              disabled={isLoading}
              variant="outline"
              size="md"
            >
              {t("settings.general.initGitRepo")}
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-[10px] border border-border p-4 space-y-2.5">
              {/* Branch status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text font-medium">{t("settings.general.status")}</span>
                <span className="text-sm text-text-muted">
                  {status.currentBranch
                    ? t("settings.general.onBranch", { branch: status.currentBranch })
                    : t("settings.general.gitEnabled")}
                </span>
              </div>

              {/* Remote configuration */}
              {status.hasRemote ? (
                <>
                  {isEditingRemote ? (
                    <div className="space-y-2">
                      <span className="text-sm text-text font-medium">
                        {t("settings.general.remote")}
                      </span>
                      <Input
                        type="text"
                        value={remoteUrl}
                        onChange={(e) => setRemoteUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRemoteUrl();
                          if (e.key === "Escape") handleCancelEditRemote();
                        }}
                        placeholder={t("settings.general.remotePlaceholder")}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveRemoteUrl}
                          disabled={
                            isAddingRemote ||
                            !remoteUrl.trim() ||
                            remoteUrl.trim() === status.remoteUrl
                          }
                          size="sm"
                        >
                          {isAddingRemote ? (
                            <>
                              <SpinnerIcon className="w-3 h-3 mr-2 animate-spin" />
                              {t("settings.general.saving")}
                            </>
                          ) : (
                            t("settings.general.save")
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEditRemote}
                          disabled={isAddingRemote}
                        >
                          {t("settings.general.cancel")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveRemote}
                          disabled={isAddingRemote}
                          className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          {t("settings.general.remove")}
                        </Button>
                      </div>
                      <RemoteInstructions />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-text font-medium">
                        {t("settings.general.remote")}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        {getRemoteWebUrl(status.remoteUrl) ? (
                          <button
                            onClick={() =>
                              handleOpenUrl(getRemoteWebUrl(status.remoteUrl)!)
                            }
                            className="flex items-center gap-0.75 text-sm text-text-muted hover:text-text truncate max-w-50 transition-colors cursor-pointer"
                            title={status.remoteUrl || undefined}
                          >
                            <span className="truncate">
                              {formatRemoteUrl(status.remoteUrl, t)}
                            </span>
                            <ExternalLinkIcon className="w-3.25 h-3.25 shrink-0" />
                          </button>
                        ) : (
                          <span
                            className="text-sm text-text-muted truncate max-w-50"
                            title={status.remoteUrl || undefined}
                          >
                            {formatRemoteUrl(status.remoteUrl, t)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleStartEditRemote}
                          className="text-sm text-text font-medium hover:text-text-muted transition-colors cursor-pointer"
                        >
                          {t("settings.general.change")}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upstream tracking status */}
                  {status.hasUpstream ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text font-medium">
                        {t("settings.general.tracking")}
                      </span>
                      <span className="text-sm text-text-muted">
                        origin/{status.currentBranch}
                      </span>
                    </div>
                  ) : (
                    status.currentBranch && (
                      <div className="pt-3 border-t border-border border-dashed space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text font-medium">
                            {t("settings.general.tracking")}
                          </span>
                          <span className="text-sm font-medium text-amber-500">
                            {t("settings.general.notSetUp")}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted mb-2">
                          {t("settings.general.pushTrackingDescription", { branch: status.currentBranch })}
                        </p>
                        <Button
                          onClick={handlePushWithUpstream}
                          disabled={isPushing}
                          size="sm"
                          className="mb-1.5"
                        >
                          {isPushing ? (
                            <>
                              <SpinnerIcon className="w-3.25 h-3.25 mr-2 animate-spin" />
                              {t("settings.general.pushing")}
                            </>
                          ) : (
                            t("settings.general.pushAndTrack", { branch: status.currentBranch })
                          )}
                        </Button>
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="pt-3 border-t border-border border-dashed space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text font-medium">
                      {t("settings.general.remote")}
                    </span>
                    <span className="text-sm font-medium text-red-500">
                      {t("settings.general.notConnected")}
                    </span>
                  </div>

                  {showRemoteInput ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={remoteUrl}
                        onChange={(e) => setRemoteUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddRemote();
                          if (e.key === "Escape") handleCancelRemote();
                        }}
                        placeholder={t("settings.general.remotePlaceholder")}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddRemote}
                          disabled={isAddingRemote || !remoteUrl.trim()}
                          size="sm"
                        >
                          {isAddingRemote ? (
                            <>
                              <SpinnerIcon className="w-3 h-3 mr-2 animate-spin" />
                              {t("settings.general.connecting")}
                            </>
                          ) : (
                            t("settings.general.connect")
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelRemote}
                        >
                          {t("settings.general.cancel")}
                        </Button>
                      </div>
                      <RemoteInstructions />
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => setShowRemoteInput(true)}
                        variant="outline"
                        size="md"
                      >
                        <CloudPlusIcon className="w-4 h-4 stroke-[1.7] mr-1.5" />
                        {t("settings.general.addRemote")}
                      </Button>
                      <RemoteInstructions />
                    </>
                  )}
                </div>
              )}

              {/* Stats — hidden whenever there's an error, since counts may be stale or misleading alongside it */}
              {lastError ? (
                <div className="flex items-center justify-between pt-3 border-t border-border border-dashed">
                  <span className="text-sm text-text font-medium">{t("settings.general.status")}</span>
                  <span className="text-sm text-text-muted">
                    {t("settings.general.errorOccurred")}
                  </span>
                </div>
              ) : (
                <>
                  {status.changedCount > 0 && (
                    <div className="flex items-center justify-between pt-3 border-t border-border border-dashed">
                      <span className="text-sm text-text font-medium">
                        {t("settings.general.changesToCommit")}
                      </span>
                      <span className="text-sm text-text-muted">
                        {t("settings.general.filesChanged", { count: status.changedCount })}
                      </span>
                    </div>
                  )}

                  {status.aheadCount > 0 && status.hasUpstream && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text font-medium">
                        {t("settings.general.commitsToPush")}
                      </span>
                      <span className="text-sm text-text-muted">
                        {t("settings.general.commitCount", { count: status.aheadCount })}
                      </span>
                    </div>
                  )}

                  {status.behindCount > 0 && status.hasUpstream && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text font-medium">
                        {t("settings.general.commitsToPull")}
                      </span>
                      <span className="text-sm text-text-muted">
                        {t("settings.general.commitCount", { count: status.behindCount })}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Error display */}
              {lastError && (
                <div className="pt-3 border-t border-border">
                  <div className="bg-red-500/10 rounded-md p-3">
                    <p className="text-sm text-red-500 first-letter:capitalize">
                      {lastError}
                    </p>
                    {(lastError.includes("Authentication") ||
                      lastError.includes("SSH")) && (
                      <a
                        href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-red-500 hover:text-red-600 underline font-medium mt-1 inline-block"
                      >
                        {t("settings.general.learnSSH")}
                      </a>
                    )}
                    <Button
                      onClick={clearError}
                      variant="link"
                      className="block text-sm h-auto p-0 mt-2 text-red-500 hover:text-red-600 font-medium"
                    >
                      {t("settings.general.dismiss")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* New Note Template */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-0.5">{t("settings.general.defaultNoteName")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.general.defaultNameDescription")}
        </p>

        <div className="space-y-2">
          <div>
            <Input
              type="text"
              value={noteTemplate}
              onChange={(e) => setNoteTemplate(e.target.value)}
              onBlur={handleSaveTemplate}
              placeholder={t("settings.general.untitled")}
            />
          </div>
            <div className="text-2xs text-text-muted font-mono p-2 rounded-md bg-bg-muted mb-4">
              {t("settings.general.preview", { name: previewNoteName })}
          </div>

          {/* Template Tags Reference */}
          <details className="text-sm">
            <summary className="cursor-pointer text-text-muted hover:text-text select-none flex items-center gap-1 font-medium">
              <ChevronRightIcon className="w-3.5 h-3.5 stroke-2 transition-transform [[open]>&]:rotate-90" />
              {t("settings.general.templateTags")}
            </summary>
            <div className="mt-2 space-y-1.5 pl-2 text-text-muted">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                <code>{"{timestamp}"}</code>
                <span>1739586000</span>
                <code>{"{date}"}</code>
                <span>2026-02-15</span>
                <code>{"{time}"}</code>
                <span>14-30-45</span>
                <code>{"{year}"}</code>
                <span>2026</span>
                <code>{"{month}"}</code>
                <span>02</span>
                <code>{"{day}"}</code>
                <span>15</span>
                <code>{"{monthName}"}</code>
                <span>February</span>
                <code>{"{monthShort}"}</code>
                <span>Feb</span>
                <code>{"{weekday}"}</code>
                <span>Sunday</span>
                <code>{"{weekdayShort}"}</code>
                <span>Sun</span>
                <code>{"{dayOrdinal}"}</code>
                <span>15th</span>
                <code>{"{counter}"}</code>
                <span>1, 2, 3...</span>
              </div>
              <p className="text-xs mt-2 pt-2 border-t border-border">
                {t("settings.general.templateExamples")}
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Ignored Folders */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-0.5">{t("settings.general.ignoredFolders")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.general.ignoredFoldersDescription")}
        </p>
        <IgnoredFoldersEditor />
      </section>
    </div>
  );
}

function FoldersToggle() {
  const { t } = useTranslation();
  const [foldersEnabled, setFoldersEnabled] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    invoke<Settings>("get_settings")
      .then((s) => {
        setFoldersEnabled(s.foldersEnabled === true);
      })
      .catch((error) => {
        console.error("Failed to load folder setting:", error);
        setFoldersEnabled(false);
      });
  }, []);

  const handleToggle = async (enabled: boolean) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const settings = await invoke<Settings>("get_settings");
      await invoke("update_settings", {
        newSettings: { ...settings, foldersEnabled: enabled },
      });
      setFoldersEnabled(enabled);
    } catch {
      toast.error(t("settings.general.toast.failedToToggleFolders"));
    } finally {
      setIsUpdating(false);
    }
  };

  if (foldersEnabled === null) {
    return (
      <div className="flex gap-1 p-1 rounded-[10px] border border-border shrink-0">
        <Button variant="ghost" size="xs" disabled>
          {t("settings.general.off")}
        </Button>
        <Button variant="ghost" size="xs" disabled>
          {t("settings.general.on")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1 p-1 rounded-[10px] border border-border shrink-0">
      <Button
        onClick={() => handleToggle(false)}
        variant={!foldersEnabled ? "primary" : "ghost"}
        size="xs"
        disabled={isUpdating}
      >
        {t("settings.general.off")}
      </Button>
      <Button
        onClick={() => handleToggle(true)}
        variant={foldersEnabled ? "primary" : "ghost"}
        size="xs"
        disabled={isUpdating}
      >
        {t("settings.general.on")}
      </Button>
    </div>
  );
}

function IgnoredFoldersEditor() {
  const { t } = useTranslation();
  const [patterns, setPatterns] = useState<string[] | null>(null);
  const [defaults, setDefaults] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { notesFolder, refreshNotes } = useNotes();

  useEffect(() => {
    setPatterns(null);
    Promise.all([
      invoke<Settings>("get_settings"),
      invoke<string[]>("get_default_ignored_patterns"),
    ])
      .then(([settings, defaultPatterns]) => {
        setDefaults(defaultPatterns);
        setPatterns(settings.ignoredPatterns ?? defaultPatterns);
      })
      .catch((error) => {
        console.error("Failed to load ignored patterns:", error);
        setPatterns([]);
      });
  }, [notesFolder]);

  const save = async (updated: string[] | null) => {
    setIsSaving(true);
    try {
      const settings = await invoke<Settings>("get_settings");
      await invoke("update_settings", {
        newSettings: {
          ...settings,
          ignoredPatterns: updated ?? undefined,
        },
      });
      setPatterns(updated ?? defaults);
      refreshNotes();
      try {
        await invoke("rebuild_search_index");
      } catch {
        toast.error(
          t("settings.general.toast.searchIndexFailed"),
        );
      }
    } catch {
      toast.error(t("settings.general.toast.failedToSaveIgnoredFolders"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newPattern.trim();
    if (!trimmed || !patterns) return;
    if (/[/\\]/.test(trimmed)) {
      toast.error(t("settings.general.toast.invalidIgnorePattern"));
      return;
    }
    if (patterns.includes(trimmed)) {
      toast.error(t("settings.general.toast.alreadyInList"));
      return;
    }
    setNewPattern("");
    save([...patterns, trimmed]);
  };

  const handleRemove = (pattern: string) => {
    if (!patterns) return;
    save(patterns.filter((p) => p !== pattern));
  };

  const handleReset = () => {
    save(null);
  };

  const isDefault =
    patterns !== null &&
    patterns.length === defaults.length &&
    patterns.every((p, i) => p === defaults[i]);

  if (patterns === null) {
    return <div className="text-sm text-text-muted py-2">{t("settings.general.loading")}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {patterns.map((pattern) => (
          <span
            key={pattern}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.75 rounded-md bg-bg-muted text-2xs font-mono"
          >
            {pattern}
            <button
              type="button"
              aria-label={`Remove ${pattern}`}
              onClick={() => handleRemove(pattern)}
              disabled={isSaving}
              className="p-0.5 rounded hover:bg-bg-hover text-text-muted hover:text-text cursor-pointer"
            >
              <XIcon className="w-3 h-3 stroke-[1.7]" />
            </button>
          </span>
        ))}
        {patterns.length === 0 && (
          <span className="text-sm text-text-muted">
            {t("settings.general.noFoldersIgnored")}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={newPattern}
          onChange={(e) => setNewPattern(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={t("settings.general.addFolderPlaceholder")}
          className="flex-1"
          disabled={isSaving}
        />
        <Button
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="h-10"
          disabled={isSaving || !newPattern.trim()}
        >
          {t("settings.general.add")}
        </Button>
      </div>
      {!isDefault && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="text-sm text-text-muted hover:text-text cursor-pointer font-medium"
        >
          {t("settings.general.resetToDefaults")}
        </button>
      )}
    </div>
  );
}

function RemoteInstructions() {
  const { t } = useTranslation();
  return (
    <div className="text-sm text-text-muted space-y-1.5 pt-2 pb-1.5">
      <p className="font-medium">{t("settings.general.remoteInstructions")}</p>
      <ol className="list-decimal list-inside space-y-0.5 pl-1">
        <li>{t("settings.general.remoteStep1")}</li>
        <li>{t("settings.general.remoteStep2")}</li>
        <li>{t("settings.general.remoteStep3")}</li>
      </ol>
      <p className="text-text-muted/70 pt-1">
        {t("settings.general.remoteExample")}
      </p>
    </div>
  );
}
