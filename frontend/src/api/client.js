import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

const api = axios.create({
  baseURL: apiBase,
});

export const uploadFile = async (file, windowSeconds) => {
  const formData = new FormData();
  formData.append('file', file);
  // window_seconds must be a QUERY PARAMETER (not form field) per backend route definition
  const response = await api.post(`/upload?window_seconds=${windowSeconds}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const listJobs = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export const getJob = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const getTimeline = async (jobId) => {
  const response = await api.get(`/timelines/${jobId}`);
  return response.data;
};

export const getState = async (stateId) => {
  const response = await api.get(`/states/${stateId}`);
  return response.data;
};

export const getPrediction = async (jobId, sequenceLength = 8, forecastSteps = 5) => {
  const response = await api.get(
    `/predict/${jobId}?sequence_length=${sequenceLength}&forecast_steps=${forecastSteps}`
  );
  return response.data;
};

export const runBenchmark = async (jobId) => {
  const response = await api.post(`/benchmark/${jobId}`);
  return response.data;
};

export const getStages = async () => {
  const response = await api.get('/stages');
  return response.data;
};

export default api;
