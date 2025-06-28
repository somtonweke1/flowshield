# FlowShield Deployment Guide

This guide covers deploying FlowShield to various cloud platforms and environments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- Cloud platform accounts (AWS, Heroku, Railway, Vercel, etc.)

### Local Development with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FlowShield
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

## ☁️ Cloud Deployment Options

### 1. Heroku Deployment

#### Prerequisites
- Heroku CLI installed
- Heroku account

#### Steps
1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create Heroku app**
   ```bash
   heroku create your-flowshield-app
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secret-jwt-key
   heroku config:set DATABASE_URL=your-postgres-url
   ```

4. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Run database migrations**
   ```bash
   heroku run npx prisma migrate deploy
   ```

### 2. Railway Deployment

#### Prerequisites
- Railway account
- Railway CLI (optional)

#### Steps
1. **Connect your GitHub repository**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your FlowShield repository

2. **Configure environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   DATABASE_URL=your-postgres-url
   PORT=3000
   ```

3. **Add PostgreSQL service**
   - In Railway dashboard, add PostgreSQL service
   - Link it to your API service

4. **Deploy**
   - Railway automatically deploys on git push
   - Or use Railway CLI: `railway up`

### 3. Vercel Deployment (Frontend)

#### Prerequisites
- Vercel account
- Vercel CLI (optional)

#### Steps
1. **Deploy frontend**
   ```bash
   cd client
   vercel --prod
   ```

2. **Configure environment variables**
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter your API URL
   ```

3. **Set up custom domain (optional)**
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain

### 4. AWS Deployment

#### Prerequisites
- AWS account
- AWS CLI configured
- Terraform installed

#### Steps
1. **Configure AWS credentials**
   ```bash
   aws configure
   ```

2. **Initialize Terraform**
   ```bash
   cd deploy/terraform
   terraform init
   ```

3. **Create terraform.tfvars**
   ```bash
   aws_region = "us-east-1"
   db_password = "your-secure-password"
   jwt_secret = "your-super-secret-jwt-key"
   ecr_repository_url = "your-ecr-repo-url"
   ```

4. **Deploy infrastructure**
   ```bash
   terraform plan
   terraform apply
   ```

5. **Build and push Docker images**
   ```bash
   # Build API image
   docker build -t flowshield-api .
   docker tag flowshield-api:latest your-ecr-repo-url:latest
   docker push your-ecr-repo-url:latest

   # Build client image
   cd client
   docker build -t flowshield-client .
   docker tag flowshield-client:latest your-ecr-repo-url-client:latest
   docker push your-ecr-repo-url-client:latest
   ```

### 5. Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (GKE, EKS, AKS, or local)
- kubectl configured
- Helm (optional)

#### Steps
1. **Create namespace**
   ```bash
   kubectl create namespace flowshield
   ```

2. **Create secrets**
   ```bash
   kubectl create secret generic flowshield-secrets \
     --from-literal=database-url="your-db-url" \
     --from-literal=jwt-secret="your-jwt-secret" \
     --from-literal=redis-url="your-redis-url" \
     -n flowshield
   ```

3. **Deploy application**
   ```bash
   kubectl apply -f deploy/kubernetes/ -n flowshield
   ```

4. **Check deployment status**
   ```bash
   kubectl get pods -n flowshield
   kubectl get services -n flowshield
   ```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Redis (optional, for caching)
REDIS_URL=redis://host:port

# Application
NODE_ENV=production
PORT=3000

# Frontend
REACT_APP_API_URL=http://your-api-url
```

### Optional Environment Variables

```bash
# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Monitoring and Logging

### Health Checks
- API Health: `GET /health`
- Database Health: `GET /health/db`
- Redis Health: `GET /health/redis`

### Logging
- Application logs are written to stdout/stderr
- Use your cloud platform's logging service
- For AWS: CloudWatch Logs
- For GCP: Cloud Logging
- For Azure: Application Insights

### Metrics
- Request count and response times
- Database connection pool status
- Memory and CPU usage
- Custom business metrics

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Use HTTPS everywhere
- [ ] Set secure JWT secret
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] Network security groups/firewalls
- [ ] SSL/TLS certificates
- [ ] Input validation and sanitization

### SSL/TLS Configuration
```nginx
# Nginx SSL configuration
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
```

## 🚀 CI/CD Pipeline

### GitHub Actions
The repository includes GitHub Actions workflows for:
- Automated testing
- Docker image building
- Multi-platform deployment
- Security scanning

### Manual Deployment Commands
```bash
# Build and test
npm ci
npm test
npm run build

# Docker build
docker build -t flowshield-api .
docker build -t flowshield-client ./client

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Scaling

### Horizontal Scaling
- Use load balancers
- Multiple application instances
- Database read replicas
- Redis clustering

### Vertical Scaling
- Increase CPU/memory allocation
- Optimize database queries
- Use connection pooling
- Implement caching

## 🔄 Backup and Recovery

### Database Backups
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# Automated backups (cron job)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/backup-$(date +%Y%m%d).sql.gz
```

### Disaster Recovery
- Regular automated backups
- Cross-region replication
- Point-in-time recovery
- Backup testing procedures

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection issues**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Check firewall rules

3. **CORS errors**
   - Configure CORS_ORIGIN properly
   - Check frontend API URL

4. **JWT token issues**
   - Verify JWT_SECRET is set
   - Check token expiration

### Debug Commands
```bash
# Check application logs
docker-compose logs api

# Check database connectivity
docker-compose exec api npx prisma db push

# Health check
curl http://localhost:3000/health

# Check environment variables
docker-compose exec api env | grep -E "(DATABASE|JWT|REDIS)"
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review cloud platform documentation
3. Check application logs
4. Verify environment configuration
5. Test locally first

## 🔄 Updates and Maintenance

### Updating the Application
1. Pull latest changes
2. Update dependencies
3. Run database migrations
4. Deploy new version
5. Monitor for issues

### Maintenance Window
- Schedule during low-traffic periods
- Use blue-green deployment
- Have rollback plan ready
- Monitor metrics during update

---

For more detailed information, refer to the platform-specific documentation and the application's README file. 