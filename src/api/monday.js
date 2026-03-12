const MONDAY_API_URL = 'https://api.monday.com/v2';
const API_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN;

export async function mondayQuery(query, variables = {}) {
  if (!API_TOKEN || API_TOKEN === '<your_monday_personal_api_token_here>') {
    throw new Error('MISSING_TOKEN');
  }
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_TOKEN,
      'API-Version': '2024-10',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Monday.com API error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

export async function fetchBoards() {
  const query = `query {
    boards(limit: 200) {
      id
      name
      board_kind
      workspace { id name }
    }
  }`;
  const data = await mondayQuery(query);
  const boards = data.boards || [];
  return boards.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchBoardColumns(boardId) {
  const query = `query ($id: [ID!]!) {
    boards(ids: $id) {
      columns { id title type }
    }
  }`;
  const data = await mondayQuery(query, { id: [boardId] });
  return data.boards[0]?.columns || [];
}

const TIME_TRACKING_FRAGMENT = `
  id
  type
  text
  value
  ... on TimeTrackingValue {
    duration
    history {
      started_user_id
      started_at
      ended_at
      status
      id
    }
  }
`;

export async function fetchBoardTimeData(boardId, timeColId, peopleColId) {
  const colIds = [timeColId, peopleColId].filter(Boolean);
  const query = `query ($id: [ID!]!) {
    boards(ids: $id) {
      items_page(limit: 500) {
        cursor
        items {
          id
          name
          group { title }
          column_values(ids: ${JSON.stringify(colIds)}) {
            ${TIME_TRACKING_FRAGMENT}
          }
          subitems {
            id
            name
            column_values {
              ${TIME_TRACKING_FRAGMENT}
            }
          }
        }
      }
    }
  }`;
  const data = await mondayQuery(query, { id: [boardId] });
  return data.boards[0]?.items_page || { items: [] };
}

export async function fetchNextPage(cursor, timeColId, peopleColId) {
  const colIds = [timeColId, peopleColId].filter(Boolean);
  const query = `query ($cursor: String!) {
    next_items_page(limit: 500, cursor: $cursor) {
      cursor
      items {
        id
        name
        group { title }
        column_values(ids: ${JSON.stringify(colIds)}) {
          ${TIME_TRACKING_FRAGMENT}
        }
        subitems {
          id
          name
          column_values {
            ${TIME_TRACKING_FRAGMENT}
          }
        }
      }
    }
  }`;
  const data = await mondayQuery(query, { cursor });
  return data.next_items_page || { items: [] };
}

export async function fetchUsers() {
  const cacheKey = 'mondayUsersCache';
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.cachedAt < 10 * 60 * 1000) {
      return cached.users;
    }
  } catch {}

  const query = `query {
    users(limit: 100) { id name email photo_thumb }
  }`;
  const data = await mondayQuery(query);
  const users = data.users || [];
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ users, cachedAt: Date.now() }));
  } catch {}
  return users;
}
