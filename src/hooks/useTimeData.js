import { useState, useEffect } from 'react';
import { mondayQuery, fetchBoardColumns, fetchBoardTimeData, fetchNextPage, fetchUsers } from '../api/monday';

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

function parseTimeValue(rawValue) {
  if (!rawValue) return { totalSeconds: 0, history: [] };
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    const totalSeconds = parsed.duration || 0;
    let history = [];
    const av = parsed.additional_value;
    if (Array.isArray(av)) {
      history = av;
    } else if (typeof av === 'string') {
      try {
        const inner = JSON.parse(av);
        history = Array.isArray(inner) ? inner : (inner?.history || []);
      } catch {}
    } else if (av && typeof av === 'object') {
      history = av.history || [];
    }
    return { totalSeconds, history };
  } catch {
    return { totalSeconds: 0, history: [] };
  }
}

function parsePeopleValue(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    return (parsed.personsAndTeams || [])
      .filter(p => p.kind === 'person')
      .map(p => String(p.id));
  } catch {
    return [];
  }
}

function emitEntries(taskName, groupTitle, timeCol, peopleColValue, boardName, workspaceName, userMap) {
  const inlineHistory = Array.isArray(timeCol.history) ? timeCol.history : null;
  const { totalSeconds, history: parsedHistory } = parseTimeValue(timeCol.value);
  const history = inlineHistory || parsedHistory;
  const total = timeCol.duration ?? totalSeconds;
  if (total <= 0) return [];

  const base = { boardName, workspaceName, taskName, groupTitle };
  const makeUser = uid => ({
    userId:    uid,
    userName:  userMap[uid]?.name || `User ${uid}`,
    userEmail: userMap[uid]?.email || '',
    userPhoto: userMap[uid]?.photo_thumb || '',
  });

  if (history.length > 0) {
    const timedEntries = [];
    const manualUserIds = new Set();

    history.forEach(session => {
      if (!session.started_user_id) return;
      const uid   = String(session.started_user_id);
      const start = session.started_at ? new Date(session.started_at) : null;
      const end   = session.ended_at   ? new Date(session.ended_at)   : null;
      const secs  = (start && end) ? Math.max(0, (end - start) / 1000) : 0;
      if (secs > 0) {
        timedEntries.push({ ...base, ...makeUser(uid), hours: parseFloat((secs / 3600).toFixed(2)), startedAt: session.started_at || null });
      } else {
        manualUserIds.add(uid);
      }
    });

    if (timedEntries.length > 0) return timedEntries;

    if (manualUserIds.size > 0) {
      const perUser = parseFloat((total / 3600 / manualUserIds.size).toFixed(2));
      return [...manualUserIds].map(uid => ({ ...base, ...makeUser(uid), hours: perUser, startedAt: null }));
    }
  }

  const personIds = parsePeopleValue(peopleColValue);
  const hours = parseFloat((total / 3600).toFixed(2));
  if (personIds.length > 0) {
    const perPerson = parseFloat((hours / personIds.length).toFixed(2));
    return personIds.map(uid => ({ ...base, ...makeUser(uid), hours: perPerson, startedAt: null }));
  }
  return [{ ...base, userId: 'unassigned', userName: 'Unassigned', userEmail: '', userPhoto: '', hours, startedAt: null }];
}

function aggregateItems(items, timeColId, peopleColId, boardName, workspaceName, userMap) {
  const entries = [];
  const PEOPLE_TYPES = ['people', 'board-owner', 'team', 'owner'];
  const findPeopleCV = cvs => cvs?.find(c => c.id === peopleColId) ?? cvs?.find(c => PEOPLE_TYPES.includes(c.type));

  items.forEach(item => {
    const timeCV   = item.column_values?.find(c => c.id === timeColId || c.type === 'time_tracking');
    const peopleCV = findPeopleCV(item.column_values);
    if (timeCV && (timeCV.value || timeCV.duration)) {
      entries.push(...emitEntries(item.name, item.group?.title || '', timeCV, peopleCV?.value, boardName, workspaceName, userMap));
    }
    (item.subitems || []).forEach(sub => {
      const subTimeCV   = sub.column_values?.find(c => c.type === 'time_tracking');
      const subPeopleCV = findPeopleCV(sub.column_values);
      if (subTimeCV && (subTimeCV.value || subTimeCV.duration)) {
        entries.push(...emitEntries(`${item.name} › ${sub.name}`, item.group?.title || '', subTimeCV, subPeopleCV?.value, boardName, workspaceName, userMap));
      }
    });
  });

  return entries;
}

async function fetchAllItems(boardId, timeColId, peopleColId) {
  const items = [];
  let page = await fetchBoardTimeData(boardId, timeColId, peopleColId);
  items.push(...(page.items || []));
  let cursor = page.cursor;
  while (cursor) {
    page = await fetchNextPage(cursor, timeColId, peopleColId);
    items.push(...(page.items || []));
    cursor = page.cursor || null;
  }
  return items;
}

export function useTimeData() {
  const [entries,    setEntries]    = useState([]);
  const [users,      setUsers]      = useState([]);
  const [status,     setStatus]     = useState('idle');
  const [progress,   setProgress]   = useState({ done: 0, total: 0 });
  const [errorMsg,   setErrorMsg]   = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => { setEntries([]); setStatus('idle'); setRefreshKey(k => k + 1); };

  useEffect(() => {
    setStatus('loading');
    setProgress({ done: 0, total: 0 });

    const run = async () => {
      try {
        const [userList, boards] = await Promise.all([fetchUsers(), fetchAllBoards()]);
        const userMap = Object.fromEntries(userList.map(u => [String(u.id), u]));
        setUsers(userList);
        setProgress({ done: 0, total: boards.length });

        const allEntries = [];

        for (let i = 0; i < boards.length; i += BATCH_SIZE) {
          const batch = boards.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(async board => {
            try {
              const columns = await fetchBoardColumns(board.id);
              const timeCol = columns.find(c => c.type === 'time_tracking');
              if (!timeCol) return;

              const PEOPLE_TYPES = ['people', 'board-owner', 'team', 'owner', 'multiple-person'];
              const peopleCol = columns.find(c => PEOPLE_TYPES.includes(c.type))
                ?? columns.find(c => /owner|assignee|person|member/i.test(c.title));

              const items = await fetchAllItems(board.id, timeCol.id, peopleCol?.id || '');
              allEntries.push(...aggregateItems(items, timeCol.id, peopleCol?.id || '', board.name, board.workspaceName, userMap));
            } catch (err) {
              console.warn(`[useTimeData] Board "${board.name}" skipped:`, err.message);
            }
          }));
          setProgress(p => ({ ...p, done: Math.min(p.done + batch.length, boards.length) }));
        }

        setEntries(allEntries);
        setStatus('ready');
      } catch (err) {
        setErrorMsg(
          err.message === 'MISSING_TOKEN'
            ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
            : `Failed to load time data: ${err.message}`
        );
        setStatus('error');
      }
    };

    run();
  }, [refreshKey]);

  return { entries, users, status, progress, errorMsg, refresh };
}
