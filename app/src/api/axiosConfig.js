import axios from 'axios';

const apiClient = axios.create({
  baseURL: `http://myspace.rhishav.com`,
});

export default apiClient;