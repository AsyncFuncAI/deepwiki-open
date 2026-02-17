import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
  suppressErrorRendering: true,
  logLevel: 'error',
  maxTextSize: 100000,
  htmlLabels: true,
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 50,
    rankSpacing: 50,
    padding: 16,
  },
  themeCSS: `
    /* Clean modern diagram styles */
    .node rect, .node circle, .node ellipse, .node polygon, .node path {
      fill: #fafafa;
      stroke: #d4d4d8;
      stroke-width: 1px;
    }
    .edgePath .path {
      stroke: #a1a1aa;
      stroke-width: 1.5px;
    }
    .edgeLabel {
      background-color: transparent;
      color: #3f3f46;
      p { background-color: transparent !important; }
    }
    .label { color: #3f3f46; }
    .cluster rect {
      fill: #fafafa;
      stroke: #d4d4d8;
      stroke-width: 1px;
    }
    .actor { fill: #fafafa; stroke: #d4d4d8; stroke-width: 1px; }
    text.actor { fill: #3f3f46; stroke: none; }
    .messageText { fill: #3f3f46; stroke: none; }
    .messageLine0, .messageLine1 { stroke: #a1a1aa; }
    .noteText { fill: #3f3f46; }

    /* Dark mode */
    [data-theme="dark"] .node rect,
    [data-theme="dark"] .node circle,
    [data-theme="dark"] .node ellipse,
    [data-theme="dark"] .node polygon,
    [data-theme="dark"] .node path { fill: #27272a; stroke: #3f3f46; }
    [data-theme="dark"] .edgePath .path { stroke: #71717a; }
    [data-theme="dark"] .edgeLabel { background-color: transparent; color: #d4d4d8; }
    [data-theme="dark"] .label { color: #d4d4d8; }
    [data-theme="dark"] .cluster rect { fill: #27272a; stroke: #3f3f46; }
    [data-theme="dark"] .flowchart-link { stroke: #71717a; }
    [data-theme="dark"] .actor { fill: #27272a; stroke: #3f3f46; }
    [data-theme="dark"] text.actor { fill: #d4d4d8; stroke: none; }
    [data-theme="dark"] .messageText { fill: #d4d4d8; stroke: none; }
    [data-theme="dark"] .messageLine0, [data-theme="dark"] .messageLine1 { stroke: #71717a; stroke-width: 1.5px; }
    [data-theme="dark"] .noteText { fill: #d4d4d8; }
    [data-theme="dark"] #sequenceNumber { fill: #d4d4d8; }
    [data-theme="dark"] text.sequenceText { fill: #d4d4d8; }
    [data-theme="dark"] text.loopText, [data-theme="dark"] text.loopText tspan { fill: #d4d4d8; }
    [data-theme="dark"] .messageText, [data-theme="dark"] text.sequenceText {
      paint-order: stroke; stroke: #09090b; stroke-width: 2px; stroke-linecap: round; stroke-linejoin: round;
    }

    text[text-anchor][dominant-baseline],
    text[text-anchor][alignment-baseline],
    .nodeLabel, .edgeLabel, .label, text { fill: #52525b !important; }

    [data-theme="dark"] text[text-anchor][dominant-baseline],
    [data-theme="dark"] text[text-anchor][alignment-baseline],
    [data-theme="dark"] .nodeLabel, [data-theme="dark"] .edgeLabel,
    [data-theme="dark"] .label, [data-theme="dark"] text { fill: #d4d4d8 !important; }
  `,
  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  fontSize: 13,
});

interface MermaidProps {
  chart: string;
  className?: string;
  zoomingEnabled?: boolean;
}

const FullScreenModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    setZoom(1);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    function handleOutsideClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm p-6">
      <div
        ref={modalRef}
        className="bg-[var(--background)] rounded-lg shadow-lg w-[80vw] h-[75vh] overflow-hidden flex flex-col border border-[var(--border-color)]"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)]">
          <div className="text-sm text-[var(--muted)]">Diagram</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="text-[var(--foreground)] hover:bg-[var(--accent-secondary)] p-1.5 rounded-md transition-colors"
                aria-label="Zoom out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <span className="text-xs text-[var(--muted)] tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                className="text-[var(--foreground)] hover:bg-[var(--accent-secondary)] p-1.5 rounded-md transition-colors"
                aria-label="Zoom in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <button
                onClick={() => setZoom(1)}
                className="text-[var(--foreground)] hover:bg-[var(--accent-secondary)] p-1.5 rounded-md transition-colors"
                aria-label="Reset zoom"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
              </button>
            </div>
            <div className="w-px h-4 bg-[var(--border-color)]"></div>
            <button
              onClick={onClose}
              className="text-[var(--foreground)] hover:bg-[var(--accent-secondary)] p-1.5 rounded-md transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 p-6 flex items-center justify-center">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Mermaid: React.FC<MermaidProps> = ({ chart, className = '', zoomingEnabled = false }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
  const isDarkModeRef = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (svg && zoomingEnabled && containerRef.current) {
      const initializePanZoom = async () => {
        const svgElement = containerRef.current?.querySelector("svg");
        if (svgElement) {
          // Remove any max-width constraints
          svgElement.style.maxWidth = "none";
          svgElement.style.width = "100%";
          svgElement.style.height = "100%";

          try {
            // Dynamically import svg-pan-zoom only when needed in the browser
            const svgPanZoom = (await import("svg-pan-zoom")).default;

            svgPanZoom(svgElement, {
              zoomEnabled: true,
              controlIconsEnabled: true,
              fit: true,
              center: true,
              minZoom: 0.1,
              maxZoom: 10,
              zoomScaleSensitivity: 0.3,
            });
          } catch (error) {
            console.error("Failed to load svg-pan-zoom:", error);
          }
        }
      };

      // Wait for the SVG to be rendered
      setTimeout(() => {
        void initializePanZoom();
      }, 100);
    }
  }, [svg, zoomingEnabled]);

  useEffect(() => {
    if (!chart) return;

    let isMounted = true;

    const renderChart = async () => {
      if (!isMounted) return;

      try {
        setError(null);
        setSvg('');

        // Preprocess: fix common LLM syntax issues
        let preprocessed = chart
          // Quote node labels containing special characters like () or /
          // e.g. A[Data Plane (Proxy)] -> A["Data Plane (Proxy)"]
          // e.g. A[/etc/hosts] -> A["/etc/hosts"]
          .replace(
            /(\[)([^\]"]*[()\/][^\]"]*)(\])/g,
            (_match, open, label, close) => `${open}"${label}"${close}`
          )
          // Same for diamond nodes: B{Version Control (Git)} -> B{"Version Control (Git)"}
          .replace(
            /(\{)([^}"]*[()][^}"]*)(\})/g,
            (_match, open, label, close) => `${open}"${label}"${close}`
          )
          // Strip parentheses from edge labels: -->|DNS Lookup (Custom)| becomes -->|DNS Lookup Custom|
          // Mermaid's parser cannot handle () inside pipe-delimited edge labels
          .replace(
            /(\|)([^|]*?)(\|)/g,
            (_match, open, label, close) => `${open}${label.replace(/[()]/g, '')}${close}`
          )
          // Fix case-sensitive keywords: SubGraph -> subgraph, End -> end
          .replace(/\bSubGraph\b/g, 'subgraph')
          .replace(/\bEnd\b/g, 'end');

        // Fix single-dash " -> " to " --> " in flowcharts (not sequence diagrams)
        if (/^\s*(graph|flowchart)\s/im.test(preprocessed)) {
          preprocessed = preprocessed.replace(/ -> (?!>)/g, ' --> ');
        }

        // Strip activate/deactivate from sequence diagrams — LLMs frequently
        // generate mismatched pairs that cause "inactivate an inactive participant"
        if (/sequenceDiagram/i.test(preprocessed)) {
          preprocessed = preprocessed
            .split('\n')
            .filter(line => !/^\s*(de)?activate\b/i.test(line))
            // Remove inline activation markers: ->>+ becomes ->>, -->>- becomes -->>
            .map(line => line.replace(/(--?>>?)\+/g, '$1').replace(/(--?>>?)-/g, '$1'))
            .join('\n');
        }

        const renderId = `${idRef.current}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(renderId, preprocessed);

        if (!isMounted) return;

        let processedSvg = renderedSvg;
        if (isDarkModeRef.current) {
          processedSvg = processedSvg.replace('<svg ', '<svg data-theme="dark" ');
        }

        setSvg(processedSvg);

        setTimeout(() => {
          mermaid.contentLoaded();
        }, 50);
      } catch (err) {
        console.error('Mermaid rendering error:', err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        if (isMounted) {
          setError(`Failed to render diagram: ${errorMessage}`);

          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `
              <div class="text-red-500 dark:text-red-400 text-xs mb-1">Syntax error in diagram</div>
              <pre class="text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">${chart}</pre>
            `;
          }
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleDiagramClick = () => {
    if (!error && svg) {
      setIsFullscreen(true);
    }
  };

  if (error) {
    return (
      <div className={`border border-[var(--highlight)]/30 rounded-md p-4 bg-[var(--highlight)]/5 ${className}`}>
        <div className="flex items-center mb-3">
          <div className="text-[var(--highlight)] text-xs font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Diagram rendering error
          </div>
        </div>
        <div ref={mermaidRef} className="text-xs overflow-auto"></div>
        <div className="mt-3 text-xs text-[var(--muted)]">
          The diagram contains a syntax error and cannot be rendered.
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`flex justify-center items-center p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[var(--accent-primary)]/70 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-150"></div>
          <span className="text-[var(--muted)] text-xs ml-2">Rendering diagram...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`w-full max-w-full ${zoomingEnabled ? "h-[600px] p-4" : ""}`}
      >
        <div
          className={`relative group ${zoomingEnabled ? "h-full rounded-lg border-2 border-black" : ""}`}
        >
          <div
            className={`flex justify-center overflow-auto text-center my-2 cursor-pointer hover:shadow-md transition-shadow duration-200 rounded-md ${className} ${zoomingEnabled ? "h-full" : ""}`}
            dangerouslySetInnerHTML={{ __html: svg }}
            onClick={zoomingEnabled ? undefined : handleDiagramClick}
            title={zoomingEnabled ? undefined : "Click to view fullscreen"}
          />

          {!zoomingEnabled && (
            <div className="absolute top-2 right-2 bg-gray-700/70 dark:bg-gray-900/70 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-xs shadow-md pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>Click to zoom</span>
            </div>
          )}
        </div>
      </div>

      {!zoomingEnabled && (
        <FullScreenModal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
        >
          <div
            className="w-full"
            dangerouslySetInnerHTML={{
              __html: svg
                .replace(/max-width:\s*[\d.]+px/g, 'max-width: 100%')
            }}
          />
        </FullScreenModal>
      )}
    </>
  );
};

export default Mermaid;