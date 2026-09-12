import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const uploadFile = async (file, windowSeconds) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('window_seconds', windowSeconds);
  
  const response = await api.post('/upload', formData, {
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

export default api;
