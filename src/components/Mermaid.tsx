import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
// We'll use dynamic import for svg-pan-zoom

// Initialize mermaid with defaults - Japanese aesthetic
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
  suppressErrorRendering: false, // Allow errors to be caught and handled gracefully
  logLevel: 'error',
  maxTextSize: 100000, // Increase text size limit
  htmlLabels: true,
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 60,
    rankSpacing: 60,
    padding: 20,
  },
  deterministicIds: true,
  deterministicIDSeed: 'deepwiki-mermaid',
  themeCSS: `
    /* Japanese aesthetic styles for all diagrams */
    .node rect, .node circle, .node ellipse, .node polygon, .node path {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    .edgePath .path {
      stroke: #9b7cb9;
      stroke-width: 1.5px;
    }
    .edgeLabel {
      background-color: transparent;
      color: #333333;
      p {
        background-color: transparent !important;
      }
    }
    .label {
      color: #333333;
    }
    .cluster rect {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }

    /* Sequence diagram specific styles */
    .actor {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    text.actor {
      fill: #333333;
      stroke: none;
    }
    .messageText {
      fill: #333333;
      stroke: none;
    }
    .messageLine0, .messageLine1 {
      stroke: #9b7cb9;
    }
    .noteText {
      fill: #333333;
    }

    /* Dark mode overrides - will be applied with data-theme="dark" */
    [data-theme="dark"] .node rect,
    [data-theme="dark"] .node circle,
    [data-theme="dark"] .node ellipse,
    [data-theme="dark"] .node polygon,
    [data-theme="dark"] .node path {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] .edgePath .path {
      stroke: #9370db;
    }
    [data-theme="dark"] .edgeLabel {
      background-color: transparent;
      color: #f0f0f0;
    }
    [data-theme="dark"] .label {
      color: #f0f0f0;
    }
    [data-theme="dark"] .cluster rect {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] .flowchart-link {
      stroke: #9370db;
    }

    /* Dark mode sequence diagram overrides */
    [data-theme="dark"] .actor {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] text.actor {
      fill: #f0f0f0;
      stroke: none;
    }
    [data-theme="dark"] .messageText {
      fill: #f0f0f0;
      stroke: none;
      font-weight: 500;
    }
    [data-theme="dark"] .messageLine0, [data-theme="dark"] .messageLine1 {
      stroke: #9370db;
      stroke-width: 1.5px;
    }
    [data-theme="dark"] .noteText {
      fill: #f0f0f0;
    }
    /* Additional styles for sequence diagram text */
    [data-theme="dark"] #sequenceNumber {
      fill: #f0f0f0;
    }
    [data-theme="dark"] text.sequenceText {
      fill: #f0f0f0;
      font-weight: 500;
    }
    [data-theme="dark"] text.loopText, [data-theme="dark"] text.loopText tspan {
      fill: #f0f0f0;
    }
    /* Add a subtle background to message text for better readability */
    [data-theme="dark"] .messageText, [data-theme="dark"] text.sequenceText {
      paint-order: stroke;
      stroke: #1a1a1a;
      stroke-width: 2px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Force text elements to be properly colored */
    text[text-anchor][dominant-baseline],
    text[text-anchor][alignment-baseline],
    .nodeLabel,
    .edgeLabel,
    .label,
    text {
      fill: #777 !important;
    }

    [data-theme="dark"] text[text-anchor][dominant-baseline],
    [data-theme="dark"] text[text-anchor][alignment-baseline],
    [data-theme="dark"] .nodeLabel,
    [data-theme="dark"] .edgeLabel,
    [data-theme="dark"] .label,
    [data-theme="dark"] text {
      fill: #f0f0f0 !important;
    }

    /* Add clickable element styles with subtle transitions */
    .clickable {
      transition: all 0.3s ease;
    }
    .clickable:hover {
      transform: scale(1.03);
      cursor: pointer;
    }
    .clickable:hover > * {
      filter: brightness(0.95);
    }
  `,
  fontFamily: 'var(--font-geist-sans), var(--font-serif-jp), sans-serif',
  fontSize: 12,
});

interface MermaidProps {
  chart: string;
  className?: string;
  zoomingEnabled?: boolean;
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
        className="bg-[var(--card-bg)] rounded-lg shadow-custom max-w-5xl max-h-[90vh] w-full overflow-hidden flex flex-col card-japanese"
      >
        {/* Modal header with controls */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="font-medium text-[var(--foreground)] font-serif">図表表示</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
                aria-label="Zoom out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <span className="text-sm text-[var(--muted)]">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
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
                className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
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
              className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
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
        <div className="overflow-auto p-6 flex-1 flex items-center justify-center bg-[var(--background)]/50">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease-out'
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

  // Initialize pan-zoom functionality when SVG is rendered
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

    // Function to fix activation state management issues
    const fixActivationStateIssues = (chartText: string): string => {
      const lines = chartText.split('\n');
      const activatedParticipants = new Set<string>();
      const resultLines: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // More flexible regex patterns for activation detection
        const activateMatch = trimmedLine.match(/^\s*activate\s+([A-Za-z_][A-Za-z0-9_]*)/i);
        if (activateMatch) {
          const participant = activateMatch[1];
          activatedParticipants.add(participant);
          resultLines.push(line);
          continue;
        }
        
        // More flexible regex patterns for deactivation detection  
        const deactivateMatch = trimmedLine.match(/^\s*deactivate\s+([A-Za-z_][A-Za-z0-9_]*)/i);
        if (deactivateMatch) {
          const participant = deactivateMatch[1];
          
          // Only add deactivate if participant was previously activated
          if (activatedParticipants.has(participant)) {
            activatedParticipants.delete(participant);
            resultLines.push(line);
          } else {
            // Skip orphaned deactivate commands
            console.warn(`Skipping orphaned deactivate command for: ${participant}`);
            resultLines.push(`    # Removed orphaned deactivate command for ${participant}`);
          }
          continue;
        }
        
        // Keep all other lines
        resultLines.push(line);
      }
      
      return resultLines.join('\n');
    };

    // Function to clean and validate Mermaid syntax
    const preprocessChart = (chartText: string): string => {
      try {
        // Basic validation: check if it starts with a valid diagram type
        const validDiagramTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'gitgraph', 'erDiagram', 'journey', 'gantt', 'pie', 'quadrantChart', 'requirement', 'mindmap', 'timeline', 'sankey', 'xychart'];
        const trimmedChart = chartText.trim();
        
        const hasValidStart = validDiagramTypes.some(type => 
          trimmedChart.startsWith(type) || 
          trimmedChart.startsWith(`\`\`\`mermaid\n${type}`) ||
          trimmedChart.startsWith(`\`\`\`\n${type}`)
        );

        if (!hasValidStart) {
          throw new Error('Invalid diagram type or missing diagram declaration');
        }

        // Remove code block markers if present
        let cleanChart = chartText.replace(/^```mermaid\s*\n?/, '').replace(/\n?```$/, '');
        
        // Enhanced cleaning for different diagram types
        const isSequenceDiagram = cleanChart.startsWith('sequenceDiagram');
        const isFlowchart = cleanChart.startsWith('flowchart') || cleanChart.startsWith('graph');
        
        if (isSequenceDiagram) {
          // For sequence diagrams, handle participant names and messages differently
          cleanChart = cleanChart.replace(/([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\)/g, (match, funcName) => {
            // Remove parentheses from function calls in sequence diagrams
            return funcName;
          });
          
          // Fix double arrow syntax issues (most critical fix)
          cleanChart = cleanChart
            // Fix double arrows: --> > becomes -->
            .replace(/-->\s*>\s*/g, '--> ')
            // Fix other malformed arrows: -->> becomes ->>
            .replace(/--\s*>>\s*/g, '->> ')
            // Fix spaced arrows: - -> becomes -->
            .replace(/\s*-\s*-\s*>\s*/g, '--> ')
            // Fix broken message syntax: --> >Actor: becomes --> Actor:
            .replace(/-->\s*>([^:]+):/g, '--> $1:')
            // Fix arrow with extra spaces before colon
            .replace(/-->\s+([^:]+)\s*:/g, '--> $1:');
          
          // Clean up participant names - remove quotes and special chars
          cleanChart = cleanChart.replace(/participant\s+([^:\n]+)/g, (match, participant) => {
            const cleanParticipant = participant.replace(/["\(\)]/g, '').trim();
            return `participant ${cleanParticipant}`;
          });
          
          // Clean up message text - handle quotes and special characters  
          cleanChart = cleanChart.replace(/-->\s*([^:]+):\s*(.+)/g, (match, actor, message) => {
            const cleanActor = actor.replace(/[<>"\(\)]/g, '').trim();
            const cleanMessage = message.replace(/"/g, "'").replace(/[<>]/g, '').trim();
            return `--> ${cleanActor}: ${cleanMessage}`;
          });
          
          // Clean up activation/deactivation syntax
          cleanChart = cleanChart.replace(/([A-Za-z_][A-Za-z0-9_]*)\s*\+\+/g, 'activate $1');
          cleanChart = cleanChart.replace(/([A-Za-z_][A-Za-z0-9_]*)\s*--/g, 'deactivate $1');
          
          // Fix malformed deactivate syntax patterns
          cleanChart = cleanChart
            // Fix "deactivate Actor> Other: Message" -> "deactivate Actor" + "Actor --> Other: Message"
            .replace(/deactivate\s+([A-Za-z_][A-Za-z0-9_]*)\s*>\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)/g, 
              (match, actor1, actor2, message) => {
                return `deactivate ${actor1}\n    ${actor1} --> ${actor2}: ${message}`;
              })
            // Fix "deactivate Actor> Other" -> "deactivate Actor" + "Actor --> Other"
            .replace(/deactivate\s+([A-Za-z_][A-Za-z0-9_]*)\s*>\s*([A-Za-z_][A-Za-z0-9_]*)/g, 
              (match, actor1, actor2) => {
                return `deactivate ${actor1}\n    ${actor1} --> ${actor2}: Message`;
              })
            // Fix "activate Actor> Other: Message" -> "activate Actor" + "Actor --> Other: Message"
            .replace(/activate\s+([A-Za-z_][A-Za-z0-9_]*)\s*>\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)/g, 
              (match, actor1, actor2, message) => {
                return `activate ${actor1}\n    ${actor1} --> ${actor2}: ${message}`;
              })
            // Fix "activate Actor> Other" -> "activate Actor" + "Actor --> Other"
            .replace(/activate\s+([A-Za-z_][A-Za-z0-9_]*)\s*>\s*([A-Za-z_][A-Za-z0-9_]*)/g, 
              (match, actor1, actor2) => {
                return `activate ${actor1}\n    ${actor1} --> ${actor2}: Message`;
              });
          
          // Fix activation state management issues
          cleanChart = fixActivationStateIssues(cleanChart);
        } else if (isFlowchart) {
          // Enhanced node label cleaning for flowcharts
          cleanChart = cleanChart.replace(/\[([^\]]*)\]/g, (match, content) => {
            // More aggressive cleaning for node labels
            let escaped = content
              // Remove or replace problematic characters
              .replace(/\\\(/g, '(')  // Remove escaping first
              .replace(/\\\)/g, ')')
              .replace(/\(/g, ' ')   // Replace parentheses with spaces
              .replace(/\)/g, ' ')
              .replace(/\{/g, ' ')   // Replace braces with spaces
              .replace(/\}/g, ' ')
              .replace(/"/g, "'")    // Replace double quotes with single
              .replace(/\s+/g, ' ')  // Normalize whitespace
              .trim();
            
            // If the content is too problematic, use a simplified version
            if (escaped.length > 50 || /[<>\\|]/.test(escaped)) {
              escaped = 'Node';
            }
            
            return `[${escaped}]`;
          });
          
          // Clean up arrow labels and descriptions
          cleanChart = cleanChart.replace(/-->\s*\|([^|]*)\|/g, (match, content) => {
            const escaped = content.replace(/[(){}]/g, '').trim();
            return `--> |${escaped}|`;
          });
          
          // Handle incomplete arrows by ensuring they have targets
          cleanChart = cleanChart.replace(/-->\s*$/gm, '--> End');
          cleanChart = cleanChart.replace(/-->\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/gm, '--> $1[Node]');
        }
        
        // General cleanup for all diagram types
        cleanChart = cleanChart
          // Remove any remaining problematic escape sequences
          .replace(/\\[\(\)]/g, ' ')
          // Fix incomplete lines
          .replace(/\s+$/gm, '')
          // Ensure proper line endings
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');

        return cleanChart;
      } catch (error) {
        console.warn('Chart preprocessing failed:', error);
        return chartText; // Return original if preprocessing fails
      }
    };

    // Generate a fallback diagram for completely invalid syntax
    const generateFallbackDiagram = (): string => {
      return `flowchart TD
    A[Original Diagram] --> B[Syntax Error Detected]
    B --> C[Fallback Display]
    C --> D[Please check diagram syntax]
    
    style A fill:#ffebee
    style B fill:#ffcdd2
    style C fill:#f8bbd9
    style D fill:#e1bee7`;
    };

    // Emergency activation fix - remove ALL activation commands
    const emergencyActivationFix = (chartText: string): string => {
      return chartText
        .replace(/^\s*activate\s+[A-Za-z_][A-Za-z0-9_]*.*$/gm, '')
        .replace(/^\s*deactivate\s+[A-Za-z_][A-Za-z0-9_]*.*$/gm, '')
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines
    };

    // Aggressive preprocessing for very problematic diagrams
    const aggressivePreprocess = (chartText: string): string => {
      let cleanChart = chartText.trim();
      
      // If it's not a recognizable diagram type, try to make it a simple flowchart
      const validStart = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram'].some(type => 
        cleanChart.startsWith(type)
      );
      
      if (!validStart) {
        // Convert to a simple flowchart
        cleanChart = `flowchart TD\n    A[Input] --> B[Processing]\n    B --> C[Output]`;
        return cleanChart;
      }
      
      // Special handling for sequence diagrams
      if (cleanChart.startsWith('sequenceDiagram')) {
        cleanChart = cleanChart
          // Aggressively fix all arrow issues
          .replace(/-->\s*>\s*/g, '--> ')
          .replace(/--\s*>>\s*/g, '->> ')
          .replace(/-->\s*>([^:]+):/g, '--> $1:')
          .replace(/([A-Za-z_][A-Za-z0-9_]*)\s*-->\s*>\s*([A-Za-z_][A-Za-z0-9_]*)/g, '$1 --> $2')
          // Aggressively fix deactivate/activate issues
          .replace(/deactivate\s+([A-Za-z_][A-Za-z0-9_]*)\s*>\s*([A-Za-z_][A-Za-z0-9_]*)/g, 'deactivate $1')
          .replace(/activate\s+([A-Za-z_][A-Za-z0-9_]*)\s*>\s*([A-Za-z_][A-Za-z0-9_]*)/g, 'activate $1')
          // Remove problematic characters
          .replace(/[<>"]/g, '')
          .replace(/\(/g, '')
          .replace(/\)/g, '')
          // Fix message syntax
          .replace(/-->\s*([^:]+):\s*(.+)/g, (match, actor, message) => {
            const cleanActor = actor.replace(/[^\w\s]/g, '').trim();
            const cleanMessage = message.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
            return `--> ${cleanActor}: ${cleanMessage}`;
          })
          // Ensure proper line structure
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && line !== 'sequenceDiagram')
          .join('\n');
        
        // Rebuild as a simple sequence diagram with proper activation state management
        const lines = cleanChart.split('\n');
        const participants = new Set<string>();
        const messages: string[] = [];
        const activatedParticipants = new Set<string>();
        const activations: string[] = [];
        
        lines.forEach(line => {
          // Extract arrow patterns
          const arrowMatch = line.match(/([A-Za-z_][A-Za-z0-9_]*)\s*-->\s*([A-Za-z_][A-Za-z0-9_]*)/);
          if (arrowMatch) {
            participants.add(arrowMatch[1]);
            participants.add(arrowMatch[2]);
            messages.push(`    ${arrowMatch[1]} --> ${arrowMatch[2]}: Message`);
          }
          
          // Extract activation patterns
          const activateMatch = line.match(/activate\s+([A-Za-z_][A-Za-z0-9_]*)/);
          if (activateMatch) {
            const participant = activateMatch[1];
            participants.add(participant);
            activatedParticipants.add(participant);
            activations.push(`    activate ${participant}`);
          }
          
          // Extract deactivation patterns (only if participant was activated)
          const deactivateMatch = line.match(/deactivate\s+([A-Za-z_][A-Za-z0-9_]*)/);
          if (deactivateMatch) {
            const participant = deactivateMatch[1];
            participants.add(participant);
            
            // Only add deactivate if participant was previously activated
            if (activatedParticipants.has(participant)) {
              activatedParticipants.delete(participant);
              activations.push(`    deactivate ${participant}`);
            }
            // Skip orphaned deactivate commands silently in aggressive mode
          }
        });
        
        if (participants.size > 0) {
          const participantLines = Array.from(participants).map(p => `    participant ${p}`);
          const allLines = [...participantLines, ...messages, ...activations];
          cleanChart = `sequenceDiagram\n${allLines.join('\n')}`;
        } else {
          cleanChart = `sequenceDiagram\n    participant A\n    participant B\n    A --> B: Message`;
        }
        
        return cleanChart;
      }
      
      // Very aggressive character replacement for other diagram types
      cleanChart = cleanChart
        .replace(/\\\(/g, ' ')
        .replace(/\\\)/g, ' ')
        .replace(/\(/g, ' ')
        .replace(/\)/g, ' ')
        .replace(/\{/g, ' ')
        .replace(/\}/g, ' ')
        .replace(/\[([^\]]*)\]/g, (match, content) => {
          // Simplify all node labels to basic text
          const simple = content.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
          return `[${simple || 'Node'}]`;
        })
        .replace(/-->\s*[^A-Za-z0-9\[\]]*([A-Za-z0-9\[\]]+)/g, '--> $1')
        .replace(/-->\s*$/gm, '')
        .split('\n')
        .filter(line => line.trim().length > 0)
        .join('\n');
      
      return cleanChart;
    };

    const renderChart = async () => {
      if (!isMounted) return;

      try {
        setError(null);
        setSvg('');

        // First attempt: Normal preprocessing
        let processedChart = preprocessChart(chart);
        
        // Additional safety check for activation issues
        if (processedChart.includes('sequenceDiagram')) {
          processedChart = fixActivationStateIssues(processedChart);
        }
        
        try {
          // Try rendering with normal preprocessing
          const { svg: renderedSvg } = await mermaid.render(idRef.current, processedChart);

          if (!isMounted) return;

          let processedSvg = renderedSvg;
          if (isDarkModeRef.current) {
            processedSvg = processedSvg.replace('<svg ', '<svg data-theme="dark" ');
          }

          setSvg(processedSvg);

          // Call mermaid.contentLoaded to ensure proper initialization
          setTimeout(() => {
            mermaid.contentLoaded();
          }, 50);
          return; // Success!
        } catch (firstErr) {
          console.warn('First preprocessing attempt failed, trying aggressive preprocessing:', firstErr);
          
          // Second attempt: Aggressive preprocessing
          processedChart = aggressivePreprocess(chart);
          
          // Extra aggressive activation fix - remove ALL activation commands if needed
          if (processedChart.includes('sequenceDiagram') && processedChart.includes('deactivate')) {
            processedChart = processedChart
              .replace(/^\s*activate\s+[A-Za-z_][A-Za-z0-9_]*\s*$/gm, '')
              .replace(/^\s*deactivate\s+[A-Za-z_][A-Za-z0-9_]*\s*$/gm, '')
              .replace(/\n\s*\n/g, '\n'); // Remove empty lines
          }
          
          try {
            const { svg: renderedSvg } = await mermaid.render(`${idRef.current}-aggressive`, processedChart);
            
            if (!isMounted) return;

            let processedSvg = renderedSvg;
            if (isDarkModeRef.current) {
              processedSvg = processedSvg.replace('<svg ', '<svg data-theme="dark" ');
            }

            setSvg(processedSvg);
            setError('Diagram had syntax issues. Showing simplified version.');
            
            setTimeout(() => {
              mermaid.contentLoaded();
            }, 50);
            return; // Success with aggressive preprocessing!
          } catch (secondErr) {
            console.warn('Aggressive preprocessing also failed:', secondErr);
            throw firstErr; // Throw the original error
          }
        }
      } catch (err) {
        console.error('All rendering attempts failed:', err);

        // Final fallback: Show a standard error diagram
        try {
          const fallbackChart = generateFallbackDiagram();
          const { svg: fallbackSvg } = await mermaid.render(`${idRef.current}-fallback`, fallbackChart);
          
          if (isMounted) {
            setSvg(fallbackSvg);
            setError('Original diagram had syntax errors. Showing fallback visualization.');
          }
        } catch (fallbackErr) {
          console.error('Even fallback diagram failed:', fallbackErr);
          
          const errorMessage = err instanceof Error ? err.message : String(err);

          // Check if this is an activation-related error and try emergency fix
          if (errorMessage.includes('inactive participant') || errorMessage.includes('inactivate')) {
            try {
              const emergencyChart = emergencyActivationFix(chart);
              const { svg: emergencySvg } = await mermaid.render(`${idRef.current}-emergency`, emergencyChart);
              
              if (isMounted) {
                setSvg(emergencySvg);
                setError('Diagram had activation/deactivation issues. Showing simplified version without activation commands.');
                return;
              }
            } catch (emergencyErr) {
              console.error('Emergency activation fix also failed:', emergencyErr);
            }
          }

          if (isMounted) {
            // More graceful error handling - don't crash the app
            setError(`Failed to render diagram: ${errorMessage}`);

            // Display a user-friendly error message instead of crashing
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `
                <div class="text-red-500 dark:text-red-400 text-xs mb-1">Diagram syntax error</div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">The diagram contains invalid syntax and cannot be rendered.</div>
                <details class="text-xs">
                  <summary class="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">Show diagram source</summary>
                  <pre class="mt-2 overflow-auto p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200">${chart.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </details>
              `;
            }
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

  // Handle error display - if we have SVG (from fallback), show it with warning
  if (error && !svg) {
    return (
      <div className={`border border-[var(--highlight)]/30 rounded-md p-4 bg-[var(--highlight)]/5 ${className}`}>
        <div className="flex items-center mb-3">
          <div className="text-[var(--highlight)] text-xs font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            図表レンダリングエラー
          </div>
        </div>
        <div ref={mermaidRef} className="text-xs overflow-auto"></div>
        <div className="mt-3 text-xs text-[var(--muted)] font-serif">
          図表に構文エラーがあり、レンダリングできません。
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
          <span className="text-[var(--muted)] text-xs ml-2 font-serif">図表を描画中...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Show warning if using fallback or processed diagram */}
      {error && svg && (
        <div className={`mb-3 p-2 rounded-md border ${
          error.includes('simplified') 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
            : error.includes('fallback')
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        }`}>
          <div className={`flex items-center text-xs ${
            error.includes('simplified') 
              ? 'text-blue-800 dark:text-blue-200' 
              : error.includes('fallback')
              ? 'text-yellow-800 dark:text-yellow-200'
              : 'text-orange-800 dark:text-orange-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {error.includes('simplified') ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
            <span className="flex-1">{error}</span>
          </div>
        </div>
      )}
      
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
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </FullScreenModal>
      )}
    </>
  );
};



export default Mermaid;