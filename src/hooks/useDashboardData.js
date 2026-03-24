import { useState, useEffect } from 'react';
import { fetchDashboardBoards, fetchBoardReleaseData, fetchReleaseNextPage } from '../api/monday';

// All known status labels (from Connect workspace Project Boards):
//   Blocked | Gathering Req | Test Complete | Work Scheduled | Ready Req
//   Backlog | Testing in Progress | Release Ready | Done
//   Pending Req | Requirements Frozen | Groomed | Work In Progress
// Terminal = counts toward completion %
const TERMINAL_STATUSES = new Set(['done', 'release ready', 'test complete']);

function parseColorMap(columns) {
  // Monday.com API v2024-10 returns status columns as type='status' (not 'color')
  // Prefer a column titled "Status"; fall back to any status-type column
  const statusCol = columns.find(c => c.type === 'status' && c.title === 'Status')
    ?? columns.find(c => c.type === 'status');
  if (!statusCol?.settings_str) return { statusColId: null, colorMap: {}, indexToLabel: {} };
  try {
    const settings = JSON.parse(statusCol.settings_str);
    const labels = settings.labels || {};
    const labelsColors = settings.labels_colors || {};
    const colorMap = {};
    const indexToLabel = {};
    Object.entries(labels).forEach(([idx, label]) => {
      indexToLabel[String(idx)] = label;
      colorMap[label] = labelsColors[idx]?.color || '#e2e8f0';
    });
    return { statusColId: statusCol.id, colorMap, indexToLabel };
  } catch {
    return { statusColId: null, colorMap: {}, indexToLabel: {} };
  }
}

function resolveStatusLabel(statusCV, indexToLabel) {
  // Primary: parse value JSON → index → label (most reliable)
  if (statusCV?.value) {
    try {
      const parsed = JSON.parse(statusCV.value);
      const idx = String(parsed.index ?? parsed.label_id ?? '');
      if (idx && indexToLabel[idx]) return indexToLabel[idx];
    } catch {}
  }
  // Fallback: text field
  const text = statusCV?.text?.trim();
  if (text) return text;
  return '(No Status)';
}

function aggregateBoard(boardData) {
  const { groups, columns, items_page } = boardData;
  const { statusColId, colorMap, indexToLabel } = parseColorMap(columns);
  const allItems = items_page?.items || [];

  const activeGroups = (groups || []).filter(g => !/backlog/i.test(g.title));

  const groupStats = {};
  activeGroups.forEach(g => {
    groupStats[g.id] = { id: g.id, title: g.title, statusCounts: {}, total: 0, items: [] };
  });

  allItems.forEach(item => {
    const gId = item.group?.id;
    if (!gId || !groupStats[gId]) return;

    const statusCV = statusColId
      ? item.column_values?.find(c => c.id === statusColId)
      : item.column_values?.find(c => c.type === 'status');

    const label = resolveStatusLabel(statusCV, indexToLabel);
    groupStats[gId].statusCounts[label] = (groupStats[gId].statusCounts[label] || 0) + 1;
    groupStats[gId].total++;
    groupStats[gId].items.push({ id: item.id, name: item.name, statusLabel: label });
  });

  const releases = Object.values(groupStats)
    .filter(g => g.total > 0)
    .map(g => {
      const completedCount = Object.entries(g.statusCounts)
        .filter(([label]) => TERMINAL_STATUSES.has(label.toLowerCase()))
        .reduce((s, [, count]) => s + count, 0);
      const completion = g.total > 0 ? Math.round(completedCount / g.total * 100) : 0;
      return { ...g, completedCount, completion };
    });

  releases.sort((a, b) => {
    if (a.completion === 100 && b.completion !== 100) return 1;
    if (b.completion === 100 && a.completion !== 100) return -1;
    return a.title.localeCompare(b.title);
  });

  return { colorMap, releases };
}

const WORKSPACE_COLORS = {
  'Connect':             '#6366f1',
  'Support':             '#f59e0b',
  'Standalone Products': '#10b981',
  'Stand Alone Products': '#10b981',
};

export function useDashboardData() {
  const [workspaces, setWorkspaces] = useState([]);
  const [status,     setStatus]     = useState('idle');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => { setWorkspaces([]); setStatus('idle'); setRefreshKey(k => k + 1); };

  useEffect(() => {
    setStatus('loading');

    const run = async () => {
      try {
        const boardList = await fetchDashboardBoards();

        const results = await Promise.all(boardList.map(async board => {
          try {
            const data = await fetchBoardReleaseData(board.id);
            if (!data) return null;

            let allItems = [...(data.items_page?.items || [])];
            let cursor = data.items_page?.cursor;
            while (cursor) {
              const page = await fetchReleaseNextPage(cursor);
              allItems.push(...(page.items || []));
              cursor = page.cursor || null;
            }

            const fullData = { ...data, items_page: { items: allItems } };
            const { colorMap, releases } = aggregateBoard(fullData);

            return { id: board.id, name: board.name, workspaceName: board.workspaceName, colorMap, releases };
          } catch (err) {
            console.error(`Error fetching board "${board.name}" (${board.id}):`, err);
            return null;
          }
        }));

        // Group boards by workspace
        const wsMap = {};
        results.filter(Boolean).forEach(board => {
          const wsName = board.workspaceName;
          if (!wsMap[wsName]) {
            wsMap[wsName] = { name: wsName, color: WORKSPACE_COLORS[wsName] || '#6366f1', boards: [] };
          }
          wsMap[wsName].boards.push(board);
        });

        // Sort workspaces: Connect first, then alphabetical
        const WS_ORDER = ['Connect', 'Support', 'Standalone Products', 'Stand Alone Products'];
        const sorted = Object.values(wsMap).sort((a, b) => {
          const ai = WS_ORDER.indexOf(a.name), bi = WS_ORDER.indexOf(b.name);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        setWorkspaces(sorted);
        setStatus('ready');
      } catch (err) {
        const missing = err.message === 'MISSING_TOKEN';
        setErrorMsg(missing
          ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
          : `Failed to load dashboard data: ${err.message}`
        );
        setStatus('error');
      }
    };

    run();
  }, [refreshKey]);

  return { workspaces, status, errorMsg, refresh };
}
