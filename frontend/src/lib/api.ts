export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.reload();
    }
    const errorText = await response.text();
    //If can be parsed as JSON, parse it and set error text to error field or message field
    let errorMessage;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || parsed.message || errorText;
    } catch {
    }
    throw new Error(`API request failed: ${response.status} ${errorMessage}`);
  }

  return response;
};