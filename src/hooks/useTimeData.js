import { useState, useEffect } from 'react';
import { fetchBoardColumns, fetchBoardTimeData, fetchNextPage, fetchUsers } from '../api/monday';

const MAP_KEY = 'mondayBoardProductMap';

function loadMappings() {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function parseTimeValue(rawValue) {
  if (!rawValue) return { totalSeconds: 0, history: [] };
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    const totalSeconds = parsed.duration || 0;

    // additional_value comes back in several shapes depending on API version:
    //   1. Object:  { history: [...] }
    //   2. String:  "[{...}, ...]"  (JSON-stringified array)
    //   3. Missing / null
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

// Emit one entry per history session (for accurate date filtering),
// or a fallback entry (startedAt: null) when no history is available.
// timeCol is the full column_value object (may have .history from inline fragment).
function emitEntries(taskName, groupTitle, timeCol, peopleColValue, boardName, productName, userMap) {
  // Prefer structured history from the inline fragment; fall back to parsing value JSON
  const inlineHistory = Array.isArray(timeCol.history) ? timeCol.history : null;
  const { totalSeconds, history: parsedHistory } = parseTimeValue(timeCol.value);
  const history = inlineHistory || parsedHistory;
  const total = timeCol.duration ?? totalSeconds;
  if (total <= 0) return [];

  const base = { productName, boardName, taskName, groupTitle };
  const makeUser = uid => ({
    userId:    uid,
    userName:  userMap[uid]?.name || `User ${uid}`,
    userEmail: userMap[uid]?.email || '',
    userPhoto: userMap[uid]?.photo_thumb || '',
  });

  if (history.length > 0) {
    const timedEntries = [];
    const manualUserIds = new Set(); // users who logged time manually (no timestamps)

    history.forEach(session => {
      if (!session.started_user_id) return;
      const uid   = String(session.started_user_id);
      const start = session.started_at ? new Date(session.started_at) : null;
      const end   = session.ended_at   ? new Date(session.ended_at)   : null;
      const secs  = (start && end) ? Math.max(0, (end - start) / 1000) : 0;
      if (secs > 0) {
        timedEntries.push({
          ...base, ...makeUser(uid),
          hours:     parseFloat((secs / 3600).toFixed(2)),
          startedAt: session.started_at || null,
        });
      } else {
        // Manually entered time — record the user, distribute total at the end
        manualUserIds.add(uid);
      }
    });

    if (timedEntries.length > 0) return timedEntries;

    // All sessions were manually entered — split total evenly across users
    if (manualUserIds.size > 0) {
      const perUser = parseFloat((total / 3600 / manualUserIds.size).toFixed(2));
      return [...manualUserIds].map(uid => ({
        ...base, ...makeUser(uid), hours: perUser, startedAt: null,
      }));
    }
  }

  // Fallback: no history at all — attribute total to assigned person(s)
  const personIds = parsePeopleValue(peopleColValue);
  const hours = parseFloat((total / 3600).toFixed(2));
  if (personIds.length > 0) {
    const perPerson = parseFloat((hours / personIds.length).toFixed(2));
    return personIds.map(uid => ({ ...base, ...makeUser(uid), hours: perPerson, startedAt: null }));
  }
  return [{ ...base, userId: 'unassigned', userName: 'Unassigned', userEmail: '', userPhoto: '', hours, startedAt: null }];
}

function aggregateItems(items, timeColId, peopleColId, boardName, productName, userMap) {
  const entries = [];

  const PEOPLE_TYPES = ['people', 'board-owner', 'team', 'owner'];
  const findPeopleCV = cvs => cvs?.find(c => c.id === peopleColId)
    ?? cvs?.find(c => PEOPLE_TYPES.includes(c.type));

  items.forEach(item => {
    const timeCV   = item.column_values?.find(c => c.id === timeColId || c.type === 'time_tracking');
    const peopleCV = findPeopleCV(item.column_values);
    if (timeCV && (timeCV.value || timeCV.duration)) {
      entries.push(...emitEntries(item.name, item.group?.title || '', timeCV, peopleCV?.value, boardName, productName, userMap));
    }

    (item.subitems || []).forEach(sub => {
      const subTimeCV   = sub.column_values?.find(c => c.type === 'time_tracking');
      const subPeopleCV = findPeopleCV(sub.column_values);
      if (subTimeCV && (subTimeCV.value || subTimeCV.duration)) {
        const taskName = `${item.name} › ${sub.name}`;
        entries.push(...emitEntries(taskName, item.group?.title || '', subTimeCV, subPeopleCV?.value, boardName, productName, userMap));
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
  const [errorMsg,   setErrorMsg]   = useState('');
  const [mappings,   setMappings]   = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => { setEntries([]); setStatus('idle'); setRefreshKey(k => k + 1); };

  useEffect(() => {
    const maps = loadMappings();
    setMappings(maps);

    const mappedBoards = Object.entries(maps).filter(([, v]) => v.productName);
    console.log('[useTimeData] boards to fetch:', mappedBoards.map(([id, { boardName }]) => `${boardName} (${id})`));
    if (mappedBoards.length === 0) { setStatus('ready'); return; }

    setStatus('loading');

    const run = async () => {
      try {
        const userList = await fetchUsers();
        const userMap  = Object.fromEntries(userList.map(u => [u.id, u]));
        setUsers(userList);

        const allEntries = [];
        await Promise.all(mappedBoards.map(async ([boardId, { boardName, productName }]) => {
          try {
            const columns   = await fetchBoardColumns(boardId);
            console.log(`[${boardName}] columns:`, columns.map(c => `${c.title} (${c.type})`));

            const timeCol = columns.find(c => c.type === 'time_tracking');
            if (!timeCol) { console.log(`Board "${boardName}" has no time_tracking column — skipping.`); return; }

            // Match people column by type first, then fall back to title keywords
            const PEOPLE_TYPES = ['people', 'board-owner', 'team', 'owner'];
            const peopleCol = columns.find(c => PEOPLE_TYPES.includes(c.type))
              ?? columns.find(c => /owner|assignee|person|member/i.test(c.title));
            const items = await fetchAllItems(boardId, timeCol.id, peopleCol?.id || '');
            allEntries.push(...aggregateItems(items, timeCol.id, peopleCol?.id || '', boardName, productName, userMap));
          } catch (err) {
            console.error(`Error fetching board "${boardName}" (${boardId}):`, err);
          }
        }));

        // Debug: inspect startedAt values — remove once date filtering is confirmed working
        const sample = allEntries.slice(0, 5);
        console.log('[useTimeData] sample entries:', sample.map(e => ({ task: e.taskName, hours: e.hours, startedAt: e.startedAt })));
        const datedCount = allEntries.filter(e => e.startedAt).length;
        console.log(`[useTimeData] ${allEntries.length} total entries, ${datedCount} with startedAt date`);

        setEntries(allEntries);
        setStatus('ready');
      } catch (err) {
        const missing = err.message === 'MISSING_TOKEN';
        setErrorMsg(missing
          ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
          : `Failed to load time data: ${err.message}`
        );
        setStatus('error');
      }
    };

    run();
  }, [refreshKey]);

  return { entries, users, status, errorMsg, mappings, refresh };
}
