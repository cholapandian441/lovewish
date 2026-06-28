export const environment = {
  production: false,
  // Same-origin path so the auth cookie is sent. The Angular dev-server proxy
  // (src/proxy.conf.json) forwards /api and /uploads to the backend on :3000.
  apiUrl: '/api',
};
