import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Gateway routing to microservices
app.use('/api/reviews', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
  pathRewrite: { '^/api/reviews': '' }
}));

app.use('/api/booking', createProxyMiddleware({
  target: 'http://localhost:8002',
  changeOrigin: true,
  pathRewrite: { '^/api/booking': '' }
}));

app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:8003',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' }
}));

app.use('/api/security', createProxyMiddleware({
  target: 'http://localhost:8004',
  changeOrigin: true,
  pathRewrite: { '^/api/security': '' }
}));

app.use('/api/rate-limit', createProxyMiddleware({
  target: 'http://localhost:8005',
  changeOrigin: true,
  pathRewrite: { '^/api/rate-limit': '' }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Gateway running',
    services: {
      reviews: 'http://localhost:8001',
      booking: 'http://localhost:8002',
      auth: 'http://localhost:8003',
      security: 'http://localhost:8004',
      rateLimit: 'http://localhost:8005'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gateway running on port ${PORT}`);
  console.log(`🔗 Routing to microservices on ports 8001-8005`);
});