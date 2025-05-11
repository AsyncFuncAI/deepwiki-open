import { RepoInfo, WikiPage, WikiStructure } from "@/app/types/types";
import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Ask from "@/components/wiki/Ask";
import { cn, getRepoUrl } from "@/utils/utils";
import { Messages } from "next-intl";
import { getConfig } from "@/config";

const config = getConfig('wikiPage.askSection');

export default function AskSection({
  wikiStructure,
  generatedPages,
  isLoading,
  messages,
  repoInfo,
  githubToken,
  gitlabToken,
  bitbucketToken,
  generatorModelName,
  language,
}: {
  wikiStructure?: WikiStructure
  generatedPages: Record<string, WikiPage>
  isLoading: boolean
  messages: Messages
  repoInfo: RepoInfo
  githubToken: string
  gitlabToken: string
  bitbucketToken: string
  generatorModelName: string
  language: string
}) {
  if (!config.enabled) {
    return null;
  }

  const [isAskSectionVisible, setIsAskSectionVisible] = useState(config.defaultState === 'open' || !config.collapsible);
  
  return (
    <div id="ask-section" className={cn(
      "max-w-6xl mx-auto flex flex-col gap-4 w-full",
      config.position === 'embed' && "sticky bottom-4 z-10 mx-4 opacity-[0.98]  w-[calc(100%-2rem)] rounded-lg"
    )}>
      {/* Only show Ask component when wiki is successfully generated */}
      {wikiStructure && Object.keys(generatedPages).length > 0 && !isLoading && (
        <div className={cn(
          "w-full rounded-lg p-5 shadow-custom card-japanese",
          config.position === 'embed' && "bg-[var(--card-bg)] opacity-[0.98] "
        )}>
          <button
            onClick={() => {
              if (config.collapsible) {
                setIsAskSectionVisible(!isAskSectionVisible)
              }
            }}
            className="w-full flex items-center justify-between text-left mb-3 text-sm font-serif text-[var(--foreground)] hover:text-[var(--accent-primary)] transition-colors"
            aria-expanded={isAskSectionVisible}
          >
            <span>
              {messages.repoPage?.askAboutRepo || 'Ask questions about this repository'}
            </span>
            {!config.collapsible ? null : isAskSectionVisible ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          <Ask
            repoUrl={repoInfo.owner && repoInfo.repo
              ? getRepoUrl(repoInfo.owner, repoInfo.repo, repoInfo.type, repoInfo.localPath)
              : "https://github.com/AsyncFuncAI/deepwiki-open"
            }
            githubToken={githubToken}
            gitlabToken={gitlabToken}
            bitbucketToken={bitbucketToken}
            generatorModelName={generatorModelName}
            language={language}
            isAskSectionVisible={isAskSectionVisible}
          />
        </div>
      )}
    </div>
  );
}