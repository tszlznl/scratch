import { useSyncExternalStore, useCallback } from "react";
import i18n from "./index";

const getSnapshot = () => i18n.language;
const getServerSnapshot = () => "en";

export function useTranslation() {
  const locale = useSyncExternalStore(
    (cb) => {
      i18n.on("languageChanged", cb);
      return () => i18n.off("languageChanged", cb);
    },
    getSnapshot,
    getServerSnapshot,
  );

  const t = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      i18n.t(key, options),
    [locale],
  );

  return { t, i18n };
}