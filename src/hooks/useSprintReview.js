import { useState, useEffect, useCallback } from 'react';
import { mondayQuery } from '../api/monday';

const DONE_STATUSES = new Set(['Done', 'Release Ready', 'Test Complete', 'Cancelled', 'Archived']);
const BACKLOG_GROUP = /backlog/i;
const BATCH_SIZE = 5;
const DEV_WORKSPACES = new Set(['Connect', 'Support', 'Standalone Products', 'Stand Alone Products']);

async function fetchDevBoards() {
  const data = await mondayQuery(`query {
    boards(limit: 500) {
      id name
      workspace { id name }
    }
  }`);
  return (data.boards || [])
    .filter(b =>
      DEV_WORKSPACES.has(b.workspace?.name) &&
      /\bDev$/i.test(b.name) &&
      !b.name.startsWith('Subitems of')
    )
    .map(b => ({ id: b.id, name: b.name, workspaceName: b.workspace.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchBoardItems(boardId) {
  const data = await mondayQuery(`query {
    boards(ids: [${boardId}]) {
      columns { id title type }
      items_page(limit: 500) {
        cursor
        items {
          id name
          group { id title }
          column_values { id type text value }
        }
      }
    }
  }`);
  return data.boards?.[0] || null;
}

async function fetchNextPage(cursor) {
  const data = await mondayQuery(`query {
    next_items_page(limit: 500, cursor: ${JSON.stringify(cursor)}) {
      cursor
      items {
        id name
        group { id title }
        column_values { id type text value }
      }
    }
  }`);
  return data.next_items_page || { items: [] };
}

// Prefer "Developer" column, fall back to "person"
function resolveOwnerColumnId(columns) {
  return columns.find(c => /developer/i.test(c.title))?.id ?? 'person';
}

// Prefer "Dev Status", fall back to plain "Status", then any color/status column
function resolveStatusColumnId(columns) {
  // 1. Exact "Dev Status"
  const devExact = columns.find(c => c.title.trim().toLowerCase() === 'dev status');
  if (devExact) return devExact.id;

  // 2. Title contains both "dev" and "status"
  const devPartial = columns.find(c => /dev/i.test(c.title) && /status/i.test(c.title));
  if (devPartial) return devPartial.id;

  // 3. Any color/status type column with "dev" in title
  const devColor = columns.find(c => (c.type === 'color' || c.type === 'status') && /dev/i.test(c.title));
  if (devColor) return devColor.id;

  // 4. Exact "Status" column (covers Standalone workspace boards)
  const plain = columns.find(c => c.title.trim().toLowerCase() === 'status');
  if (plain) return plain.id;

  // 5. Any color/status type column
  const anyStatus = columns.find(c => c.type === 'color' || c.type === 'status');
  if (anyStatus) return anyStatus.id;

  return 'status';
}

// Find sprint column — board_relation, dropdown, or text column with "sprint" in title
function resolveSprintColumnId(columns) {
  return columns.find(c => /sprint/i.test(c.title))?.id ?? null;
}

// Find requirement/confluence link column
function resolveRequirementColumnId(columns) {
  return columns.find(c => /requirement/i.test(c.title))?.id ?? null;
}

// Find user story column — "Story" exact, then "Connect Project Board", then any /story/i
function resolveStoryColumnId(columns) {
  return (
    columns.find(c => c.title.trim().toLowerCase() === 'story') ??
    columns.find(c => /connect.*project.*board|connect.*board/i.test(c.title)) ??
    columns.find(c => /story/i.test(c.title))
  )?.id ?? null;
}

// Extract URL from a link-type column value JSON, or return plain text if it looks like a URL
function extractUrl(colValue) {
  if (!colValue) return null;
  try {
    const parsed = JSON.parse(colValue);
    return parsed.url || parsed.link || null;
  } catch {
    // plain text that might be a URL
    if (/^https?:\/\//i.test(colValue.trim())) return colValue.trim();
    return null;
  }
}

// Extract URL from a story/board_relation column — tries link URL first, then linkedPulseId
function extractStoryUrl(colText, colValue) {
  const url = extractUrl(colValue) || extractUrl(colText);
  if (url) return url;
  try {
    const parsed = JSON.parse(colValue);
    const ids = parsed?.linkedPulseIds;
    if (Array.isArray(ids) && ids.length > 0) {
      const id = ids[0]?.linkedPulseId;
      if (id) return `https://veritasprime-products.monday.com/pulses/${id}`;
    }
  } catch {}
  return null;
}

// Prefer column with "estimated" + "hours" in title, or just "estimated hours"
function resolveEstHoursColumnId(columns) {
  return columns.find(c => /estimated.*hours|hours.*estimated|est.*hours/i.test(c.title))?.id ?? null;
}

// Prefer time_tracking type column with "time" + "spent" in title, then any time_tracking column
function resolveTimeSpentColumnId(columns) {
  const byTitle = columns.find(c => /time\s*spent|spent\s*time/i.test(c.title));
  if (byTitle) return byTitle.id;
  const byType = columns.find(c => c.type === 'time_tracking');
  return byType?.id ?? null;
}

// Format "25:15:00" → "25h 15m", or plain numbers as "Xh"
export function formatDuration(text) {
  if (!text) return '—';
  if (text.includes(':')) {
    const parts = text.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (h === 0 && m === 0) return '—';
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  const n = parseFloat(text);
  return isNaN(n) || n === 0 ? '—' : `${n}h`;
}

export function useSprintReview() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTasks([]);

    try {
      const boards = await fetchDevBoards();
      console.log('[SprintReview] Dev boards found:', boards.map(b => b.name));

      const allTasks = [];

      for (let i = 0; i < boards.length; i += BATCH_SIZE) {
        const batch = boards.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async board => {
            const data = await fetchBoardItems(board.id);
            if (!data) return [];

            const cols        = data.columns || [];
            const ownerColId  = resolveOwnerColumnId(cols);
            const statusColId = resolveStatusColumnId(cols);
            const sprintColId = resolveSprintColumnId(cols);
            const estColId    = resolveEstHoursColumnId(cols);
            const timeColId   = resolveTimeSpentColumnId(cols);
            const reqColId    = resolveRequirementColumnId(cols);
            const storyColId  = resolveStoryColumnId(cols);

            const statusColName = cols.find(c => c.id === statusColId)?.title ?? statusColId;
            const sprintColName = cols.find(c => c.id === sprintColId)?.title ?? '(none)';
            const storyColName  = cols.find(c => c.id === storyColId)?.title ?? '(none)';
            console.log(`[SprintReview] ${board.name}: owner="${ownerColId}" status="${statusColId}" (${statusColName}) sprint="${sprintColId}" (${sprintColName}) story="${storyColId}" (${storyColName})`);
            console.log(`[SprintReview] ${board.name} all columns:`, cols.map(c => `${c.title} [${c.type}]`));

            let items = [...(data.items_page?.items || [])];
            let cursor = data.items_page?.cursor;
            while (cursor) {
              const next = await fetchNextPage(cursor);
              items.push(...(next.items || []));
              cursor = next.cursor || null;
            }

            const shortName = board.name.replace(/\s*Dev$/i, '').trim();

            const boardItems = items
              .filter(item => {
                const status = item.column_values.find(cv => cv.id === statusColId)?.text || '';
                const group  = item.group?.title || '';
                return !DONE_STATUSES.has(status) && !BACKLOG_GROUP.test(group);
              })
              .map(item => {
                const cvText  = {};
                const cvValue = {};
                item.column_values.forEach(c => {
                  cvText[c.id]  = c.text  || '';
                  cvValue[c.id] = c.value || '';
                });
                const reqUrl   = reqColId   ? extractUrl(cvValue[reqColId])   || extractUrl(cvText[reqColId])   : null;
                const storyUrl = storyColId ? extractStoryUrl(cvText[storyColId], cvValue[storyColId])         : null;
                return {
                  id:         item.id,
                  name:       item.name,
                  boardId:    board.id,
                  board:      shortName,
                  owner:      cvText[ownerColId]  || cvText['person'] || '',
                  status:     cvText[statusColId] || cvText['status'] || '',
                  priority:   cvText['color_mkw9md68'] || '',
                  release:    item.group?.title || '',
                  sprint:     sprintColId ? cvText[sprintColId] : '',
                  estHours:   estColId    ? cvText[estColId]    : '',
                  timeSpent:  timeColId   ? cvText[timeColId]   : '',
                  reqUrl,
                  storyUrl,
                };
              });

            console.log(`[SprintReview] ${shortName}: ${items.length} total → ${boardItems.length} active`);
            return boardItems;
          })
        );
        batchResults.forEach(r => allTasks.push(...r));
      }

      setTasks(allTasks);
    } catch (err) {
      setError(
        err.message === 'MISSING_TOKEN'
          ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
          : `Failed to load tasks: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, error, refresh: load };
}
