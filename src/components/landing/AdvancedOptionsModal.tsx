import { Messages } from "next-intl";

export default function AdvancedOptionsModal({
  isOpen,
  onClose,
  content,
  messages,
}: {
  isOpen: boolean;
  onClose: () => void;
  content: React.ReactNode;
  messages: Messages;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--card-bg)] z-40 transition-opacity max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom border border-[var(--border-color)] flex flex-col">
        <div className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{messages.form.advancedOptions || "Advanced Options"}</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {content}
        <div className="border-t border-[var(--border-color)] p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-primary)]/90 transition-colors"
          >
            {messages.common?.close || "Close"}
          </button>
        </div>
      </div>
    </>
  )
}
