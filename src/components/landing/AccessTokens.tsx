import { t } from "@/utils/utils";
import { Messages } from "next-intl";
import { FaBitbucket, FaGithub, FaGitlab } from "react-icons/fa";
import { getConfig } from "@/config";
import { IoKeyOutline } from "react-icons/io5";
const config = getConfig('landingPage.advancedOptions');

interface PlatformAccessTokenProps {
  showTokenInputs: boolean;
  setShowTokenInputs: (show: boolean) => void;
  selectedPlatform: 'github' | 'gitlab' | 'bitbucket';
  setSelectedPlatform: (platform: 'github' | 'gitlab' | 'bitbucket') => void;
  accessToken: string;
  setAccessToken: (token: string) => void;
  messages: Messages;
}

export default function AccessTokens({
  showTokenInputs,
  setShowTokenInputs,
  selectedPlatform,
  setSelectedPlatform,
  accessToken,
  setAccessToken,
  messages,
}: PlatformAccessTokenProps) {
  if (config.position === 'modal') {
    return (
      <div className="p-4 pt-0 flex flex-col gap-2">
        <PlatformAccessToken
          showTokenInputs={showTokenInputs}
          setShowTokenInputs={setShowTokenInputs}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          accessToken={accessToken}
          setAccessToken={setAccessToken}
          messages={messages}
        />
      </div>
    )
  }
  return (
    <div className="flex items-center relative">
      <button
        type="button"
        onClick={() => setShowTokenInputs(!showTokenInputs)}
        className="text-sm text-[var(--accent-primary)] hover:text-[var(--highlight)] flex items-center transition-colors border-b border-[var(--border-color)] hover:border-[var(--accent-primary)] pb-0.5"
      >
        {showTokenInputs ? t('form.hideTokens', messages) : t('form.addTokens', messages)}
      </button>
      {showTokenInputs && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={() => setShowTokenInputs(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50">
            <div className="flex flex-col gap-3 p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] shadow-custom card-japanese">
              <PlatformAccessToken
                showTokenInputs={showTokenInputs}
                setShowTokenInputs={setShowTokenInputs}
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                accessToken={accessToken}
                setAccessToken={setAccessToken}
                messages={messages}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PlatformAccessToken({
  setShowTokenInputs,
  selectedPlatform,
  setSelectedPlatform,
  accessToken,
  setAccessToken,
  messages,
}: PlatformAccessTokenProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
          <IoKeyOutline size={20} />
          {t('form.accessToken', messages)}
        </h3>
        {config.position === 'embed' && (
          <button
            type="button"
            onClick={() => setShowTokenInputs(false)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="bg-[var(--background)]/50 p-3 rounded-md border border-[var(--border-color)]">
        <label className="block text-xs font-medium text-[var(--foreground)] mb-2">
          {t('form.selectPlatform', messages)}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedPlatform('github')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all ${
              selectedPlatform === 'github'
                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <FaGithub className="text-lg" />
            <span className="text-sm">GitHub</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform('gitlab')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all ${
              selectedPlatform === 'gitlab'
                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <FaGitlab className="text-lg" />
            <span className="text-sm">GitLab</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform('bitbucket')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all ${
              selectedPlatform === 'bitbucket'
                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                : 'border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <FaBitbucket className="text-lg" />
            <span className="text-sm">Bitbucket</span>
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="access-token" className="block text-xs font-medium text-[var(--foreground)] mb-2">
          {t('form.personalAccessToken', messages, { platform: selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1) })}
        </label>
        <input
          id="access-token"
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder={t('form.tokenPlaceholder', messages, { platform: selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1) })}
          className="input-japanese block w-full px-3 py-2 rounded-md bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
        />
        <div className="flex items-center mt-2 text-xs text-[var(--muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('form.tokenSecurityNote', messages)}
        </div>
      </div>
    </>
  );
}
