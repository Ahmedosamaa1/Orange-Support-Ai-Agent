const API_BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchKpis() {
  const res = await fetch(`${API_BASE}/dashboard/kpis`);
  return res.json();
}

export async function fetchTickets(search = '', category = '', status = '', reviewStatus = '') {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (category) query.append('category', category);
  if (status) query.append('status', status);
  if (reviewStatus && reviewStatus !== 'all') query.append('review_status', reviewStatus);
  const res = await fetch(`${API_BASE}/tickets?${query.toString()}`);
  return res.json();
}

export async function updateTicketReview(id, reviewStatus, reviewerNotes = '') {
  const res = await fetch(`${API_BASE}/tickets/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_status: reviewStatus, reviewer_notes: reviewerNotes })
  });
  return res.json();
}

export async function fetchTicketDetails(id) {
  const res = await fetch(`${API_BASE}/tickets/${id}`);
  return res.json();
}

export async function fetchKnowledgeBase() {
  const res = await fetch(`${API_BASE}/knowledge-base`);
  return res.json();
}

export async function reindexKnowledgeBase() {
  const res = await fetch(`${API_BASE}/knowledge-base/reindex`, { method: 'POST' });
  return res.json();
}

export async function generateDailyReport() {
  const res = await fetch(`${API_BASE}/reports/generate`, { method: 'POST' });
  return res.json();
}

export async function runEvaluation() {
  const res = await fetch(`${API_BASE}/evaluation/run`, { method: 'POST' });
  return res.json();
}

export async function fetchNetworkStatus(region = 'Cairo') {
  const res = await fetch(`${API_BASE}/network-status?region=${encodeURIComponent(region)}`);
  return res.json();
}

export async function streamSupportChat(payload, onEvent, onError, onComplete) {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // keep remainder

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            onEvent(data);
          } catch (e) {
            console.error('Failed to parse SSE JSON:', e);
          }
        }
      }
    }

    if (onComplete) onComplete();
  } catch (err) {
    if (onError) onError(err);
  }
}
