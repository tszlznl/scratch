import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { showUpdateToast } from "../../App";
import { Button } from "../ui";
import { RefreshCwIcon, SpinnerIcon, GithubIcon } from "../icons";
import { useTranslation } from "../../i18n/useTranslation";

export function AboutSettingsSection() {
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState<string>("");
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => {});
  }, []);

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    const result = await showUpdateToast();
    setCheckingUpdate(false);
    if (result === "no-update") {
      toast.success(t("settings.about.toast.latestVersion"));
    } else if (result === "error") {
      toast.error(t("settings.about.toast.checkFailed"));
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await invoke("open_url_safe", { url });
    } catch (err) {
      console.error("Failed to open URL:", err);
      toast.error(err instanceof Error ? err.message : t("settings.about.toast.failedToOpenUrl"));
    }
  };

  return (
    <div className="space-y-8 py-8">
      {/* Version */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-0.5">{t("settings.about.version")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.about.versionDescription", { version: appVersion || "..." })}
        </p>
        <Button
          onClick={handleCheckForUpdates}
          disabled={checkingUpdate}
          variant="outline"
          size="md"
          className="gap-1.25"
        >
          {checkingUpdate ? (
            <>
              <SpinnerIcon className="w-4.5 h-4.5 stroke-[1.5] animate-spin" />
              {t("settings.about.checking")}
            </>
          ) : (
            <>
              <RefreshCwIcon className="w-4.5 h-4.5 stroke-[1.5]" />
              {t("settings.about.checkForUpdates")}
            </>
          )}
        </Button>
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* About Section */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-1">{t("settings.about.aboutScratch")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.about.description")}{" "}
          <button
            onClick={() => handleOpenUrl("https://www.ericli.io/scratch")}
            className="text-text-muted border-b border-text-muted/50 hover:text-text hover:border-text cursor-pointer transition-colors"
          >
            {t("settings.about.ourWebsite")}
          </button>
          .
        </p>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.about.createdBy")}{" "}
          <button
            onClick={() => handleOpenUrl("https://ericli.io")}
            className="text-text-muted border-b border-text-muted/50 hover:text-text hover:border-text cursor-pointer transition-colors"
          >
            {t("settings.about.author")}
          </button>{" "}
          {t("settings.about.contributors")}
        </p>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => handleOpenUrl("https://github.com/erictli/scratch")}
            variant="outline"
            size="md"
            className="gap-1.25"
          >
            <GithubIcon className="w-4.5 h-4.5 stroke-[1.5]" />
            {t("settings.about.viewOnGitHub")}
          </Button>
          <Button
            onClick={() =>
              handleOpenUrl("https://github.com/erictli/scratch/issues")
            }
            variant="ghost"
            size="md"
            className="gap-1.25 text-text"
          >
            {t("settings.about.submitFeedback")}
          </Button>
        </div>
      </section>
    </div>
  );
}
