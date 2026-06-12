import i18n from "i18next";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

i18n.init({
  resources: {
    en: { translation: en },
    "zh-CN": { translation: zhCN },
  },
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  detection: {
    order: ["navigator"],
    caches: [],
  },
});

export default i18n;