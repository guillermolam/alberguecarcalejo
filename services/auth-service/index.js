import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8003;

app.use(cors());
app.use(express.json());

// Auth endpoints
app.post('/login', (req, res) => {
  console.log('🔐 Auth service: /login called');
  res.json({ 
    success: true, 
    token: 'mock-jwt-token',
    user: { id: 1, role: 'admin' }
  });
});

app.post('/logout', (req, res) => {
  console.log('🚪 Auth service: /logout called');
  res.json({ success: true });
});

app.get('/verify', (req, res) => {
  console.log('✅ Auth service: /verify called');
  res.json({ valid: true, user: { id: 1, role: 'admin' } });
});

app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'ok', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Auth service running on port ${PORT}`);
});