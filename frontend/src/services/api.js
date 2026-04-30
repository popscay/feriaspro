const BASE_URL = 'http://localhost:8080/api';

async function request(method, path, body, userId) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Request failed');
  }

  return json.data;
}

// Employees
export const employeeApi = {
  getAll: (userId) => request('GET', '/employees', null, userId),
  getById: (id, userId) => request('GET', `/employees/${id}`, null, userId),
  getManagers: (userId) => request('GET', '/employees/managers', null, userId),
  create: (data, userId) => request('POST', '/employees', data, userId),
  update: (id, data, userId) => request('PUT', `/employees/${id}`, data, userId),
  delete: (id, userId) => request('DELETE', `/employees/${id}`, null, userId),
};

// Vacation Requests
export const vacationApi = {
  getAll: (userId) => request('GET', '/vacation-requests', null, userId),
  getById: (id, userId) => request('GET', `/vacation-requests/${id}`, null, userId),
  create: (data, userId) => request('POST', '/vacation-requests', data, userId),
  update: (id, data, userId) => request('PUT', `/vacation-requests/${id}`, data, userId),
  cancel: (id, userId) => request('PATCH', `/vacation-requests/${id}/cancel`, null, userId),
  approve: (id, userId) => request('PATCH', `/vacation-requests/${id}/approve`, null, userId),
  reject: (id, data, userId) => request('PATCH', `/vacation-requests/${id}/reject`, data, userId),
};
