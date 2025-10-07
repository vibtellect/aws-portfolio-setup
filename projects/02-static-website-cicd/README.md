# 02 - Static Website with CI/CD Pipeline

**IaC Tool**: Terraform  
**Timeline**: 3-5 Tage  
**Complexity**: ⭐ (Beginner-Friendly)  
**Estimated Cost**: 0-1€/Monat (Free Tier optimiert)  

---

## 🎯 **Project Goals**

### **Technical Skills Demonstrated**
- ✅ **Infrastructure as Code** - Terraform with best practices
- ✅ **CI/CD Pipeline** - GitHub Actions automated deployment
- ✅ **Static Site Hosting** - S3 + CloudFront optimization
- ✅ **Domain Management** - Route 53 + SSL certificates
- ✅ **Performance** - Global CDN with caching strategies
- ✅ **Security** - HTTPS, security headers, OAI
- ✅ **Monitoring** - CloudWatch metrics and alerts
- ✅ **Cost Optimization** - Free Tier maximization

### **Business Value**
- Fast, scalable static website hosting
- Global content delivery
- Automated deployment workflow
- Production-ready security implementation

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │    │  GitHub Actions  │    │   S3 Bucket     │
│  (Source Code)  │───►│   (CI/CD)       │───►│ (Static Files)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Route 53      │    │      ACM         │    │   CloudFront    │
│   (DNS)         │◄──►│ (SSL Cert)       │◄──►│     (CDN)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Service Breakdown & Free Tier Usage**
- **S3**: Static website hosting (5GB storage free)
- **CloudFront**: Global CDN (1TB data transfer free)
- **Route 53**: DNS management (~0.50€/hosted zone)
- **ACM**: SSL certificate (kostenlos)
- **GitHub Actions**: CI/CD (2000 Minuten free für public repos)

**💰 Expected Monthly Cost**: 0.50€ (nur Route 53 hosted zone)

---

## 📁 **Project Structure**

```
02-static-website-cicd/
├── README.md                      # This file
├── infrastructure/                # Terraform Configuration
│   ├── main.tf                   # Main infrastructure
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # Stack outputs
│   ├── terraform.tfvars.example  # Example variables
│   ├── versions.tf               # Provider versions
│   └── modules/                  # Custom Terraform modules
│       ├── s3-website/           # S3 website module
│       ├── cloudfront/           # CloudFront distribution
│       └── route53/              # DNS configuration
├── website/                      # Static Website Content
│   ├── src/                     # Source files
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   ├── package.json             # Build dependencies (optional)
│   └── build/                   # Generated static files
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Main deployment workflow
│       ├── pr-preview.yml       # PR preview deployments
│       └── terraform-plan.yml   # Infrastructure planning
├── scripts/
│   ├── build.sh                # Website build script
│   ├── deploy.sh               # Deployment script
│   └── cleanup.sh              # Resource cleanup
└── docs/
    ├── TERRAFORM.md            # Terraform documentation
    ├── DEPLOYMENT.md           # Deployment guide
    └── MONITORING.md           # Monitoring setup
```

---

## 🛠️ **Implementation Roadmap**

### **Phase 1: Terraform Infrastructure**

#### **1.1 Terraform Project Setup**
```bash
# Learning Focus: Terraform basics and AWS provider
terraform init
terraform plan
terraform apply
```

**Key Learning Points:**
- Terraform state management (remote state with S3)
- Provider versioning and constraints
- Variable organization and validation
- Output values for integration

#### **1.2 S3 Website Hosting Module**
```hcl
# modules/s3-website/main.tf - Implementation focus areas:
# - S3 bucket with static website hosting enabled
# - Bucket policy for public read access
# - Index document and error page configuration
# - Versioning and lifecycle policies (optional)
```

**Terraform Resources to Explore:**
- `aws_s3_bucket`
- `aws_s3_bucket_website_configuration`
- `aws_s3_bucket_policy`
- `aws_s3_bucket_public_access_block`

#### **1.3 CloudFront Distribution Module**
```hcl
# modules/cloudfront/main.tf - Implementation focus areas:
# - CloudFront distribution with S3 origin
# - Origin Access Identity (OAI) for security
# - Custom cache behaviors
# - Security headers and HTTPS redirect
```

**Key Configuration Areas:**
- Cache behaviors for different content types
- Compression and HTTP/2 support
- Custom error pages (404 handling)
- Price class optimization (Free Tier focused)

#### **1.4 Route 53 & SSL Module**
```hcl
# modules/route53/main.tf - Implementation focus areas:
# - Hosted zone for custom domain
# - ACM certificate with DNS validation
# - A record pointing to CloudFront
# - CNAME record for www redirect (optional)
```

**SSL/Domain Learning Points:**
- ACM certificate validation process
- DNS record management
- CNAME vs A record differences
- Certificate renewal automation

### **Phase 2: Website Development**

#### **2.1 Static Site Generator Choice**
Choose one based on your learning goals:

**Option A: Plain HTML/CSS/JS**
```bash
# Simplest approach - great for Terraform focus
mkdir website/src
# Create: index.html, style.css, script.js
```

**Option B: Static Site Generator**
```bash
# Hugo (Go-based)
hugo new site website
# Or Jekyll (Ruby-based)
jekyll new website
# Or Gatsby/Next.js (JavaScript-based)
```

#### **2.2 Performance Optimization**
- Image optimization and compression
- CSS/JS minification
- Lazy loading implementation
- Core Web Vitals optimization

#### **2.3 SEO & Accessibility**
- Meta tags and Open Graph
- Structured data (JSON-LD)
- ARIA labels and semantic HTML
- Lighthouse score optimization

### **Phase 3: CI/CD Pipeline Implementation**

#### **3.1 GitHub Actions Workflow Design**
```yaml
# .github/workflows/deploy.yml - Key implementation areas:
name: Deploy Website

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  terraform-plan:   # Infrastructure changes preview
  build-website:    # Build static assets
  deploy-staging:   # PR preview deployments  
  deploy-prod:      # Production deployment
  cleanup:          # Remove old resources
```

#### **3.2 Terraform Automation**
```yaml
# Terraform workflow patterns to implement:
# - terraform plan on PR (with comment back to PR)
# - terraform apply on merge to main
# - State locking with DynamoDB
# - Plan artifacts storage
```

#### **3.3 Website Build Pipeline**
```yaml
# Build automation focus areas:
# - Static site generation
# - Asset optimization
# - Test execution (HTML validation, link checking)
# - S3 sync with efficient caching headers
```

#### **3.4 Deployment Strategies**
- Blue-green deployments (multiple S3 buckets)
- CloudFront cache invalidation strategies
- Rollback mechanisms
- Health checks and smoke tests

### **Phase 4: Monitoring & Optimization**

#### **4.1 CloudWatch Monitoring**
```hcl
# Terraform resources for monitoring:
resource "aws_cloudwatch_alarm" "high_error_rate" {
  # 4xx/5xx error rate monitoring
}

resource "aws_cloudwatch_alarm" "low_cache_hit_ratio" {
  # CloudFront cache performance
}
```

#### **4.2 Performance Monitoring**
- Real User Monitoring (RUM) setup
- Core Web Vitals tracking
- Page load time alerts
- CDN performance metrics

#### **4.3 Cost Monitoring Integration**
```bash
# Cost tracking automation
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🧪 **Testing Strategy**

### **Infrastructure Testing**
- **Terraform Validation**: `terraform validate` and `terraform plan`
- **Policy Testing**: AWS Config rules for compliance
- **Security Testing**: Checkov/tfsec for Terraform scanning
- **End-to-End**: Terratest for infrastructure testing

### **Website Testing**
- **HTML Validation**: W3C validator integration
- **Link Checking**: Automated broken link detection
- **Performance**: Lighthouse CI integration
- **Accessibility**: axe-core automated testing

### **Deployment Testing**
- **Smoke Tests**: Basic site functionality after deployment
- **Visual Regression**: Percy or similar for visual testing
- **Load Testing**: Basic traffic simulation

---

## 📊 **Performance Optimization**

### **CloudFront Configuration**
```hcl
# Key performance optimizations to implement:
cache_behavior {
  # Static assets: long TTL (1 year)
  # HTML files: short TTL (1 hour)
  # API responses: no cache or short TTL
}

# Compression for all text-based content
compress = true

# HTTP/2 support (automatic with CloudFront)
http_version = "http2"
```

### **S3 Optimization**
- Optimal S3 storage class selection
- Request patterns optimization
- Transfer acceleration (if needed)

### **Frontend Optimization**
- Critical CSS inlining
- Resource preloading strategies
- Service worker implementation (PWA)
- Image format optimization (WebP, AVIF)

---

## 🔐 **Security Implementation**

### **S3 Security**
```hcl
# Security best practices to implement:
# - Block all public access except through OAI
# - Bucket encryption at rest
# - Access logging for audit trail
# - MFA delete protection
```

### **CloudFront Security**
```hcl
# Security headers to implement:
response_headers_policy {
  # Strict-Transport-Security
  # Content-Security-Policy  
  # X-Frame-Options
  # X-Content-Type-Options
}
```

### **DNS Security**
- DNSSEC enablement (Route 53)
- CAA records for certificate authority authorization
- SPF/DKIM records (if email involved)

---

## 🎓 **Learning Objectives & Outcomes**

### **Terraform Mastery**
1. **Module Design**: Reusable infrastructure components
2. **State Management**: Remote state and locking
3. **Best Practices**: Code organization and validation
4. **Testing**: Infrastructure testing strategies

### **DevOps Skills**
1. **CI/CD Design**: Multi-stage deployment pipelines
2. **Automation**: Infrastructure and application deployment
3. **Monitoring**: Performance and cost tracking
4. **Security**: Automated security scanning

### **AWS Services Deep Dive**
1. **S3**: Static hosting and optimization
2. **CloudFront**: CDN configuration and caching
3. **Route 53**: DNS management and health checks
4. **ACM**: SSL certificate management

### **Portfolio Value**
- **For Startups**: Cost-effective static hosting solution
- **For Enterprises**: Scalable content delivery architecture
- **For DevOps Roles**: Infrastructure automation expertise
- **For Frontend Roles**: Modern deployment strategies

---

## 🚀 **Getting Started**

### **Prerequisites**
```bash
# Install required tools
terraform --version  # >= 1.0
aws --version        # >= 2.0
git --version

# Configure AWS credentials
aws configure
```

### **Quick Start Options**

#### **Option A: Terraform First (Recommended for IaC learners)**
```bash
cd infrastructure
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply
```

#### **Option B: Website First (Recommended for frontend focus)**
```bash
cd website
# Set up your preferred static site generator
# Test locally, then deploy infrastructure
```

### **Development Workflow**
```bash
# 1. Make changes locally
# 2. Test infrastructure changes
terraform plan
# 3. Commit and push
git add . && git commit -m "feat: add new feature"
git push origin feature-branch
# 4. Create PR (triggers automated testing)
# 5. Merge to main (triggers deployment)
```

---

## 🤔 **Extension Ideas**

Once you've mastered the basics:

### **Advanced Features**
- **Multi-environment**: Staging/prod environments with Terraform workspaces
- **A/B Testing**: CloudFront distributions for testing
- **International**: Multi-region deployments for global audience
- **API Integration**: Serverless backend for contact forms
- **Analytics**: Google Analytics/AWS CloudWatch RUM
- **CMS Integration**: Headless CMS (Strapi, Contentful) integration

### **Advanced DevOps**
- **GitOps**: ArgoCD or Flux for deployment management
- **Secrets**: AWS Secrets Manager integration
- **Compliance**: AWS Config and Security Hub integration
- **Backup**: Cross-region backup strategies

---

## 📝 **Documentation Strategy**

Document your learning journey:
1. **Architecture Decisions**: Why you chose specific configurations
2. **Cost Analysis**: Actual vs expected costs
3. **Performance Metrics**: Before/after optimization results
4. **Troubleshooting**: Problems encountered and solutions
5. **Lessons Learned**: What you'd do differently next time

---

**💡 Perfect Starting Project!** This project gives you a solid foundation in Terraform, AWS fundamentals, and CI/CD while creating something you can actually use (your portfolio site!). 

**Ready to start?** Choose your focus area (Infrastructure or Frontend) and dive in!