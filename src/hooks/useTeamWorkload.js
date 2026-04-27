import { useState, useEffect, useCallback } from 'react';
import { mondayQuery, fetchUsers } from '../api/monday';

const BATCH_SIZE = 5;

async function fetchAllBoards() {
  const data = await mondayQuery(`query {
    boards(limit: 500) {
      id name
      workspace { id name }
    }
  }`);
  return (data.boards || [])
    .filter(b => !b.name.startsWith('Subitems of'))
    .map(b => ({ id: b.id, name: b.name, workspaceName: b.workspace?.name || '' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchBoardForWorkload(boardId) {
  const data = await mondayQuery(`query {
    boards(ids: [${boardId}]) {
      columns { id title type }
      items_page(limit: 500) {
        cursor
        items {
          id name
          group { title }
          column_values { id type text value }
        }
      }
    }
  }`);
  return data.boards?.[0] || null;
}

async function fetchNextWorkloadPage(cursor) {
  const data = await mondayQuery(`query {
    next_items_page(limit: 500, cursor: ${JSON.stringify(cursor)}) {
      cursor
      items {
        id name
        group { title }
        column_values { id type text value }
      }
    }
  }`);
  return data.next_items_page || { items: [] };
}

function resolvePersonColumn(columns) {
  return (
    columns.find(c => /developer/i.test(c.title)) ??
    columns.find(c => c.type === 'multiple-person') ??
    columns.find(c => c.type === 'person') ??
    columns.find(c => c.title.toLowerCase() === 'person') ??
    columns.find(c => /owner|assigned/i.test(c.title))
  )?.id ?? null;
}

function resolveStatusColumn(columns) {
  const devExact = columns.find(c => c.title.trim().toLowerCase() === 'dev status');
  if (devExact) return devExact.id;
  const devPartial = columns.find(c => /dev/i.test(c.title) && /status/i.test(c.title));
  if (devPartial) return devPartial.id;
  const plain = columns.find(c => c.title.trim().toLowerCase() === 'status');
  if (plain) return plain.id;
  return columns.find(c => c.type === 'color' || c.type === 'status')?.id ?? null;
}

function resolveSprintColumn(columns) {
  return columns.find(c => /sprint/i.test(c.title))?.id ?? null;
}

function parsePeopleIds(value) {
  if (!value || value === '{}' || value === 'null') return [];
  try {
    const parsed = JSON.parse(value);
    return (parsed?.personsAndTeams || [])
      .filter(p => p.kind === 'person')
      .map(p => String(p.id));
  } catch { return []; }
}

export function useTeamWorkload() {
  const [users, setUsers] = useState([]);
  const [tasksByUser, setTasksByUser] = useState({});
  const [allBoards, setAllBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTasksByUser({});
    setProgress({ done: 0, total: 0 });

    try {
      const [usersData, boardList] = await Promise.all([
        fetchUsers(),
        fetchAllBoards(),
      ]);

      setUsers(usersData);
      setAllBoards(boardList);
      setProgress({ done: 0, total: boardList.length });

      const byUser = {};

      for (let i = 0; i < boardList.length; i += BATCH_SIZE) {
        const batch = boardList.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async board => {
            try {
              const data = await fetchBoardForWorkload(board.id);
              if (!data) return;

              const cols = data.columns || [];
              const personColId = resolvePersonColumn(cols);
              if (!personColId) return;

              const statusColId = resolveStatusColumn(cols);
              const sprintColId = resolveSprintColumn(cols);

              let items = [...(data.items_page?.items || [])];
              let cursor = data.items_page?.cursor;
              while (cursor) {
                const next = await fetchNextWorkloadPage(cursor);
                items.push(...(next.items || []));
                cursor = next.cursor || null;
              }

              items.forEach(item => {
                const personCv = item.column_values.find(cv => cv.id === personColId);
                if (!personCv?.value || personCv.value === '{}') return;

                const personIds = parsePeopleIds(personCv.value);
                if (personIds.length === 0) return;

                const statusCv = statusColId ? item.column_values.find(cv => cv.id === statusColId) : null;
                const sprintCv = sprintColId ? item.column_values.find(cv => cv.id === sprintColId) : null;

                const task = {
                  id: item.id,
                  name: item.name,
                  board: board.name,
                  boardId: board.id,
                  workspace: board.workspaceName,
                  group: item.group?.title || '',
                  status: statusCv?.text || '',
                  sprint: sprintCv?.text || '',
                };

                personIds.forEach(uid => {
                  if (!byUser[uid]) byUser[uid] = [];
                  byUser[uid].push(task);
                });
              });
            } catch (e) {
              console.warn(`[TeamWorkload] Board "${board.name}" skipped:`, e.message);
            }
          })
        );
        setProgress(p => ({ ...p, done: Math.min(p.done + batch.length, boardList.length) }));
      }

      setTasksByUser({ ...byUser });
    } catch (err) {
      setError(
        err.message === 'MISSING_TOKEN'
          ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
          : `Failed to load workload data: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { users, tasksByUser, allBoards, loading, progress, error, refresh: load };
}
