import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('driverToken')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

export default api
