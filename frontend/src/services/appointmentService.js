import { handleResponse, authHeader } from './utils';

const API_URL = '/api';

export const appointmentService = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  getUpcoming,
  getByDate
};

async function getAll() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader()
  };
  return fetch(`${API_URL}/appointments`, requestOptions).then(handleResponse);
}

async function getById(id) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader()
  };
  return fetch(`${API_URL}/appointments/${id}`, requestOptions).then(handleResponse);
}

async function create(appointment) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment)
  };
  return fetch(`${API_URL}/appointments`, requestOptions).then(handleResponse);
}

async function update(id, appointment) {
  const requestOptions = {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment)
  };
  return fetch(`${API_URL}/appointments/${id}`, requestOptions).then(handleResponse);
}

async function _delete(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader()
  };
  return fetch(`${API_URL}/appointments/${id}`, requestOptions).then(handleResponse);
}

async function getUpcoming() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader()
  };
  return fetch(`${API_URL}/appointments/upcoming`, requestOptions).then(handleResponse);
}

async function getByDate(date) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader()
  };
  return fetch(`${API_URL}/appointments/date/${date}`, requestOptions).then(handleResponse);
}