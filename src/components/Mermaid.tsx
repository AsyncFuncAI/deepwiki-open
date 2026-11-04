import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with defaults
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
  suppressErrorRendering: true,
  logLevel: 'error',
  maxTextSize: 100000, // Increase text size limit
  themeCSS: `
    /* General styles for all diagrams */
    .node rect, .node circle, .node ellipse, .node polygon, .node path {
      fill: #f4f4f4;
      stroke: #999;
      stroke-width: 1px;
    }
    .edgePath .path {
      stroke: #666;
      stroke-width: 1.5px;
    }
    .edgeLabel {
      background-color: transparent;
      color: #fff;
    }
    .label {
      color: #fff;
    }
    .cluster rect {
      fill: #f4f4f4;
      stroke: #999;
      stroke-width: 1px;
    }

    /* Sequence diagram specific styles */
    .actor {
      fill: #f4f4f4;
      stroke: #999;
      stroke-width: 1px;
    }
    text.actor {
      fill: #fff;
      stroke: none;
    }
    .messageText {
      fill: #fff;
      stroke: none;
    }
    .messageLine0, .messageLine1 {
      stroke: #666;
    }
    .noteText {
      fill: #fff;
    }

    /* Dark mode overrides - will be applied with data-theme="dark" */
    [data-theme="dark"] .node rect,
    [data-theme="dark"] .node circle,
    [data-theme="dark"] .node ellipse,
    [data-theme="dark"] .node polygon,
    [data-theme="dark"] .node path {
      fill: #2d3748;
      stroke: #4a5568;
    }
    [data-theme="dark"] .edgePath .path {
      stroke: #a0aec0;
    }
    [data-theme="dark"] .edgeLabel {
      background-color: #1a202c;
      color: #e2e8f0;
    }
    [data-theme="dark"] .label {
      color: #e2e8f0;
    }
    [data-theme="dark"] .cluster rect {
      fill: #2d3748;
      stroke: #4a5568;
    }
    [data-theme="dark"] .flowchart-link {
      stroke: #a0aec0;
    }

    /* Dark mode sequence diagram overrides */
    [data-theme="dark"] .actor {
      fill: #2d3748;
      stroke: #4a5568;
    }
    [data-theme="dark"] text.actor {
      fill: #e2e8f0;
      stroke: none;
    }
    [data-theme="dark"] .messageText {
      fill: #ffffff;
      stroke: none;
      font-weight: 500;
    }
    [data-theme="dark"] .messageLine0, [data-theme="dark"] .messageLine1 {
      stroke: #a0aec0;
      stroke-width: 1.5px;
    }
    [data-theme="dark"] .noteText {
      fill: #e2e8f0;
    }
    /* Additional styles for sequence diagram text */
    [data-theme="dark"] #sequenceNumber {
      fill: #ffffff;
    }
    [data-theme="dark"] text.sequenceText {
      fill: #ffffff;
      font-weight: 500;
    }
    [data-theme="dark"] text.loopText, [data-theme="dark"] text.loopText tspan {
      fill: #ffffff;
    }
    /* Add a subtle background to message text for better readability */
    [data-theme="dark"] .messageText, [data-theme="dark"] text.sequenceText {
      paint-order: stroke;
      stroke: #1a202c;
      stroke-width: 2px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Force all text elements to be white */
    text[text-anchor][dominant-baseline],
    text[text-anchor][alignment-baseline] {
      fill: #fff !important;
    }
  `,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
});

interface MermaidProps {
  chart: string;
  className?: string;
  onMermaidError?: (errorMessage: string, originalChart: string) => void;
}

// Full screen modal component for the diagram
const FullScreenModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Reset zoom when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl max-h-[90vh] w-full overflow-hidden flex flex-col"
      >
        {/* Modal header with controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-700 dark:text-gray-300">Diagram View</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                aria-label="Zoom out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                aria-label="Zoom in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <button
                onClick={() => setZoom(1)}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                aria-label="Reset zoom"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal content with zoom */}
        <div className="overflow-auto p-4 flex-1 flex items-center justify-center">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Mermaid: React.FC<MermaidProps> = ({ chart, className = '', onMermaidError }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
  const isDarkModeRef = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Track if we've already attempted to fix this chart
  const chartRef = useRef(chart);

  // Reset retry attempt state when chart content changes
  useEffect(() => {
    if (chartRef.current !== chart) {
      setRetryAttempted(false);
      chartRef.current = chart;
    }
  }, [chart]);

  useEffect(() => {
    if (!chart) return;

    let isMounted = true;

    const renderChart = async () => {
      if (!isMounted) return;

      try {
        setError(null);
        setSvg('');

        const processedChart = preprocessMermaidChart(chart);

        const { svg: renderedSvg } = await mermaid.render(idRef.current, processedChart);

        if (!isMounted) return;

        let processedSvg = renderedSvg;
        if (isDarkModeRef.current) {
          processedSvg = processedSvg.replace('<svg ', '<svg data-theme="dark" ');
        }

        setSvg(processedSvg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        // Only attempt to fix once per chart (max 1 attempt)
        if (isMounted && !retryAttempted && onMermaidError) {
          console.log('Attempting to auto-fix Mermaid diagram via API (one-time attempt)...');
          setRetryAttempted(true);
          onMermaidError(errorMessage, chart);
          return;
        }

        if (isMounted) {
          try {
            const fallbackChart = createEmergencyFallbackChart(chart);
            console.log('Attempting emergency fallback rendering with:', fallbackChart);

            const { svg: fallbackSvg } = await mermaid.render(`${idRef.current}-fallback`, fallbackChart);

            if (isMounted) {
              let processedSvg = fallbackSvg;
              if (isDarkModeRef.current) {
                processedSvg = processedSvg.replace('<svg ', '<svg data-theme="dark" ');
              }

              setSvg(processedSvg);
              setError('Diagram had syntax errors and was simplified for display');
            }
          } catch (fallbackErr) {
            console.error('Fallback rendering also failed:', fallbackErr);

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
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, onMermaidError, retryAttempted]);

  const handleDiagramClick = () => {
    if (!error && svg) {
      setIsFullscreen(true);
    }
  };

  if (error) {
    return (
      <div className={`border border-red-300 dark:border-red-800 rounded-md p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-red-500 dark:text-red-400 text-xs font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Diagram rendering error
          </div>
          {onMermaidError && !retryAttempted && (
            <button
              onClick={() => {
                if (onMermaidError) {
                  setRetryAttempted(true);
                  onMermaidError("Manual retry requested", chart);
                }
              }}
              className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/30"
            >
              Try to fix
            </button>
          )}
        </div>
        <div ref={mermaidRef} className="text-xs overflow-auto"></div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {retryAttempted ?
            "The diagram couldn't be fixed automatically. Please check the syntax." :
            "The diagram contains syntax errors. You can try to fix it or view the simplified version."}
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`flex justify-center items-center p-4 ${className}`}>
        <div className="animate-pulse text-gray-400 dark:text-gray-600 text-xs">Rendering diagram...</div>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        <div
          className={`flex justify-center overflow-auto text-center my-2 cursor-pointer hover:shadow-md transition-shadow duration-200 rounded-md ${className}`}
          dangerouslySetInnerHTML={{ __html: svg }}
          onClick={handleDiagramClick}
          title="Click to view fullscreen"
        />

        <div className="absolute top-2 right-2 bg-gray-700/70 dark:bg-gray-900/70 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-xs shadow-md pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <span>Click to zoom</span>
        </div>
      </div>

      <FullScreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      >
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </FullScreenModal>
    </>
  );
};

const preprocessMermaidChart = (chartText: string): string => {
    // Remove any mermaid version text that might be causing issues
    let processedChart = chartText.replace(/mermaid version [0-9.]+/g, '');

    // First, check if the chart has a valid type declaration at the beginning
    const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'gantt', 'pie', 'er'];
    const firstLine = processedChart.trim().split('\n')[0].trim();
    const hasValidType = validTypes.some(type => firstLine.startsWith(type));

    if (!hasValidType) {
      // If no valid type is found, default to graph TD
      console.warn('No valid diagram type found, defaulting to graph TD');
      processedChart = `graph TD\n${processedChart}`;
    }

    // Fix common syntax errors
    return processedChart
      // Fix labels in links that are missing quotes
      .replace(/\|([^|"]+)\|>/g, '|"$1"|>')
      .replace(/>\|([^|"]+)\|>/g, '>|"$1"|>')
      .replace(/>\|([^|"]+)\|/g, '>|"$1"|')
      .replace(/-->\|([^|"]+)\|/g, '-->|"$1"|')
      .replace(/-->\|([^|"]+)\|>/g, '-->|"$1"|>')

      // Fix missing quotes in node labels
      .replace(/\[([^\]"]+)\]/g, (match, p1) => {
        // Only add quotes if they're not already there
        if (p1.includes('"')) return match;
        return `["${p1}"]`;
      })

      // Fix common syntax errors in sequence diagrams
      .replace(/([A-Za-z0-9_-]+)(-+>|-->>|-->)([A-Za-z0-9_-]+):/g, '$1$2$3: ')

      // Fix missing spaces after colons in notes
      .replace(/note (left|right|over) ([^:]+):([^\s])/g, 'note $1 $2: $3')

      // Fix arrows with incorrect syntax
      .replace(/([A-Za-z0-9_-]+)\s*--([A-Za-z0-9_-]+)/g, '$1-->$2')

      // Remove any invalid characters that might cause parsing issues
      .replace(/[\u2018\u2019\u201C\u201D]/g, '"'); // Replace smart quotes with straight quotes
  };

const createEmergencyFallbackChart = (originalChart: string): string => {
  // Try to determine the chart type
  const firstLine = originalChart.trim().split('\n')[0].trim();
  const isSequenceDiagram = firstLine.includes('sequenceDiagram');
  const isClassDiagram = firstLine.includes('classDiagram');

  if (isSequenceDiagram) {
    // Create a simple sequence diagram fallback
    return `sequenceDiagram
    participant A as System A
    participant B as System B
    Note over A,B: Diagram had syntax errors
    A->>B: Request
    B-->>A: Response`;
  }

  if (isClassDiagram) {
    // Create a simple class diagram fallback
    return `classDiagram
    class Component {
      +render()
    }
    class Error {
      +message: string
    }
    Component <|-- Error
    note for Error "Diagram had syntax errors"`;
  }

  // For flowcharts and other diagrams, extract nodes if possible
  const nodeRegex = /([A-Za-z0-9_]+)(?:\[["']?(.*?)["']?\])?/g;
  const nodes = new Set<string>();
  let match;

  while ((match = nodeRegex.exec(originalChart)) !== null) {
    if (match[1] && !match[1].match(/^(graph|flowchart|subgraph|end|style|classDef|class|click|linkStyle|direction)$/)) {
      nodes.add(match[1]);
    }
  }

  const nodesList = Array.from(nodes).slice(0, 10);
  if (nodesList.length === 0) {
    // Create a generic error diagram
    return `graph TD
    A["Error: Could not render diagram"]
    B["Please check syntax"]
    A-->B
    style A fill:#f9d0c4,stroke:#f44336
    style B fill:#c4f9d0,stroke:#4caf50`;
  }

  // Create a simplified flowchart with the extracted nodes
  let fallbackChart = 'graph TD\n';

  nodesList.forEach(node => {
    fallbackChart += `${node}["${node}"]\n`;
  });

  for (let i = 0; i < nodesList.length - 1; i++) {
    fallbackChart += `${nodesList[i]}-->${nodesList[i + 1]}\n`;
  }

  // Add a note about the error
  fallbackChart += `note["Diagram had syntax errors and was simplified"]\n`;
  fallbackChart += `style note fill:#fff8e1,stroke:#ffc107\n`;

  return fallbackChart;
};

export default Mermaid;