import { useState, useEffect, useReducer } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Button } from "../ui";
import {
  SpinnerIcon,
  CheckIcon,
  ClaudeIcon,
  CodexIcon,
  OpenCodeIcon,
  OllamaIcon,
} from "../icons";
import { AI_PROVIDER_ORDER, type AiProvider } from "../../services/ai";
import * as aiService from "../../services/ai";
import { mod } from "../../lib/platform";
import * as cliService from "../../services/cli";
import type { CliStatus } from "../../services/cli";
import { useTranslation } from "../../i18n/useTranslation";

type CliState = {
  status: CliStatus | null;
  loaded: boolean;
  error: boolean;
  operating: boolean;
};

type CliAction =
  | { type: "loaded"; status: CliStatus }
  | { type: "error" }
  | { type: "operating" }
  | { type: "operated"; status: CliStatus }
  | { type: "operate_failed" };

const cliInitialState: CliState = {
  status: null,
  loaded: false,
  error: false,
  operating: false,
};

function cliReducer(state: CliState, action: CliAction): CliState {
  switch (action.type) {
    case "loaded":
      return { ...state, status: action.status, loaded: true, error: false };
    case "error":
      return { ...state, error: true };
    case "operating":
      return { ...state, operating: true };
    case "operated":
      return { ...state, status: action.status, operating: false };
    case "operate_failed":
      return { ...state, operating: false };
  }
}

function CliUsageHint() {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-text-muted font-mono">
      {t("settings.tools.usageHint")}
      <br />
      {t("settings.tools.usageHintFolder")}
      <br />
      {t("settings.tools.usageHintApp")}
    </p>
  );
}

const AI_PROVIDER_INFO: Record<
  AiProvider,
  {
    nameKey: string;
    icon: React.ComponentType<{ className?: string }>;
    installUrl: string;
  }
> = {
  claude: {
    nameKey: "settings.tools.providerClaude",
    icon: ClaudeIcon,
    installUrl: "https://code.claude.com/docs/en/quickstart",
  },
  codex: {
    nameKey: "settings.tools.providerCodex",
    icon: CodexIcon,
    installUrl: "https://github.com/openai/codex",
  },
  opencode: {
    nameKey: "settings.tools.providerOpenCode",
    icon: OpenCodeIcon,
    installUrl: "https://opencode.ai",
  },
  ollama: {
    nameKey: "settings.tools.providerOllama",
    icon: OllamaIcon,
    installUrl: "https://ollama.com",
  },
};

export function ToolsSettingsSection() {
  const { t } = useTranslation();
  const [cli, dispatchCli] = useReducer(cliReducer, cliInitialState);
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
  const [aiProvidersLoading, setAiProvidersLoading] = useState(true);

  useEffect(() => {
    cliService
      .getCliStatus()
      .then((status) => dispatchCli({ type: "loaded", status }))
      .catch((err) => {
        console.error("Failed to get CLI status:", err);
        dispatchCli({ type: "error" });
      });
  }, []);

  useEffect(() => {
    aiService
      .getAvailableAiProviders()
      .then(setAiProviders)
      .catch(() => setAiProviders([]))
      .finally(() => setAiProvidersLoading(false));
  }, []);

  const handleInstallCli = async () => {
    dispatchCli({ type: "operating" });
    try {
      await cliService.installCli();
      const status = await cliService.getCliStatus();
      dispatchCli({ type: "operated", status });
      toast.success(
        t("settings.tools.toast.cliInstalled"),
      );
    } catch (err) {
      dispatchCli({ type: "operate_failed" });
      toast.error(
        err instanceof Error ? err.message : t("settings.tools.toast.failedToInstallCli"),
      );
    }
  };

  const handleUninstallCli = async () => {
    dispatchCli({ type: "operating" });
    try {
      await cliService.uninstallCli();
      const status = await cliService.getCliStatus();
      dispatchCli({ type: "operated", status });
      toast.success(t("settings.tools.toast.cliUninstalled"));
    } catch (err) {
      dispatchCli({ type: "operate_failed" });
      toast.error(
        err instanceof Error ? err.message : t("settings.tools.toast.failedToUninstallCli"),
      );
    }
  };

  return (
    <div className="space-y-8 py-8">
      {/* AI Providers */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-0.5">{t("settings.tools.aiProviders")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {t("settings.tools.aiDescription", { mod })}
        </p>

        {aiProvidersLoading ? (
          <div className="flex items-center gap-2 p-3">
            <SpinnerIcon className="w-4 h-4 animate-spin text-text-muted" />
            <span className="text-sm text-text-muted">
              {t("settings.tools.detectingProviders")}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {AI_PROVIDER_ORDER.map((provider) => {
              const installed = aiProviders.includes(provider);
              const info = AI_PROVIDER_INFO[provider];
              return (
                <div
                  key={provider}
                  className="flex items-center justify-between p-3 rounded-[10px] border border-border"
                >
                  <div className="flex items-center gap-2.5">
                    <info.icon className="w-4.5 h-4.5 text-text-muted" />
                    <span className="text-sm font-medium">{t(info.nameKey)}</span>
                  </div>
                  {installed ? (
                    <span className="flex items-center gap-1.25 text-sm text-text-muted">
                      {t("settings.tools.installed")}
                      <span className="h-4.5 w-4.5 bg-bg-emphasis rounded-full flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 stroke-[2.2]" />
                      </span>
                    </span>
                  ) : (
                    <a
                      href={info.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text font-medium hover:text-text-muted transition-colors cursor-pointer"
                    >
                      {t("settings.tools.install")}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CLI Tool (macOS only) */}
      {(cli.loaded && cli.status?.supported) || cli.error ? (
        <>
          <div className="border-t border-border border-dashed" />

          <section className="pb-2">
            <h2 className="text-xl font-medium mb-0.5">{t("settings.tools.cliTool")}</h2>
            <p className="text-sm text-text-muted mb-4">
              {t("settings.tools.cliDescription")}
            </p>

            {cli.error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                <p className="text-sm text-red-500">
                  {t("settings.tools.cliStatusFailed")}
                </p>
              </div>
            ) : cli.status === null ? (
              <div className="rounded-[10px] border border-border p-4 flex items-center justify-center">
                <SpinnerIcon className="w-4.5 h-4.5 stroke-[1.5] animate-spin text-text-muted" />
              </div>
            ) : cli.status.installed ? (
              <>
                <div className="rounded-[10px] border border-border p-4 space-y-3 mb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text font-medium">
                      {t("settings.tools.status")}
                    </span>
                    <span className="text-sm text-text-muted">{t("settings.tools.installed")}</span>
                  </div>
                  {cli.status.path && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text font-medium">
                        {t("settings.tools.path")}
                      </span>
                      <button
                        type="button"
                        className="text-xs font-mono text-text-muted bg-bg-muted px-2 py-0.5 rounded max-w-48 truncate cursor-pointer hover:bg-bg-hover transition-colors"
                        title={t("settings.tools.clickToCopy")}
                        onClick={async () => {
                          try {
                            await invoke("copy_to_clipboard", { text: cli.status!.path! });
                            toast.success(t("settings.tools.toast.pathCopied"));
                          } catch {
                            toast.error(t("settings.tools.toast.failedToCopyPath"));
                          }
                        }}
                      >
                        {cli.status.path}
                      </button>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border border-dashed">
                    <CliUsageHint />
                  </div>
                </div>
                <Button
                  onClick={handleUninstallCli}
                  disabled={cli.operating}
                  variant="outline"
                  size="md"
                >
                  {cli.operating ? (
                    <>
                      <SpinnerIcon className="w-3.25 h-3.25 mr-2 animate-spin" />
                      {t("settings.tools.uninstalling")}
                    </>
                  ) : (
                    t("settings.tools.uninstallCli")
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] border border-border bg-bg-secondary mb-2.5">
                  <CliUsageHint />
                </div>
                <Button
                  onClick={handleInstallCli}
                  disabled={cli.operating}
                  variant="outline"
                  size="md"
                >
                  {cli.operating ? (
                    <>
                      <SpinnerIcon className="w-3.25 h-3.25 mr-2 animate-spin" />
                      {t("settings.tools.installing")}
                    </>
                  ) : (
                    t("settings.tools.installCli")
                  )}
                </Button>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
