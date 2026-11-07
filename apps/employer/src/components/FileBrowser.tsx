import { useMemo, useState } from 'react';
import { ChevronRight, File, FileCode2, FileJson, FileSpreadsheet, FileText, Folder, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useFilePreview } from '@/lib/queries';
import { Markdown } from './Markdown';
import { Segmented, Skeleton, cn } from './ui';

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[] | null; // null = file
}

export function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', children: [] };
  for (const raw of paths) {
    const clean = raw.replace(/^\.\//, '');
    if (!clean) continue;
    const isDir = clean.endsWith('/');
    const parts = clean.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');
      node.children ??= [];
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path, children: last && !isDir ? null : [] };
        node.children.push(child);
      }
      node = child;
    });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if ((a.children === null) !== (b.children === null)) return a.children === null ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && sort(n.children));
  };
  sort(root.children ?? []);
  return root.children ?? [];
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['md', 'txt', 'rst'].includes(ext)) return FileText;
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return FileJson;
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return FileSpreadsheet;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return ImageIcon;
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'java', 'rb', 'rs', 'sql', 'sh', 'html', 'css', 'c', 'cpp', 'ipynb'].includes(ext))
    return FileCode2;
  return File;
}

/** Picks a sensible first file to show: a source file over the README (which is rendered separately). */
export function defaultFile(paths: string[]): string | null {
  const files = paths.filter((p) => !p.endsWith('/'));
  const isReadme = (p: string) => /(^|\/)readme(\.[a-z]+)?$/i.test(p);
  return (
    files.find((p) => /^src\//.test(p) && !isReadme(p)) ??
    files.find((p) => !isReadme(p)) ??
    files[0] ??
    null
  );
}

export function FileBrowser({ submissionId, paths }: { submissionId: string; paths: string[] }) {
  const tree = useMemo(() => buildTree(paths), [paths]);
  const fileCount = paths.filter((p) => !p.endsWith('/')).length;
  const [selected, setSelected] = useState<string | null>(() => defaultFile(paths));

  if (fileCount === 0) {
    return <p className="px-4 py-6 text-center text-sm text-slate-500">The zip has no files to preview.</p>;
  }

  return (
    <div className="grid min-h-0 @2xl:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="scrollbar-thin max-h-56 overflow-y-auto border-b border-slate-100 py-1.5 @2xl:max-h-[30rem] @2xl:border-r @2xl:border-b-0">
        <TreeList nodes={tree} depth={0} selected={selected} onSelect={setSelected} defaultOpen={fileCount <= 40} />
      </div>
      <div className="min-w-0">
        {selected ? (
          <FilePreviewPane key={selected} submissionId={submissionId} path={selected} />
        ) : (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Select a file to preview it.</p>
        )}
      </div>
    </div>
  );
}

function TreeList({
  nodes,
  depth,
  selected,
  onSelect,
  defaultOpen,
}: {
  nodes: TreeNode[];
  depth: number;
  selected: string | null;
  onSelect: (p: string) => void;
  defaultOpen: boolean;
}) {
  return (
    <ul role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? 'Files in the submission' : undefined}>
      {nodes.map((n) =>
        n.children ? (
          <FolderItem key={n.path} node={n} depth={depth} selected={selected} onSelect={onSelect} defaultOpen={defaultOpen || depth === 0} />
        ) : (
          <li key={n.path} role="treeitem" aria-selected={selected === n.path}>
            <button
              type="button"
              onClick={() => onSelect(n.path)}
              className={cn(
                'flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[12.5px] transition-colors',
                selected === n.path ? 'bg-indigo-50 font-semibold text-indigo-800' : 'text-slate-700 hover:bg-slate-50',
              )}
              style={{ paddingLeft: 10 + depth * 14 + 16 }}
              title={n.path}
            >
              {(() => {
                const Icon = fileIcon(n.name);
                return <Icon className={cn('size-3.5 shrink-0', selected === n.path ? 'text-indigo-500' : 'text-slate-400')} aria-hidden />;
              })()}
              <span className="truncate font-mono">{n.name}</span>
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

function FolderItem({
  node,
  depth,
  selected,
  onSelect,
  defaultOpen,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (p: string) => void;
  defaultOpen: boolean;
}) {
  const containsSelected = !!selected && selected.startsWith(`${node.path}/`);
  const [open, setOpen] = useState(defaultOpen || containsSelected);
  return (
    <li role="treeitem" aria-expanded={open} aria-selected={false}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 py-1 pr-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
        style={{ paddingLeft: 10 + depth * 14 }}
      >
        <ChevronRight className={cn('size-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-90')} aria-hidden />
        {open ? (
          <FolderOpen className="size-3.5 shrink-0 text-amber-500" aria-hidden />
        ) : (
          <Folder className="size-3.5 shrink-0 text-amber-500" aria-hidden />
        )}
        <span className="truncate font-mono">{node.name}</span>
      </button>
      {open && node.children && (
        <TreeList nodes={node.children} depth={depth + 1} selected={selected} onSelect={onSelect} defaultOpen={defaultOpen} />
      )}
    </li>
  );
}

function FilePreviewPane({ submissionId, path }: { submissionId: string; path: string }) {
  const { data, isPending, isError, error } = useFilePreview(submissionId, path);
  const isMd = /\.(md|markdown)$/i.test(path);
  const [mode, setMode] = useState<'rendered' | 'raw'>(isMd ? 'rendered' : 'raw');
  const lines = data?.content.split('\n') ?? [];

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex min-h-10 items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium text-slate-700" title={path}>
          {path}
        </span>
        {data?.truncated && <span className="text-[11px] font-medium text-amber-700">Truncated</span>}
        {isMd && data && (
          <Segmented
            label="Markdown view"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'rendered', label: 'Rendered' },
              { value: 'raw', label: 'Raw' },
            ]}
          />
        )}
      </div>
      {isPending ? (
        <div className="space-y-2 p-4">
          {[80, 60, 72, 40, 66].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : isError ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          {error instanceof ApiError && error.status !== 0
            ? `${error.message || 'Preview isn’t available for this file.'}`
            : 'Couldn’t load this file.'}
          <span className="mt-1 block text-xs text-slate-400">Binary and large files can be checked in the downloaded zip.</span>
        </p>
      ) : isMd && mode === 'rendered' ? (
        <div className="scrollbar-thin max-h-[30rem] overflow-auto px-4 py-3">
          <Markdown>{data?.content ?? ''}</Markdown>
        </div>
      ) : (
        <div className="scrollbar-thin max-h-[30rem] overflow-auto bg-slate-950">
          <pre className="py-3 font-mono text-[12px] leading-[1.6] text-slate-200">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="sticky left-0 w-10 shrink-0 bg-slate-950 pr-3 text-right text-slate-600 select-none">{i + 1}</span>
                  <span className="pr-4 whitespace-pre">{line || ' '}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
