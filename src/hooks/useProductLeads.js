import { useState, useCallback } from 'react';

const STORAGE_KEY = 'productLeadsData_v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { leads: [] };
  } catch { return { leads: [] }; }
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useProductLeads() {
  const [data, setData] = useState(load);

  const update = useCallback(fn => {
    setData(prev => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const addLead = useCallback(({ name, email = '', role = 'Product Lead', product = '' }) => {
    update(d => ({
      ...d,
      leads: [...d.leads, { id: uid(), name, email, role, product, goals: [], createdAt: new Date().toISOString() }],
    }));
  }, [update]);

  const updateLead = useCallback((leadId, patch) => {
    update(d => ({ ...d, leads: d.leads.map(l => l.id === leadId ? { ...l, ...patch } : l) }));
  }, [update]);

  const removeLead = useCallback(leadId => {
    update(d => ({ ...d, leads: d.leads.filter(l => l.id !== leadId) }));
  }, [update]);

  const addGoal = useCallback((leadId, { title, description = '', dueDate, status = 'Not Started' }) => {
    update(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId
        ? { ...l, goals: [...l.goals, { id: uid(), title, description, dueDate, status, progress: 0, createdAt: new Date().toISOString() }] }
        : l
      ),
    }));
  }, [update]);

  const updateGoal = useCallback((leadId, goalId, patch) => {
    update(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId
        ? { ...l, goals: l.goals.map(g => g.id === goalId ? { ...g, ...patch } : g) }
        : l
      ),
    }));
  }, [update]);

  const removeGoal = useCallback((leadId, goalId) => {
    update(d => ({
      ...d,
      leads: d.leads.map(l => l.id === leadId
        ? { ...l, goals: l.goals.filter(g => g.id !== goalId) }
        : l
      ),
    }));
  }, [update]);

  return { leads: data.leads, addLead, updateLead, removeLead, addGoal, updateGoal, removeGoal };
}
