import ThemeToggle from "@/components/theme-toggle";
import { t } from "@/utils/utils";
import { Messages } from "next-intl";
import { FaGithub, FaTwitter } from "react-icons/fa";
import { FaCoffee } from "react-icons/fa";

export default function Footer({ 
  footerText,
  showSocialLinks = true,
}: { 
  footerText: string,
  showSocialLinks?: boolean
}) {
  return (
    <footer className="max-w-6xl mx-auto flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)] shadow-custom">
          <p className="text-[var(--muted)] text-sm font-serif">{footerText}</p>

          <div className="flex items-center gap-6">
            {showSocialLinks && (
              <div className="flex items-center space-x-5">
                <a href="https://github.com/AsyncFuncAI/deepwiki-open" target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                  <FaGithub className="text-xl" />
                </a>
                <a href="https://buymeacoffee.com/sheing" target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                  <FaCoffee className="text-xl" />
                </a>
                <a href="https://x.com/sashimikun_void" target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                  <FaTwitter className="text-xl" />
                </a>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </footer>
  );
}
