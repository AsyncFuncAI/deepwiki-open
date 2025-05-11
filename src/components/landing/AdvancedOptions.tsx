import { cn, t } from "@/utils/utils";
import { Messages } from "next-intl";
import { FaCog } from "react-icons/fa";
import { getConfig } from "@/config";
import { IoLanguageOutline } from "react-icons/io5";
import { MdSelectAll } from "react-icons/md";
import { GeneratorModel } from "@/app/types/types";
import UserSelector from "../UserSelector";

const config = getConfig('landingPage.advancedOptions');

export default function AdvancedOptions({
  selectedLanguage,
  setSelectedLanguage,
  provider,
  setProvider,
  model,
  setModel,
  isCustomModel,
  setIsCustomModel,
  customModel,
  setCustomModel,
  excludedDirs,
  setExcludedDirs,
  excludedFiles,
  setExcludedFiles,
  messages,
}: {
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  provider: string;
  setProvider: (provider: string) => void;
  model: string;
  setModel: (model: string) => void;
  isCustomModel: boolean;
  setIsCustomModel: (isCustomModel: boolean) => void;
  customModel: string;
  setCustomModel: (customModel: string) => void;
  excludedDirs: string;
  setExcludedDirs: (excludedDirs: string) => void;
  excludedFiles: string;
  setExcludedFiles: (excludedFiles: string) => void;
  messages: Messages;
}) {
  return (
    <div className={cn(
      "flex flex-wrap gap-4 items-start bg-[var(--card-bg)]/80 p-4 rounded-lg border border-[var(--border-color)] shadow-sm",
      config.position === 'modal' && "flex-col gap-2 bg-transparent border-none shadow-none"
    )}>
      {/* Language selection */}
      <div className="min-w-[140px]">
        <label htmlFor="language-select" className={cn("text-xs font-medium text-[var(--foreground)] mb-1.5 flex items-center gap-2", config.position === 'modal' && "text-sm")}>
          <IoLanguageOutline size={20} />
          {t('form.wikiLanguage', messages)}
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="input-japanese block w-full px-2.5 py-1.5 text-sm rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="en">English</option>
          <option value="ja">Japanese (日本語)</option>
          <option value="zh">Mandarin (中文)</option>
          <option value="es">Spanish (Español)</option>
          <option value="kr">Korean (한국어)</option>
          <option value="vi">Vietnamese (Tiếng Việt)</option>
        </select>
      </div>

      {/* Model options */}
      <div className="flex-1 min-w-[200px]">
        <UserSelector
          provider={provider}
          setProvider={setProvider}
          model={model}
          setModel={setModel}
          isCustomModel={isCustomModel}
          setIsCustomModel={setIsCustomModel}
          customModel={customModel}
          setCustomModel={setCustomModel}
          showFileFilters={true}
          excludedDirs={excludedDirs}
          setExcludedDirs={setExcludedDirs}
          excludedFiles={excludedFiles}
          setExcludedFiles={setExcludedFiles}
        />
      </div>
    </div>
  );
}