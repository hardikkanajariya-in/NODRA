// NODRA Dev Terminal & Interactive Knowledge Graph Engine
// Zero-dependency, high performance, viewport-contained

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetXRatio: number;
  targetYRatio: number;
  radius: number;
  color: string;
  category: 'core' | 'storage' | 'feature' | 'editor';
  desc: string;
  connections: string[];
}

// Initial Graph Nodes configured with proportional anchors spanning the FULL height and width
const NODE_DEFINITIONS: Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy'>[] = [
  // Center Core Hub
  {
    id: 'nodra',
    label: 'NODRA Core',
    targetXRatio: 0.50,
    targetYRatio: 0.46,
    radius: 26,
    color: '#38bdf8',
    category: 'core',
    desc: 'Central block notebook engine and graph router',
    connections: ['journal', 'pages', 'editor', 'database', 'graph']
  },
  // Top-Left: Journals
  {
    id: 'journal',
    label: '[[Daily Journals]]',
    targetXRatio: 0.22,
    targetYRatio: 0.16,
    radius: 20,
    color: '#10b981',
    category: 'feature',
    desc: 'Auto-created journal pages at /journal/YYYY-MM-DD',
    connections: ['nodra', 'editor', 'pages']
  },
  // Top-Right: Wiki Pages
  {
    id: 'pages',
    label: '[[Wiki Pages]]',
    targetXRatio: 0.78,
    targetYRatio: 0.18,
    radius: 20,
    color: '#a78bfa',
    category: 'feature',
    desc: 'Interconnected knowledge pages with [[bidirectional]] links',
    connections: ['nodra', 'graph', 'properties']
  },
  // Mid-Left: Nested Bullets
  {
    id: 'editor',
    label: 'Nested Bullets',
    targetXRatio: 0.18,
    targetYRatio: 0.46,
    radius: 19,
    color: '#f59e0b',
    category: 'editor',
    desc: 'Tiptap-based outliner with Tab/Shift+Tab nesting & autosave',
    connections: ['nodra', 'logseq', 'blocks']
  },
  // Lower-Left: Logseq Bridge
  {
    id: 'logseq',
    label: 'Logseq Bridge',
    targetXRatio: 0.18,
    targetYRatio: 0.74,
    radius: 18,
    color: '#ec4899',
    category: 'editor',
    desc: 'Direct paste from Logseq with local filesystem assets access',
    connections: ['editor', 'blocks']
  },
  // Bottom-Left Center: Block References
  {
    id: 'blocks',
    label: '((Block Refs))',
    targetXRatio: 0.36,
    targetYRatio: 0.84,
    radius: 17,
    color: '#38bdf8',
    category: 'editor',
    desc: 'Granular block-level UUID references and embed placeholders',
    connections: ['editor', 'pages', 'database']
  },
  // Mid-Right: Properties
  {
    id: 'properties',
    label: 'key:: value',
    targetXRatio: 0.82,
    targetYRatio: 0.46,
    radius: 17,
    color: '#fb923c',
    category: 'feature',
    desc: 'Logseq-style structured metadata and attributes',
    connections: ['pages', 'graph']
  },
  // Lower-Right: Page Graph
  {
    id: 'graph',
    label: 'Page Graph',
    targetXRatio: 0.82,
    targetYRatio: 0.78,
    radius: 22,
    color: '#06b6d4',
    category: 'core',
    desc: 'Interactive 2D knowledge graph visualization with search & zoom',
    connections: ['nodra', 'pages', 'journal', 'properties']
  },
  // Bottom Center: PostgreSQL + Drizzle
  {
    id: 'database',
    label: 'PostgreSQL + Drizzle',
    targetXRatio: 0.54,
    targetYRatio: 0.85,
    radius: 20,
    color: '#3b82f6',
    category: 'storage',
    desc: 'Neon Serverless PostgreSQL managed via Drizzle ORM schema',
    connections: ['nodra', 'r2', 'blocks']
  },
  // Lower Right-Center: Cloudflare R2
  {
    id: 'r2',
    label: 'Cloudflare R2',
    targetXRatio: 0.66,
    targetYRatio: 0.64,
    radius: 18,
    color: '#f97316',
    category: 'storage',
    desc: 'S3-compatible persistent object storage for pasted images & media',
    connections: ['database', 'nodra']
  }
];

class TerminalApp {
  private terminalOutput: HTMLElement;
  private commandInput: HTMLInputElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: GraphNode[] = [];
  private hoveredNode: GraphNode | null = null;
  private draggedNode: GraphNode | null = null;
  private isDragging = false;
  private animId: number = 0;
  private history: string[] = [];
  private historyIndex: number = -1;
  private lastWidth: number = 0;
  private lastHeight: number = 0;

  constructor() {
    this.terminalOutput = document.getElementById('terminal-output') as HTMLElement;
    this.commandInput = document.getElementById('terminal-input') as HTMLInputElement;
    this.canvas = document.getElementById('graph-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas ? (this.canvas.getContext('2d') as CanvasRenderingContext2D) : ({} as any);

    this.initNodes();
    this.initEventListeners();
    this.initCanvas();
    this.initBlockEditor();
    this.initCopyButtons();
    this.initUptimeCounter();

    // Initial greeting in terminal
    this.printInitialBanner();
  }

  private initNodes(): void {
    this.nodes = NODE_DEFINITIONS.map((def) => ({
      ...def,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    }));
  }

  private initEventListeners(): void {
    // Terminal input handling
    if (this.commandInput) {
      this.commandInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const cmd = this.commandInput.value.trim();
          if (cmd) {
            this.history.push(cmd);
            this.historyIndex = this.history.length;
            this.executeCommand(cmd);
            this.commandInput.value = '';
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.commandInput.value = this.history[this.historyIndex];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.commandInput.value = this.history[this.historyIndex];
          } else {
            this.historyIndex = this.history.length;
            this.commandInput.value = '';
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.handleAutocomplete();
        } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
          e.preventDefault();
          this.clearTerminal();
        }
      });
    }

    // Quick command buttons
    document.querySelectorAll('[data-command]').forEach((el) => {
      el.addEventListener('click', () => {
        const cmd = el.getAttribute('data-command');
        if (cmd) {
          this.executeCommand(cmd);
          if (this.commandInput) this.commandInput.focus();
        }
      });
    });

    // Reset graph layout button
    const resetGraphBtn = document.getElementById('btn-reset-graph');
    if (resetGraphBtn) {
      resetGraphBtn.addEventListener('click', () => {
        this.resetGraphLayout();
        this.printLine(`<span class="term-cyan">Knowledge graph layout reset across full viewport height.</span>`);
      });
    }

    // Stage Tab switching
    document.querySelectorAll('.stage-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-view');
        if (targetView) this.switchView(targetView);
      });
    });

    // Mobile / Compact screen pane toggles
    document.querySelectorAll('.mobile-pane-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-pane');
        const workspace = document.querySelector('.terminal-workspace');
        document.querySelectorAll('.mobile-pane-toggle').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (workspace) {
          workspace.classList.remove('show-terminal-only', 'show-stage-only');
          if (target === 'terminal') workspace.classList.add('show-terminal-only');
          if (target === 'stage') {
            workspace.classList.add('show-stage-only');
            setTimeout(() => this.resizeCanvas(), 50);
          }
        }
      });
    });

    // Global keyboard shortcut
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.commandInput?.focus();
      }
    });
  }

  public switchView(viewName: string): void {
    document.querySelectorAll('.stage-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    document.querySelectorAll('.stage-view-panel').forEach((panel) => {
      const isTarget = panel.getAttribute('data-view-id') === viewName;
      panel.classList.toggle('active', isTarget);
      if (isTarget && viewName === 'graph') {
        setTimeout(() => {
          this.resizeCanvas();
        }, 30);
      }
    });

    // On mobile, ensure stage is visible when switched
    const workspace = document.querySelector('.terminal-workspace');
    if (workspace && window.innerWidth <= 860) {
      workspace.classList.remove('show-terminal-only');
      workspace.classList.add('show-stage-only');
      document.querySelectorAll('.mobile-pane-toggle').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-pane') === 'stage');
      });
    }
  }

  private handleAutocomplete(): void {
    const input = this.commandInput.value.toLowerCase().trim();
    const commands = ['help', 'features', 'graph', 'editor', 'selfhost', 'architecture', 'brand', 'clear', 'status', 'github'];
    const matched = commands.filter((c) => c.startsWith(input));
    if (matched.length === 1) {
      this.commandInput.value = matched[0];
    } else if (matched.length > 1) {
      this.printLine(`<span class="term-muted">Suggestions: ${matched.join(', ')}</span>`);
    }
  }

  public executeCommand(rawCmd: string): void {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Echo command
    this.printLine(`<div class="term-echo"><span class="term-prompt">guest@nodra:~$</span> <span class="term-cmd">${this.escapeHtml(cmd)}</span></div>`);

    const parts = cmd.toLowerCase().split(' ');
    const mainCmd = parts[0];

    switch (mainCmd) {
      case 'help':
      case '?':
      case '--help':
      case '-h':
        this.printLine(`
<div class="term-box">
  <div class="term-box-title">NODRA TERMINAL COMMAND REGISTRY</div>
  <div class="term-grid">
    <div><span class="cmd-highlight" data-command="features">features</span></div><div>List core capabilities and block mechanics</div>
    <div><span class="cmd-highlight" data-command="graph">graph</span></div><div>Launch interactive full-height knowledge graph</div>
    <div><span class="cmd-highlight" data-command="editor">editor</span></div><div>Open interactive Logseq nested block outliner</div>
    <div><span class="cmd-highlight" data-command="selfhost">selfhost</span></div><div>View self-hosting requirements & deployment runbook</div>
    <div><span class="cmd-highlight" data-command="arch">arch</span></div><div>Inspect PostgreSQL + Next.js + R2 architecture</div>
    <div><span class="cmd-highlight" data-command="brand">brand</span></div><div>Inspect NODRA brand identity and visual assets</div>
    <div><span class="cmd-highlight" data-command="status">status</span></div><div>Display system telemetry, database & memory health</div>
    <div><span class="cmd-highlight" data-command="github">github</span></div><div>Navigate directly to official repository</div>
    <div><span class="cmd-highlight" data-command="clear">clear</span></div><div>Wipe terminal screen buffer [Ctrl+L]</div>
  </div>
</div>`);
        break;

      case 'features':
      case 'feat':
        this.printLine(`
<div class="term-box">
  <div class="term-cyan-bold">CORE CAPABILITIES // NODRA SPEC</div>
  <ul class="term-list">
    <li><span class="term-emerald">✦ Single-User Vault:</span> Password-protected via env variable; zero public signups, total privacy.</li>
    <li><span class="term-emerald">✦ Daily Journals:</span> Automatic routing at <code>/journal/YYYY-MM-DD</code> with timeline navigation.</li>
    <li><span class="term-emerald">✦ Wiki Pages & Graph:</span> <code>[[bidirectional links]]</code> dynamically compile into a live force graph.</li>
    <li><span class="term-emerald">✦ Logseq Markdown Paste:</span> Preserves nested hierarchy, <code>#tags</code>, and <code>key:: value</code> pairs.</li>
    <li><span class="term-emerald">✦ Local Assets Bridge:</span> Direct Chromium filesystem link to desktop Logseq asset folders.</li>
    <li><span class="term-emerald">✦ Block Granularity:</span> Deep block-level addresses <code>((uuid))</code> and transclusions.</li>
    <li><span class="term-emerald">✦ Media Storage:</span> Cloudflare R2 bucket integration for image paste and uploads.</li>
    <li><span class="term-emerald">✦ Isolated Graphs:</span> Create and switch between distinct isolated personal workspaces.</li>
  </ul>
</div>`);
        this.switchView('editor');
        break;

      case 'graph':
        this.printLine(`<span class="term-cyan">Switched visual viewport to Knowledge Graph Simulator.</span> Full canvas height and physics enabled.`);
        this.switchView('graph');
        this.resetGraphLayout();
        break;

      case 'editor':
      case 'blocks':
        this.printLine(`<span class="term-cyan">Switched visual viewport to Live Nested Block Editor.</span> Click bullets to expand/collapse.`);
        this.switchView('editor');
        break;

      case 'selfhost':
      case 'install':
      case 'deploy':
        this.printLine(`
<div class="term-box">
  <div class="term-box-title">SELF-HOSTING RUNBOOK (Zero-Bloat Deployment)</div>
  <pre class="term-code-block"><code>git clone https://github.com/hardikkanajariya-in/NODRA.git
cd NODRA
pnpm install
cp .env.example .env.local
pnpm dev</code></pre>
  <div class="term-muted">Requirements: Node.js 20+, pnpm 10+, PostgreSQL (Neon or self-hosted), Cloudflare R2 (optional).</div>
</div>`);
        this.switchView('selfhost');
        break;

      case 'arch':
      case 'architecture':
        this.printLine(`<span class="term-cyan">Switched viewport to Full-Stack Architecture Blueprint.</span>`);
        this.switchView('architecture');
        break;

      case 'brand':
      case 'logo':
        this.printLine(`<span class="term-cyan">Switched viewport to NODRA Brand Spec & Identity.</span>`);
        this.switchView('brand');
        break;

      case 'status':
        const uptime = Math.floor(performance.now() / 1000);
        this.printLine(`
<div class="term-box">
  <div><span class="term-muted">NODE:</span> <span class="term-emerald">v20.18.0 (LTS)</span></div>
  <div><span class="term-muted">FRAMEWORK:</span> <span class="term-cyan">Next.js 15 (App Router, Server Components)</span></div>
  <div><span class="term-muted">DATABASE:</span> <span class="term-emerald">Neon PostgreSQL + Drizzle ORM (Synced)</span></div>
  <div><span class="term-muted">OBJECT STORE:</span> <span class="term-yellow">Cloudflare R2 Bucket (Active)</span></div>
  <div><span class="term-muted">SESSION:</span> <span class="term-cyan">Single-User HMAC Encrypted Cookie</span></div>
  <div><span class="term-muted">CLIENT UPTIME:</span> <span>${uptime}s</span></div>
</div>`);
        break;

      case 'github':
      case 'repo':
        this.printLine(`<span class="term-cyan">Opening GitHub repository...</span>`);
        window.open('https://github.com/hardikkanajariya-in/NODRA', '_blank');
        break;

      case 'clear':
        this.clearTerminal();
        return;

      default:
        this.printLine(`
<span class="term-red">Command not recognized: "${this.escapeHtml(cmd)}"</span>.
Type <span class="cmd-highlight" data-command="help">help</span> to view all commands or click the preset pills above.`);
        break;
    }

    this.scrollToBottom();
  }

  private clearTerminal(): void {
    if (this.terminalOutput) {
      this.terminalOutput.innerHTML = '';
      this.printLine(`<span class="term-muted">Terminal cleared. Type <span class="cmd-highlight" data-command="help">help</span> for command list.</span>`);
    }
  }

  private printLine(html: string): void {
    if (!this.terminalOutput) return;
    const div = document.createElement('div');
    div.className = 'term-entry';
    div.innerHTML = html;
    this.terminalOutput.appendChild(div);

    // Bind dynamically created data-command elements
    div.querySelectorAll('[data-command]').forEach((el) => {
      el.addEventListener('click', () => {
        const c = el.getAttribute('data-command');
        if (c) this.executeCommand(c);
      });
    });
  }

  private scrollToBottom(): void {
    if (this.terminalOutput) {
      this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }
  }

  private printInitialBanner(): void {
    const banner = `
<div class="term-banner">
<pre class="term-ascii-logo">
███╗   ██╗ ██████╗ ██████╗ ██████╗  █████╗ 
████╗  ██║██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
██╔██╗ ██║██║   ██║██║  ██║██████╔╝███████║
██║╚██╗██║██║   ██║██║  ██║██╔══██╗██╔══██║
██║ ╚████║╚██████╔╝██████╔╝██║  ██║██║  ██║
╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝</pre>
  <div class="banner-tagline">
    <span class="badge-online">● SYSTEM ONLINE</span>
    <span class="term-text">NODRA v0.1.0 — Self-Hosted Interconnected Block Notebook</span>
  </div>
  <div class="banner-desc">
    Daily journals, wiki-style page graphs, and Logseq nested outliner.
    Designed for private self-hosting on Next.js, PostgreSQL & Cloudflare R2.
  </div>
  <div class="banner-actions">
    <span class="cmd-chip" data-command="features">⚡ features</span>
    <span class="cmd-chip" data-command="graph">🕸 graph</span>
    <span class="cmd-chip" data-command="editor">📝 editor</span>
    <span class="cmd-chip" data-command="selfhost">🚀 selfhost</span>
    <span class="cmd-chip" data-command="arch">📐 architecture</span>
    <span class="cmd-chip" data-command="help">? help</span>
  </div>
</div>`;
    this.printLine(banner);
  }

  // --- Interactive Canvas Knowledge Graph ---
  private initCanvas(): void {
    if (!this.canvas) return;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
    window.addEventListener('mouseup', () => this.handleCanvasMouseUp());
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredNode = null;
    });

    // Touch support for mobile devices
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const fakeMouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY
        } as MouseEvent;
        this.handleCanvasMouseDown(fakeMouseEvent);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const fakeMouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY
        } as MouseEvent;
        this.handleCanvasMouseMove(fakeMouseEvent);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.handleCanvasMouseUp();
    });

    // Defer one frame to ensure container dimensions are final and populated
    setTimeout(() => {
      this.resizeCanvas();
      this.resetGraphLayout();
    }, 100);

    this.startCanvasLoop();
  }

  public resetGraphLayout(): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;

    for (const node of this.nodes) {
      node.x = w * node.targetXRatio;
      node.y = h * node.targetYRatio;
      node.vx = 0;
      node.vy = 0;
    }
    this.draggedNode = null;
    this.isDragging = false;
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // If first layout or dimensions changed, place or scale nodes proportionally
    if (this.lastWidth === 0 || this.lastHeight === 0) {
      for (const node of this.nodes) {
        node.x = w * node.targetXRatio;
        node.y = h * node.targetYRatio;
        node.vx = 0;
        node.vy = 0;
      }
    } else if (Math.abs(w - this.lastWidth) > 5 || Math.abs(h - this.lastHeight) > 5) {
      const scaleX = w / this.lastWidth;
      const scaleY = h / this.lastHeight;
      for (const node of this.nodes) {
        node.x = node.x * scaleX;
        node.y = node.y * scaleY;
      }
    }

    this.lastWidth = w;
    this.lastHeight = h;
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private handleCanvasMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);

    if (this.isDragging && this.draggedNode) {
      this.draggedNode.x = pos.x;
      this.draggedNode.y = pos.y;
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
      return;
    }

    // Hit test
    let found: GraphNode | null = null;
    for (const node of this.nodes) {
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      if (dx * dx + dy * dy <= (node.radius + 10) * (node.radius + 10)) {
        found = node;
        break;
      }
    }

    this.hoveredNode = found;
    this.canvas.style.cursor = found ? 'pointer' : 'default';

    // Update node inspector UI
    const inspector = document.getElementById('graph-inspector');
    if (inspector) {
      if (found) {
        inspector.innerHTML = `
          <div class="inspector-card">
            <div class="inspector-title" style="color: ${found.color}">${found.label}</div>
            <div class="inspector-desc">${found.desc}</div>
            <div class="inspector-meta">Connections: ${found.connections.length} nodes · Category: ${found.category}</div>
          </div>`;
        inspector.classList.add('visible');
      } else {
        inspector.classList.remove('visible');
      }
    }
  }

  private handleCanvasMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    for (const node of this.nodes) {
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      if (dx * dx + dy * dy <= (node.radius + 10) * (node.radius + 10)) {
        this.draggedNode = node;
        this.isDragging = true;
        this.printLine(`<span class="term-cyan">Inspecting node:</span> <span style="color: ${node.color}; font-weight: bold;">${node.label}</span> — ${node.desc}`);
        break;
      }
    }
  }

  private handleCanvasMouseUp(): void {
    this.isDragging = false;
    this.draggedNode = null;
  }

  private startCanvasLoop(): void {
    const loop = () => {
      this.renderCanvas();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  private renderCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;

    this.ctx.clearRect(0, 0, w, h);

    // Subtle background grid lines spanning the FULL height and width
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // 1. Anti-collision repulsion force between all node pairs
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.1;
        const minDist = a.radius + b.radius + 36;
        if (dist < minDist) {
          const overlap = (minDist - dist) / dist;
          const fx = dx * overlap * 0.18;
          const fy = dy * overlap * 0.18;
          if (a !== this.draggedNode) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (b !== this.draggedNode) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }
    }

    // 2. Soft anchor attraction & gentle ambient movement
    const time = performance.now() * 0.001;
    for (const node of this.nodes) {
      if (node !== this.draggedNode) {
        const anchorX = w * node.targetXRatio;
        const anchorY = h * node.targetYRatio;

        // Soft spring toward proportional anchor
        node.vx += (anchorX - node.x) * 0.025;
        node.vy += (anchorY - node.y) * 0.025;

        // Organic subtle floating breath
        const floatX = Math.sin(time * 1.2 + node.targetXRatio * 8) * 0.35;
        const floatY = Math.cos(time * 1.2 + node.targetYRatio * 8) * 0.35;
        node.vx += floatX * 0.05;
        node.vy += floatY * 0.05;

        // Velocity damping
        node.vx *= 0.85;
        node.vy *= 0.85;

        node.x += node.vx;
        node.y += node.vy;

        // Viewport clamping across full height & width
        const padX = node.radius + 30;
        const padY = node.radius + 35;
        if (node.x < padX) { node.x = padX; node.vx = 0; }
        if (node.x > w - padX) { node.x = w - padX; node.vx = 0; }
        if (node.y < padY) { node.y = padY; node.vy = 0; }
        if (node.y > h - padY) { node.y = h - padY; node.vy = 0; }
      }
    }

    // 3. Draw connection lines
    const nodeMap = new Map<string, GraphNode>();
    this.nodes.forEach((n) => nodeMap.set(n.id, n));

    for (const node of this.nodes) {
      for (const targetId of node.connections) {
        const target = nodeMap.get(targetId);
        if (!target) continue;

        const isHighlighted =
          (this.hoveredNode && (this.hoveredNode.id === node.id || this.hoveredNode.id === target.id)) ||
          (this.draggedNode && (this.draggedNode.id === node.id || this.draggedNode.id === target.id));

        this.ctx.beginPath();
        this.ctx.moveTo(node.x, node.y);
        this.ctx.lineTo(target.x, target.y);

        if (isHighlighted) {
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 2.5;
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 8;
        } else {
          this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
          this.ctx.lineWidth = 1;
          this.ctx.shadowBlur = 0;
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    }

    // 4. Draw nodes
    for (const node of this.nodes) {
      const isHovered = this.hoveredNode === node || this.draggedNode === node;

      // Outer glow
      if (isHovered) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + 7, 0, Math.PI * 2);
        this.ctx.fillStyle = `${node.color}33`;
        this.ctx.fill();
      }

      // Base circle
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#0f1422';
      this.ctx.fill();
      this.ctx.strokeStyle = isHovered ? '#ffffff' : node.color;
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.stroke();

      // Inner dot
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, isHovered ? 5.5 : 4, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.fill();

      // Node label
      this.ctx.font = isHovered ? 'bold 12px "JetBrains Mono", monospace' : '11px "JetBrains Mono", monospace';
      this.ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.label, node.x, node.y + node.radius + 15);
    }
  }

  // --- Interactive Nested Block Tree Editor ---
  private initBlockEditor(): void {
    // Bullet collapse/expand toggles
    document.querySelectorAll('.block-bullet-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const block = btn.closest('.block-item');
        if (block) {
          block.classList.toggle('collapsed');
          const isCollapsed = block.classList.contains('collapsed');
          btn.innerHTML = isCollapsed ? '▶' : '▼';
        }
      });
    });

    // Interactive checkbox items
    document.querySelectorAll('.block-checkbox').forEach((box) => {
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        box.classList.toggle('checked');
        const text = box.nextElementSibling;
        if (text) text.classList.toggle('strikethrough');
      });
    });

    // Wiki-links in editor clickable to trigger terminal search
    document.querySelectorAll('.block-wiki-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.textContent?.replace(/[\[\]]/g, '').trim() || '';
        this.executeCommand(`search [[${pageName}]]`);
      });
    });
  }

  // --- Copy Commands ---
  private initCopyButtons(): void {
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const textToCopy = btn.getAttribute('data-copy');
        if (!textToCopy) return;

        try {
          await navigator.clipboard.writeText(textToCopy);
          const originalText = btn.innerHTML;
          btn.innerHTML = `<span style="color:#10b981;">✓ Copied!</span>`;
          setTimeout(() => {
            btn.innerHTML = originalText;
          }, 1800);
          this.printLine(`<span class="term-emerald">✓ Copied to clipboard:</span> <code>${this.escapeHtml(textToCopy)}</code>`);
        } catch (err) {
          this.printLine(`<span class="term-yellow">Clipboard access blocked by browser. Command is:</span> <code>${this.escapeHtml(textToCopy)}</code>`);
        }
      });
    });
  }

  private initUptimeCounter(): void {
    const uptimeEl = document.getElementById('system-uptime');
    if (!uptimeEl) return;
    const start = Date.now();
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      uptimeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Bootstrap once DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    (window as any).terminalApp = new TerminalApp();
  });
} else {
  (window as any).terminalApp = new TerminalApp();
}
