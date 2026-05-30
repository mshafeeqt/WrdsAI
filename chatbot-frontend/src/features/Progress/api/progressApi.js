export async function fetchMyProgress({ apiBaseUrl, email }) {
  const response = await fetch(`${apiBaseUrl}/api/ai/progress/my-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load progress');
  }

  return data;
}
