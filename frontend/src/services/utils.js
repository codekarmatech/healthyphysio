export function authHeader() {
  const token = localStorage.getItem('token');
  
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  } else {
    return {};
  }
}

export function handleResponse(response) {
  return response.text().then(text => {
    const data = text && JSON.parse(text);
    
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        // Auto logout if 401 Unauthorized or 403 Forbidden response
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
      
      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }
    
    return data;
  });
}