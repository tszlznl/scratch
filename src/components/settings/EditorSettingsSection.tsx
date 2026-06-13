import { useTheme, defaultThemeColors } from "../../context/ThemeContext";
import { Button, CodeCopyButton, IconButton, Input, Select } from "../ui";
import { ColorPicker } from "../ui/ColorPicker";
import type {
  FontFamily,
  TextDirection,
  EditorWidth,
  ThemeColorKey,
} from "../../types/note";
import { ChevronRightIcon, EyeIcon, MinusIcon, PlusIcon } from "../icons";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../i18n/useTranslation";

// Translation key mappings for theme color keys, grouped logically
const colorLabels: { key: ThemeColorKey; labelKey: string; groupKey: string }[] = [
  { key: "bg", labelKey: "settings.appearance.colorBackground", groupKey: "settings.appearance.groupSurfaces" },
  { key: "bg-secondary", labelKey: "settings.appearance.colorSidebar", groupKey: "settings.appearance.groupSurfaces" },
  { key: "bg-muted", labelKey: "settings.appearance.colorHoverFill", groupKey: "settings.appearance.groupSurfaces" },
  { key: "bg-emphasis", labelKey: "settings.appearance.colorStrongFill", groupKey: "settings.appearance.groupSurfaces" },
  { key: "text", labelKey: "settings.appearance.colorText", groupKey: "settings.appearance.groupTextUI" },
  { key: "text-muted", labelKey: "settings.appearance.colorSecondaryText", groupKey: "settings.appearance.groupTextUI" },
  { key: "accent", labelKey: "settings.appearance.colorAccent", groupKey: "settings.appearance.groupTextUI" },
  { key: "border", labelKey: "settings.appearance.colorBorder", groupKey: "settings.appearance.groupTextUI" },
  { key: "selection", labelKey: "settings.appearance.colorSelection", groupKey: "settings.appearance.groupTextUI" },
];

// Translation key mappings for select options
const textDirectionOptions: { value: TextDirection; labelKey: string }[] = [
  { value: "auto", labelKey: "settings.appearance.dirAuto" },
  { value: "ltr", labelKey: "settings.appearance.dirLtr" },
  { value: "rtl", labelKey: "settings.appearance.dirRtl" },
];

const editorWidthOptions: { value: EditorWidth; labelKey: string }[] = [
  { value: "narrow", labelKey: "settings.appearance.widthNarrow" },
  { value: "normal", labelKey: "settings.appearance.widthNormal" },
  { value: "wide", labelKey: "settings.appearance.widthWide" },
  { value: "full", labelKey: "settings.appearance.widthFull" },
  { value: "custom", labelKey: "settings.appearance.widthCustom" },
];

const fontFamilyOptions: { value: FontFamily; labelKey: string }[] = [
  { value: "system-sans", labelKey: "settings.appearance.fontSans" },
  { value: "serif", labelKey: "settings.appearance.fontSerif" },
  { value: "monospace", labelKey: "settings.appearance.fontMono" },
];

const boldWeightOptions = [
  { value: 500, labelKey: "settings.appearance.weightMedium", excludeForMonospace: true },
  { value: 600, labelKey: "settings.appearance.weightSemibold", excludeForMonospace: false },
  { value: 700, labelKey: "settings.appearance.weightBold", excludeForMonospace: false },
  { value: 800, labelKey: "settings.appearance.weightExtraBold", excludeForMonospace: false },
];

export function AppearanceSettingsSection() {
  const { t } = useTranslation();
  const {
    theme,
    resolvedTheme,
    setTheme,
    editorFontSettings,
    setEditorFontSetting,
    resetEditorFontSettings,
    textDirection,
    setTextDirection,
    editorWidth,
    setEditorWidth,
    interfaceZoom,
    setInterfaceZoom,
    customEditorWidthPx,
    setCustomEditorWidthPx,
    customColorsLight,
    customColorsDark,
    setCustomColor,
    resetCustomColor,
    resetAllCustomColors,
  } = useTheme();

  // Validated numeric change handler
  const handleNumericChange = (
    field: "baseFontSize" | "lineHeight",
    value: string,
    min: number,
    max: number,
  ) => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(parsed, min), max);
    setEditorFontSetting(field, clamped);
  };

  // Check if settings differ from defaults
  const hasCustomFonts =
    editorFontSettings.baseFontFamily !== "system-sans" ||
    editorFontSettings.baseFontSize !== 15 ||
    editorFontSettings.boldWeight !== 600 ||
    editorFontSettings.lineHeight !== 1.6 ||
    textDirection !== "auto" ||
    editorWidth !== "normal" ||
    Math.round(interfaceZoom * 100) !== 100;

  // Filter weight options based on font family
  const isMonospace = editorFontSettings.baseFontFamily === "monospace";
  const availableWeightOptions = boldWeightOptions.filter(
    (opt) => !isMonospace || !opt.excludeForMonospace,
  );

  // Handle font family change - bump up weight if needed
  const handleFontFamilyChange = (newFamily: FontFamily) => {
    setEditorFontSetting("baseFontFamily", newFamily);
    // If switching to monospace and current weight is medium, bump to semibold
    if (newFamily === "monospace" && editorFontSettings.boldWeight === 500) {
      setEditorFontSetting("boldWeight", 600);
    }
  };

  return (
    <div className="space-y-8 py-8">
      {/* Theme Section */}
      <section className="pb-2">
        <h2 className="text-xl font-medium mb-3">{t("settings.appearance.theme")}</h2>
        <div className="flex gap-2 p-1 rounded-[10px] border border-border">
          {(["light", "dark", "system"] as const).map((mode) => (
            <Button
              key={mode}
              onClick={() => setTheme(mode)}
              variant={theme === mode ? "primary" : "ghost"}
              size="md"
              className="flex-1"
            >
              {t(`settings.appearance.${mode}`)}
            </Button>
          ))}
        </div>
        {theme === "system" && (
          <p className="mt-3 text-sm text-text-muted">
            {t("settings.appearance.systemModeDescription", { mode: t(`settings.appearance.${resolvedTheme}`) })}
          </p>
        )}

        {/* Customize Colors */}
        {theme === "system" ? (
          <div className="mt-4 space-y-2">
            <ColorsExpandable
              label={t("settings.appearance.customizeLightColors")}
              mode="light"
              customColors={customColorsLight}
              setCustomColor={setCustomColor}
              resetCustomColor={resetCustomColor}
              resetAllCustomColors={resetAllCustomColors}
            />
            <ColorsExpandable
              label={t("settings.appearance.customizeDarkColors")}
              mode="dark"
              customColors={customColorsDark}
              setCustomColor={setCustomColor}
              resetCustomColor={resetCustomColor}
              resetAllCustomColors={resetAllCustomColors}
            />
          </div>
        ) : (
          <ColorsExpandable
            label={t("settings.appearance.customizeColors")}
            mode={resolvedTheme}
            customColors={
              resolvedTheme === "dark" ? customColorsDark : customColorsLight
            }
            setCustomColor={setCustomColor}
            resetCustomColor={resetCustomColor}
            resetAllCustomColors={resetAllCustomColors}
            className="mt-4"
          />
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-border border-dashed" />

      {/* Typography Section */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl font-medium">{t("settings.appearance.typography")}</h2>
          {hasCustomFonts && (
            <Button onClick={resetEditorFontSettings} variant="ghost" size="sm">
              {t("settings.appearance.resetDefaults")}
            </Button>
          )}
        </div>

        <div className="rounded-[10px] border border-border pl-4 py-3 pr-3 space-y-2">
          {/* Font Family */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("settings.appearance.font")}</label>
            <Select
              value={editorFontSettings.baseFontFamily}
              onChange={(e) =>
                handleFontFamilyChange(e.target.value as FontFamily)
              }
              className="w-40"
            >
              {fontFamilyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </Select>
          </div>

          {/* Base Font Size */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("settings.appearance.size")}</label>
            <div className="relative w-40">
              <Input
                type="number"
                min="12"
                max="24"
                value={editorFontSettings.baseFontSize}
                onChange={(e) =>
                  handleNumericChange("baseFontSize", e.target.value, 12, 24)
                }
                className="w-full h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Bold Weight */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("settings.appearance.boldWeight")}</label>
            <Select
              value={editorFontSettings.boldWeight}
              onChange={(e) =>
                setEditorFontSetting("boldWeight", Number(e.target.value))
              }
              className="w-40"
            >
              {availableWeightOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </Select>
          </div>

          {/* Line Height */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("settings.appearance.lineHeight")}</label>
            <div className="relative w-40">
              <Input
                type="number"
                min="1.0"
                max="2.5"
                step="0.1"
                value={editorFontSettings.lineHeight}
                onChange={(e) =>
                  handleNumericChange("lineHeight", e.target.value, 1.0, 2.5)
                }
                className="w-full h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Text Direction */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">
              {t("settings.appearance.textDirection")}
            </label>
            <Select
              value={textDirection}
              onChange={(e) =>
                setTextDirection(e.target.value as TextDirection)
              }
              className="w-40"
            >
              {textDirectionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </Select>
          </div>

          {/* Page Width */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">{t("settings.appearance.pageWidth")}</label>
            <Select
              value={editorWidth}
              onChange={(e) => setEditorWidth(e.target.value as EditorWidth)}
              className="w-40"
            >
              {editorWidthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </Select>
          </div>
          {editorWidth === "custom" && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-text font-medium">
                {t("settings.appearance.customWidth")}
              </label>
              <div className="relative w-40 flex items-center gap-2">
                <Input
                  type="number"
                  min="480"
                  max="3840"
                  step="10"
                  value={customEditorWidthPx}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (Number.isFinite(parsed)) {
                      setCustomEditorWidthPx(
                        Math.min(Math.max(parsed, 480), 3840),
                      );
                    }
                  }}
                  className="w-full h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-text-muted">{t("settings.appearance.px")}</span>
              </div>
            </div>
          )}

          {/* Interface Zoom */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-text font-medium">
              {t("settings.appearance.interfaceZoom")}
            </label>
            <div className="flex items-center gap-1 w-40">
              <IconButton
                variant="outline"
                size="md"
                onClick={() => setInterfaceZoom((prev) => prev - 0.05)}
                disabled={interfaceZoom <= 0.7}
                title={t("settings.appearance.zoomOut")}
              >
                <MinusIcon className="w-4 h-4" />
              </IconButton>
              <span className="text-sm font-medium tabular-nums flex-1 text-center">
                {Math.round(interfaceZoom * 100)}%
              </span>
              <IconButton
                variant="outline"
                size="md"
                onClick={() => setInterfaceZoom((prev) => prev + 0.05)}
                disabled={interfaceZoom >= 1.5}
                title={t("settings.appearance.zoomIn")}
              >
                <PlusIcon className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-3 relative">
          <div className="absolute top-3 left-4 flex items-center text-sm font-medium text-text-muted/70 gap-1">
            <EyeIcon className="w-4.5 h-4.5 stroke-[1.5]" />
            <span>{t("settings.appearance.previewLabel")}</span>
          </div>
          <div className="border border-border rounded-[10px] bg-bg p-6 pt-20 max-h-160 overflow-hidden rounded-t-lg">
            <div
              className="prose prose-lg dark:prose-invert max-w-xl mx-auto"
              dir={textDirection}
              style={{
                fontFamily:
                  editorFontSettings.baseFontFamily === "system-sans"
                    ? "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    : editorFontSettings.baseFontFamily === "serif"
                      ? "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
                      : "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
                fontSize: `${editorFontSettings.baseFontSize}px`,
              }}
            >
              <h1>Kibble Maximization Protocol</h1>
              <p>
                A comprehensive strategy document for getting your humans to
                increase daily food portions.{" "}
                <strong>Time-tested methods</strong> that actually work.
              </p>

              <h2>Primary Techniques</h2>
              <ul>
                <li>
                  <strong>The Sad Eyes Method</strong> - Sit near food bowl,
                  stare longingly
                </li>
                <li>
                  <strong>Strategic Meowing</strong> - Begin at 5 AM for maximum
                  effectiveness
                </li>
                <li>
                  <strong>Bowl Inspection</strong> - Loudly inspect empty bowl,
                  then stare at human
                </li>
                <li>
                  <strong>The Figure Eight</strong> - Weave between their legs
                  while they cook
                </li>
              </ul>

              <h2>Advanced Protocol</h2>
              <p>
                For optimal results, combine multiple techniques. The most
                successful combination involves the Sad Eyes Method followed
                immediately by Strategic Meowing.
              </p>

              <div className="relative my-1">
                <div className="absolute top-2 right-2 z-10">
                  <CodeCopyButton
                    text={`function acquireFood() {
  while (bowl.isEmpty()) {
    meow();
    rubAgainstLegs();
    if (human.isInKitchen) {
      stareIntently();
    }
  }
}`}
                  />
                </div>
                <pre className="pt-10">
                  <code>
                    {`function acquireFood() {
  while (bowl.isEmpty()) {
    meow();
    rubAgainstLegs();
    if (human.isInKitchen) {
      stareIntently();
    }
  }
}`}
                  </code>
                </pre>
              </div>

              <h2>Common Mistakes to Avoid</h2>
              <ol>
                <li>Never accept the first "no" - persistence is key</li>
                <li>
                  Maintain consistency in meal times (your schedule, not theirs)
                </li>
                <li>Don't forget to knock things off counters periodically</li>
              </ol>

              <p>
                Remember: <em>humans are trainable</em>. With dedication and the
                right approach, you can increase portions by up to 40% within
                the first month.
              </p>
            </div>
          </div>
          {/* Fade overlay - content to muted background */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-bg to-transparent pointer-events-none" />
        </div>
      </section>
    </div>
  );
}

// Expandable subsection for customizing colors for a single theme mode
function ColorsExpandable({
  label,
  mode,
  customColors,
  setCustomColor,
  resetCustomColor,
  resetAllCustomColors,
  className,
}: {
  label: string;
  mode: "light" | "dark";
  customColors: Partial<Record<ThemeColorKey, string>>;
  setCustomColor: (
    mode: "light" | "dark",
    key: ThemeColorKey,
    value: string,
  ) => void;
  resetCustomColor: (mode: "light" | "dark", key: ThemeColorKey) => void;
  resetAllCustomColors: (mode: "light" | "dark") => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const defaults = defaultThemeColors[mode];
  const hasAnyCustom = Object.keys(customColors).length > 0;

  return (
    <details className={cn("text-sm", className)}>
      <summary className="cursor-pointer text-text-muted hover:text-text select-none flex items-center gap-1 font-medium">
        <ChevronRightIcon className="w-3.5 h-3.5 stroke-2 transition-transform [[open]>&]:rotate-90" />
        {label}
        {hasAnyCustom && (
          <Button
            onClick={(e) => {
              e.preventDefault();
              resetAllCustomColors(mode);
            }}
            variant="ghost"
            size="sm"
            className="ml-auto"
          >
            {t("settings.appearance.resetAll")}
          </Button>
        )}
      </summary>
      <div className="mt-2 rounded-[10px] border border-border pl-4 py-3 pr-3 space-y-1.5">
        {(() => {
          let lastGroup = "";
          return colorLabels.map(({ key, labelKey, groupKey }) => {
            const showGroup = groupKey !== lastGroup;
            lastGroup = groupKey;
            return (
              <div key={key}>
                {showGroup && (
                  <div
                    className={`text-base text-text-muted font-medium ${key !== colorLabels[0].key ? "mt-6" : ""} mb-2.5`}
                  >
                    {t(groupKey)}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text font-medium">
                    {t(labelKey)}
                  </label>
                  <ColorPicker
                    color={customColors[key] ?? defaults[key]}
                    defaultColor={defaults[key]}
                    onChange={(value) => setCustomColor(mode, key, value)}
                    onReset={() => resetCustomColor(mode, key)}
                  />
                </div>
              </div>
            );
          });
        })()}
      </div>
    </details>
  );
}
