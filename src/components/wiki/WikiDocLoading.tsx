import { WikiPage, WikiStructure } from "@/app/types/types"
import { Messages } from "next-intl"

export default function WikiDocLoading({
  loadingMessage,
  isExporting,
  messages,
  wikiStructure,
  pagesInProgress,
  language,
}: {
  loadingMessage?: string
  isExporting: boolean
  messages: Messages
  wikiStructure?: WikiStructure
  pagesInProgress: Set<string>
  language: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[var(--card-bg)] rounded-lg shadow-custom card-japanese">
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-[var(--accent-primary)]/10 rounded-full blur-md animate-pulse"></div>
        <div className="relative flex items-center justify-center">
          <div className="w-3 h-3 bg-[var(--accent-primary)]/70 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-75 mx-2"></div>
          <div className="w-3 h-3 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
      <p className="text-[var(--foreground)] text-center mb-3 font-serif">
        {loadingMessage || messages.common?.loading || 'Loading...'}
        {isExporting && (messages.loading?.preparingDownload || ' Please wait while we prepare your download...')}
      </p>

      {/* Progress bar for page generation */}
      {wikiStructure && (
        <div className="w-full max-w-md mt-3">
          <div className="bg-[var(--background)]/50 rounded-full h-2 mb-3 overflow-hidden border border-[var(--border-color)]">
            <div
              className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{
                width: `${Math.max(5, 100 * (wikiStructure.pages.length - pagesInProgress.size) / wikiStructure.pages.length)}%`
              }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] text-center">
            {language === 'ja'
              ? `${wikiStructure.pages.length}ページ中${wikiStructure.pages.length - pagesInProgress.size}ページ完了`
              : messages.repoPage?.pagesCompleted
                  ? messages.repoPage.pagesCompleted
                      .replace('{completed}', (wikiStructure.pages.length - pagesInProgress.size).toString())
                      .replace('{total}', wikiStructure.pages.length.toString())
                  : `${wikiStructure.pages.length - pagesInProgress.size} of ${wikiStructure.pages.length} pages completed`}
          </p>

          {/* Show list of in-progress pages */}
          {pagesInProgress.size > 0 && (
            <div className="mt-4 text-xs">
              <p className="text-[var(--muted)] mb-2">
                {messages.repoPage?.currentlyProcessing || 'Currently processing:'}
              </p>
              <ul className="text-[var(--foreground)] space-y-1">
                {Array.from(pagesInProgress).slice(0, 3).map(pageId => {
                  const page = wikiStructure.pages.find((p: WikiPage) => p.id === pageId);
                  return page ? <li key={pageId} className="truncate border-l-2 border-[var(--accent-primary)]/30 pl-2">{page.title}</li> : null;
                })}
                {pagesInProgress.size > 3 && (
                  <li className="text-[var(--muted)]">
                    {language === 'ja'
                      ? `...他に${pagesInProgress.size - 3}ページ`
                      : messages.repoPage?.andMorePages
                          ? messages.repoPage.andMorePages.replace('{count}', (pagesInProgress.size - 3).toString())
                          : `...and ${pagesInProgress.size - 3} more`}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}