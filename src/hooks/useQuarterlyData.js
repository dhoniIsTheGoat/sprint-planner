import { useState, useEffect, useMemo } from 'react';
import { fetchDashboardBoards, fetchBoardQuarterlyData, fetchQuarterlyNextPage } from '../api/monday';

export const HEALTH_ORDER = { OVERDUE: 0, BLOCKED: 1, AT_RISK: 2, BEHIND: 3, IN_PROGRESS: 4, ON_TRACK: 5, COMPLETE: 6 };

export const HEALTH_CONFIG = {
  COMPLETE:    { color: '#037f4c', label: 'Complete',    bg: '#d1fae5' },
  ON_TRACK:    { color: '#00c875', label: 'On Track',    bg: '#dcfce7' },
  IN_PROGRESS: { color: '#4eccc6', label: 'In Progress', bg: '#ccfbf1' },
  BEHIND:      { color: '#fdab3d', label: 'Behind',      bg: '#fef3c7' },
  AT_RISK:     { color: '#ff6d3b', label: 'At Risk',     bg: '#ffedd5' },
  OVERDUE:     { color: '#df2f4a', label: 'Overdue',     bg: '#fee2e2' },
  BLOCKED:     { color: '#475569', label: 'Blocked',     bg: '#f1f5f9' },
};

const DONE_STATUSES   = new Set(['Done', 'Release Ready', 'Test Complete']);
const EARLY_STATUSES  = new Set(['Backlog', 'Gathering Req', 'Pending Req', 'Work Scheduled', 'Ready Req', 'Groomed', 'Requirements Frozen']);

function calculateHealth(status, endDate) {
  const now = new Date();
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  if (DONE_STATUSES.has(status))  return 'COMPLETE';
  if (status === 'Blocked')        return 'BLOCKED';
  if (daysRemaining < 0)           return 'OVERDUE';
  if (daysRemaining <= 14 && EARLY_STATUSES.has(status)) return 'AT_RISK';
  if (daysRemaining <= 30 && EARLY_STATUSES.has(status)) return 'BEHIND';
  return 'IN_PROGRESS';
}

function assignQuarter(timelineText) {
  if (!timelineText) return null;
  const parts = timelineText.split(' - ');
  if (parts.length < 2) return null;
  const endDate = new Date(parts[1].trim());
  if (isNaN(endDate.getTime())) return null;
  const quarter = Math.floor(endDate.getMonth() / 3) + 1;
  return { quarter, year: endDate.getFullYear(), label: `Q${quarter} ${endDate.getFullYear()}`, endDate };
}

function parseColumnSettings(settingsStr) {
  try {
    const settings = JSON.parse(settingsStr || '{}');
    const labels = settings.labels || {};
    const labelsColors = settings.labels_colors || {};
    const colorMap = {}, indexToLabel = {};
    Object.entries(labels).forEach(([idx, label]) => {
      indexToLabel[String(idx)] = label;
      colorMap[label] = labelsColors[idx]?.color || '#94a3b8';
    });
    return { colorMap, indexToLabel };
  } catch { return { colorMap: {}, indexToLabel: {} }; }
}

function resolveLabel(cv, indexToLabel) {
  if (cv?.value) {
    try {
      const parsed = JSON.parse(cv.value);
      const idx = String(parsed.index ?? parsed.label_id ?? '');
      if (idx && indexToLabel[idx]) return indexToLabel[idx];
    } catch {}
  }
  return cv?.text?.trim() || '';
}

function processBoard(boardData, boardId) {
  const { name, columns, items_page } = boardData;
  const allItems = items_page?.items || [];

  const statusCol   = columns?.find(c => c.type === 'status' && c.title === 'Status') ?? columns?.find(c => c.type === 'status');
  const timelineCol = columns?.find(c => c.type === 'timeline');
  const priorityCol = columns?.find(c => c.title === 'Priority');

  const { colorMap: statusColorMap,   indexToLabel: statusIdx   } = parseColumnSettings(statusCol?.settings_str);
  const { colorMap: priorityColorMap, indexToLabel: priorityIdx } = parseColumnSettings(priorityCol?.settings_str);

  const stories = allItems.map(item => {
    const statusCV   = item.column_values?.find(cv => cv.id === (statusCol?.id   || 'status'));
    const timelineCV = item.column_values?.find(cv => cv.id === (timelineCol?.id || 'timerange_mkw81h5p'));
    const personCV   = item.column_values?.find(cv => cv.id === 'person');
    const priorityCV = item.column_values?.find(cv => cv.id === 'color_mkw9md68');

    const status   = resolveLabel(statusCV, statusIdx) || '(No Status)';
    const timeline = timelineCV?.text?.trim() || '';
    const owner    = personCV?.text?.trim() || '';
    const priority = resolveLabel(priorityCV, priorityIdx) || '';

    const quarterData = assignQuarter(timeline);
    const health = quarterData ? calculateHealth(status, quarterData.endDate) : null;

    return {
      id:            item.id,
      name:          item.name,
      group:         item.group,
      status,
      statusColor:   statusColorMap[status] || '#94a3b8',
      timeline,
      quarter:       quarterData,
      health,
      priority,
      priorityColor: priorityColorMap[priority] || '#94a3b8',
      owner,
      mondayUrl:     `https://veritasprime-products.monday.com/boards/${boardId}/pulses/${item.id}`,
    };
  }).filter(s => s.quarter !== null);

  return { boardId, boardName: name, stories };
}

function getCurrentQuarterLabel() {
  const now = new Date();
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
}

export function useQuarterlyData() {
  const [allProducts,     setAllProducts]     = useState([]);
  const [loadStatus,      setLoadStatus]      = useState('idle');
  const [errorMsg,        setErrorMsg]        = useState('');
  const [refreshKey,      setRefreshKey]      = useState(0);
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarterLabel);

  const refresh = () => { setAllProducts([]); setLoadStatus('idle'); setRefreshKey(k => k + 1); };

  useEffect(() => {
    setLoadStatus('loading');
    const run = async () => {
      try {
        const boardList = await fetchDashboardBoards();
        const BATCH = 5;
        const results = [];
        for (let i = 0; i < boardList.length; i += BATCH) {
          const batch = boardList.slice(i, i + BATCH);
          const batchResults = await Promise.all(batch.map(async board => {
            try {
              const data = await fetchBoardQuarterlyData(board.id);
              if (!data) return null;
              let allItems = [...(data.items_page?.items || [])];
              let cursor = data.items_page?.cursor;
              while (cursor) {
                const page = await fetchQuarterlyNextPage(cursor);
                allItems.push(...(page.items || []));
                cursor = page.cursor || null;
              }
              const processed = processBoard({ ...data, items_page: { items: allItems } }, board.id);
              return processed.stories.length > 0
                ? { ...processed, workspaceName: board.workspaceName }
                : null;
            } catch (err) {
              console.error(`Error fetching board "${board.name}":`, err);
              return null;
            }
          }));
          results.push(...batchResults.filter(Boolean));
        }
        setAllProducts(results);
        setLoadStatus('ready');
      } catch (err) {
        const missing = err.message === 'MISSING_TOKEN';
        setErrorMsg(missing
          ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
          : `Failed to load quarterly data: ${err.message}`
        );
        setLoadStatus('error');
      }
    };
    run();
  }, [refreshKey]);

  const quarters = useMemo(() => {
    const qSet = new Set();
    allProducts.forEach(p => p.stories.forEach(s => { if (s.quarter) qSet.add(s.quarter.label); }));
    return [...qSet].sort((a, b) => {
      const parse = s => { const [q, y] = s.replace('Q', '').split(' '); return parseInt(y) * 10 + parseInt(q); };
      return parse(a) - parse(b);
    });
  }, [allProducts]);

  useEffect(() => {
    if (quarters.length > 0 && !quarters.includes(selectedQuarter)) {
      const cur = getCurrentQuarterLabel();
      setSelectedQuarter(quarters.includes(cur) ? cur : quarters[quarters.length - 1]);
    }
  }, [quarters]);

  const filteredProducts = useMemo(() => {
    if (!selectedQuarter) return [];
    return allProducts
      .map(p => ({ ...p, stories: p.stories.filter(s => s.quarter?.label === selectedQuarter) }))
      .filter(p => p.stories.length > 0)
      .sort((a, b) => {
        const worst = arr => Math.min(...arr.map(s => HEALTH_ORDER[s.health] ?? 99));
        return worst(a.stories) - worst(b.stories);
      });
  }, [allProducts, selectedQuarter]);

  const summary = useMemo(() => {
    const stories = filteredProducts.flatMap(p => p.stories);
    const count = h => stories.filter(s => s.health === h).length;
    return {
      total:      stories.length,
      complete:   count('COMPLETE'),
      inProgress: count('IN_PROGRESS'),
      onTrack:    count('ON_TRACK'),
      behind:     count('BEHIND'),
      atRisk:     count('AT_RISK'),
      overdue:    count('OVERDUE'),
      blocked:    count('BLOCKED'),
    };
  }, [filteredProducts]);

  const escalations = useMemo(() =>
    filteredProducts
      .flatMap(p => p.stories.map(s => ({ ...s, boardName: p.boardName })))
      .filter(s => ['OVERDUE', 'AT_RISK', 'BEHIND', 'BLOCKED'].includes(s.health))
      .sort((a, b) => (HEALTH_ORDER[a.health] ?? 99) - (HEALTH_ORDER[b.health] ?? 99)),
  [filteredProducts]);

  return { filteredProducts, summary, escalations, quarters, selectedQuarter, setSelectedQuarter, loadStatus, errorMsg, refresh };
}
