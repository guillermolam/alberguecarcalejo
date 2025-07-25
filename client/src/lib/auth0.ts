// Mock Auth0 service for WASM architecture
export const auth0Service = {
  isAuthenticated: () => false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  getUser: () => null,
};