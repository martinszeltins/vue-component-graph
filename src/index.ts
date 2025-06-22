import { promises as fs } from 'fs'
import path from 'path'
import { program } from 'commander'

interface Graph {
    [file: string]: Set<string>
}

// A simple logger to track file and tag processing.
const log = (...args: any[]) => console.debug('[vue-deps]', ...args)

// Recursively find all .vue files under a directory, skipping node_modules.
const findVueFiles = async (root: string): Promise<string[]> => {
    const entries = await fs.readdir(root, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
        const fullPath = path.join(root, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules') continue
            files.push(...await findVueFiles(fullPath))
        } else if (entry.isFile() && entry.name.endsWith('.vue')) {
            files.push(fullPath)
        }
    }
    return files
}

// Extract component tags from file content.
const extractComponents = (content: string): string[] => {
    const tagPattern = /<([A-Za-z][A-Za-z0-9-]*)/g
    const tags = new Set<string>()
    let match: RegExpExecArray | null
    while ((match = tagPattern.exec(content))) {
        const tag = match[1]
        if (tag.includes('-') || /^[A-Z]/.test(tag)) tags.add(tag)
    }
    return [...tags]
}

// Resolve a tag or import name to a .vue file.
const resolveComponentPath = (tag: string, allFiles: string[]): string | null => {
    const kebab = tag.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    const lower = tag.toLowerCase()
    for (const file of allFiles) {
        const name = path.basename(file, '.vue').toLowerCase()
        if (name === kebab || name === lower) return file
    }
    return null
}

// Build dependency graph recursively, including both <tag> usage and imported components.
const buildGraph = async (entry: string, allFiles: string[], graph: Graph): Promise<void> => {
    const abs = path.resolve(entry)
    if (graph[abs]) return
    let content: string
    try {
        content = await fs.readFile(abs, 'utf-8')
    } catch {
        return
    }
    graph[abs] = new Set<string>()

    // 1) Imported components detection (exclude "import type")
    const importPattern = /import\s+(?!type)\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g
    let importMatch: RegExpExecArray | null
    while ((importMatch = importPattern.exec(content))) {
        const rawList = importMatch[1].split(',')
        for (const raw of rawList) {
            const name = raw.replace(/as\s+.*$/, '').trim()
            if (!name) continue
            const resolved = resolveComponentPath(name, allFiles)
            if (resolved) {
                graph[abs].add(resolved)
                await buildGraph(resolved, allFiles, graph)
            }
        }
    }

    // 2) Static <Component> tags
    const tags = extractComponents(content)
    for (const tag of tags) {
        const resolved = resolveComponentPath(tag, allFiles)
        if (resolved) {
            graph[abs].add(resolved)
            await buildGraph(resolved, allFiles, graph)
        }
    }
}

// Print an ASCII tree for an entry file.
const printAscii = (entry: string, graph: Graph): void => {
    console.log(path.basename(entry))
    const walk = (node: string, indent: string): void => {
        const children = Array.from(graph[node] || [])
        children.forEach((child, idx) => {
            const isLast = idx === children.length - 1
            const branch = isLast ? '└── ' : '├── '
            console.log(indent + branch + path.basename(child))
            const nextIndent = indent + (isLast ? '    ' : '│   ')
            walk(child, nextIndent)
        })
    }
    walk(entry, '')
}

// Generate HTML tree view with folding, hiding, and depth-based colors.
const genHTML = (graph: Graph, roots: string[]): string => {
    const renderNode = (node: string): string => {
        const children = Array.from(graph[node] || [])
        const hasChildren = children.length > 0
        return `
            <li>
                <div class="node${hasChildren ? ' parent' : ''}">
                    <span class="toggle"></span>
                    <span class="label">${path.basename(node)}</span>
                    <button class="hide-btn" title="Hide all '${path.basename(node)}'">×</button>
                </div>
                ${hasChildren ? `<ul>${children.map(renderNode).join('')}</ul>` : ''}
            </li>`
    }
    const lists = roots.map(root => `<ul class="tree-root">${renderNode(root)}</ul>`).join('')
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Tree</title>
  <style>
    /* Dark mode with accent colors */
    body {
      background: #0d1117;
      color: #c9d1d9;
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .tree-container {
      padding: 16px;
    }
    .tree-root,
    .tree-root ul {
      list-style: none;
      margin: 0;
      padding: 0;
      position: relative;
      padding-left: 2.5em;
    }
    .tree-root ul::before {
      content: '';
      position: absolute;
      top: 0;
      left: 1.25em;
      border-left: 2px solid #30363d;
      height: 100%;
    }
    .tree-root li {
      margin: 1em 0;
      position: relative;
    }
    .tree-root li::before {
      content: '';
      position: absolute;
      top: 0.9em;
      left: -1.25em;
      border-top: 2px solid #30363d;
      width: 1.25em;
    }
    .tree-root li .node {
      display: inline-flex;
      align-items: center;
      padding: 0.6em 1.2em;
      border: 1px solid #444c56;
      border-radius: 6px;
      cursor: default;
      background: #161b22;
      color: #adbac7;
      transition: background 0.2s;
      position: relative;
    }
    .tree-root li .node.parent:hover {
      background: #21262d;
    }
    .tree-root li .node.parent {
      cursor: pointer;
    }
    .tree-root li .toggle {
      display: inline-block;
      width: 1em;
      height: 1em;
      margin-right: 0.5em;
      border: 1px solid #444c56;
      border-radius: 3px;
      background: #21262d;
      color: #adbac7;
      text-align: center;
      line-height: 1em;
      font-size: 0.8em;
    }
    .tree-root li .hide-btn {
      display: inline-block;
      margin-left: 0.5em;
      padding: 0 0.4em;
      background: #f85149;
      border: none;
      border-radius: 3px;
      color: white;
      font-size: 0.9em;
      cursor: pointer;
      visibility: hidden;
    }
    .tree-root li .node:hover .hide-btn {
      visibility: visible;
    }
    .tree-root li .label {
      white-space: nowrap;
    }
    /* Depth-based shading */
    .tree-root > li .node {
      background: #161b22;
      border-color: #32383f;
    }
    .tree-root ul > li .node {
      background: #1f242a;
      border-color: #3e444c;
    }
    .tree-root ul ul > li .node {
      background: #292e35;
      border-color: #494f58;
    }
    .tree-root ul ul ul > li .node {
      background: #323741;
      border-color: #565c66;
    }
    .tree-root ul ul ul ul > li .node {
      background: #3c424b;
      border-color: #616670;
    }
  </style>
</head>
<body>
  <div class="tree-container">
    ${lists}
  </div>
  <script>
    // Fold/unfold logic
    document.querySelectorAll('.tree-root .parent').forEach(function(node) {
      var toggle = node.querySelector('.toggle');
      if (!toggle) return;
      var childUl = node.nextElementSibling;
      if (!childUl) return;
      toggle.textContent = '-';
      childUl.style.display = 'block';
      node.addEventListener('click', function(e) {
        var shift = e.shiftKey;
        var isHidden = childUl.style.display === 'none';
        var newDisplay = isHidden ? 'block' : 'none';
        toggle.textContent = isHidden ? '+' : '-';
        childUl.style.display = newDisplay;
        if (shift) {
          childUl.querySelectorAll('ul').forEach(function(ul) {
            ul.style.display = newDisplay;
            var parentDiv = ul.previousElementSibling;
            if (parentDiv && parentDiv.classList.contains('node')) {
              var childToggle = parentDiv.querySelector('.toggle');
              if (childToggle) childToggle.textContent = isHidden ? '+' : '-';
            }
          });
        }
      });
    });
    // Hide by name logic
    document.querySelectorAll('.hide-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var labelElem = (btn.parentElement).querySelector('.label');
        if (!labelElem) return;
        var name = labelElem.textContent;
        document.querySelectorAll('.label').forEach(function(l) {
          if (l.textContent === name) {
            var li = l.closest('li');
            if (li) li.style.display = 'none';
          }
        });
      });
    });
  </script>
</body>
</html>`
}

program
    .option('-r, --root <dir>', 'root directory to scan for .vue files', process.cwd())
    .option('-o, --output <type>', 'ascii or html', 'ascii')
    .argument('<targets...>', 'file(s)/dir(s)')
    .action(async (targets: string[], options: { root: string, output: string }) => {
        const scanRoot = path.resolve(options.root)
        const allFiles = await findVueFiles(scanRoot)
        const graph: Graph = {}
        for (const t of targets) await buildGraph(path.resolve(t), allFiles, graph)
        if (options.output === 'html') {
            const roots = targets.map(t => path.resolve(t))
            console.log(genHTML(graph, roots))
        } else {
            for (const t of targets) printAscii(path.resolve(t), graph)
        }
    })
    .parse(process.argv)
