# Production Deployment Guide

## Environment Setup

### 1. Environment Variables

Create `.env.production`:

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_SENTRY_DSN=https://your-sentry-dsn@sentry.io/xxx
REACT_APP_ANALYTICS_ID=your-ga-id
REACT_APP_VERSION=1.0.0
NODE_ENV=production
```

### 2. Build Optimization

```bash
# Build for production
npm run build

# Analyze bundle size
npm install -g webpack-bundle-analyzer
npm run build -- --analyze
```

### 3. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t log-analyzer .
docker run -p 3000:3000 log-analyzer
```

### 4. CI/CD Pipeline (.github/workflows/deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to production
        run: npm run deploy
```

### 5. Performance Optimization

```bash
# Enable gzip compression
npm install compression

# Add HTTP/2 push headers
npm install http2-push-manifest

# Implement CDN caching
# Add Cache-Control headers in server
```

### 6. Monitoring & Analytics

#### Sentry Setup

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Google Analytics

```typescript
import ReactGA from 'react-ga4'

ReactGA.initialize(process.env.REACT_APP_ANALYTICS_ID)
```

### 7. Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Add security headers (CSP, X-Frame-Options, etc.)
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Validate all inputs
- [ ] Sanitize outputs
- [ ] Use secure cookies (HttpOnly, Secure, SameSite)
- [ ] Regular dependency updates
- [ ] Security scanning with Snyk

### 8. Health Checks

Add endpoint `/api/health`:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345,
  "timestamp": "2024-01-27T10:30:00Z"
}
```

### 9. Backup & Recovery

- [ ] Database backups (if applicable)
- [ ] File storage backups
- [ ] Configuration backups
- [ ] Disaster recovery plan
- [ ] SLA documentation

### 10. Logging

Use structured logging:

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

## Maintenance

### Regular Tasks

- [ ] Monitor performance metrics
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Security audits quarterly
- [ ] Capacity planning reviews
- [ ] User feedback analysis
- [ ] Documentation updates

### Scaling Strategies

1. **Horizontal Scaling**: Add more app servers behind load balancer
2. **Vertical Scaling**: Increase server resources
3. **Caching**: Implement Redis for session/data caching
4. **Database Optimization**: Index frequently queried fields
5. **CDN**: Distribute static assets globally

## Support & Incidents

- [ ] Create incident response plan
- [ ] Set up on-call rotation
- [ ] Create runbooks for common issues
- [ ] Establish communication channels
- [ ] Post-mortem process
- [ ] Knowledge base/FAQ
- [ ] Support contact information
