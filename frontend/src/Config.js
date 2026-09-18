// const browserApiBaseUrl = typeof window !== 'undefined'
//   ? 'http://192.168.1.4:3300/api'
//   : 'http://localhost:3300/api';

const browserApiBaseUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3333/api`
  : 'http://localhost:3333/api';
const CONFIG = {
  // Set REACT_APP_API_BASE_URL when the API is hosted on another machine/domain.
  // Otherwise use the device serving the frontend, which also works on a LAN phone.
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || browserApiBaseUrl,
  APP_NAME: 'ParkFlow',
  VERSION: '1.0.0',
}

export default CONFIG;
