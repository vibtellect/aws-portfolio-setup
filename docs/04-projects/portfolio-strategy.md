# Portfolio-Strategie: Full-Stack + DevOps Focus (Budget: 10€/Monat)

## 🎯 Strategische Ausrichtung

**Zielrolle**: Full-Stack Developer + DevOps Engineer  
**Budget**: Max. 10€/Monat  
**Zeitrahmen**: 3 Monate  
**Technologie-Stack**: Python, Go, Java, Node.js, Angular/TypeScript

## 💰 Budget-Aufschlüsselung & Services

### Monatliche Kostenschätzung (EU-Central-1)
```
├── Lambda (Always Free): 1M requests/Monat = 0€
├── API Gateway: 1M calls = ~3.50€
├── DynamoDB: 25GB Storage = 0€ (Free Tier)
├── S3: 5GB Storage + Requests = ~0.50€
├── CloudFront: 50GB Transfer = 0€ (Free Tier)
├── ECS Fargate: 20h/Monat = ~2€
├── Route 53: 1 Hosted Zone = ~0.50€
├── ECR: 500MB = 0€ (Free Tier)
├── CloudWatch Logs: 5GB = ~2.50€
├── CloudFormation/CDK: 0€
├── Application Load Balancer: 20h/Monat = ~1€
└── Reserve für Tests: ~0.50€
                               ─────────
                         TOTAL: ~8.50€/Monat
```

### 🚫 **Services zu VERMEIDEN** (Kostenfallen)
- ❌ AWS Glue (wie gewünscht)
- ❌ ElastiSearch/OpenSearch (teuer)
- ❌ RDS (außer Free Tier t3.micro)
- ❌ Redshift, EMR
- ❌ SageMaker Training Jobs
- ❌ VPC Endpoints (außer wenn unbedingt nötig)
- ❌ NAT Gateways (verwende NAT Instances bei Bedarf)

## 🏗️ Projekt-Portfolio (3 Projekte in 3 Monaten)

### **Monat 1: Serverless Multi-Language API**
**Ziel**: Verschiedene Sprachen in einer serverless Architektur zeigen

**Tech-Stack**:
- **Frontend**: Angular + TypeScript (S3 + CloudFront)
- **Backend**: 
  - Python Lambda (Data Processing)
  - Go Lambda (High Performance Operations)
  - Node.js Lambda (API Gateway Integration)
- **Database**: DynamoDB
- **Infrastructure**: CDK TypeScript
- **CI/CD**: GitHub Actions

**Features**:
- Multi-language REST API
- JWT Authentication
- File Upload zu S3
- Real-time WebSocket (API Gateway v2)
- CloudWatch Monitoring Dashboard

**Cost**: ~3€/Monat

### **Monat 2: Containerized Microservices**
**Ziel**: Container-Orchestrierung und Microservices-Architektur

**Tech-Stack**:
- **Frontend**: Angular SPA
- **Backend Microservices**:
  - Java Spring Boot (User Service)
  - Go Gin (Gateway Service)
  - Python FastAPI (Data Service)
- **Infrastructure**: Terraform
- **Container**: ECS Fargate + ECR
- **Load Balancer**: Application Load Balancer
- **Service Discovery**: ECS Service Discovery

**Features**:
- Container-basierte Microservices
- Auto-scaling (basierend auf CPU/Memory)
- Health Checks & Circuit Breaker
- Distributed Tracing
- Blue/Green Deployment

**Cost**: ~4€/Monat (nur während Tests)

### **Monat 3: Full-Stack PWA + DevOps Showcase**
**Ziel**: Progressive Web App mit kompletter DevOps-Pipeline

**Tech-Stack**:
- **Frontend**: Angular PWA (Service Worker, Offline-Support)
- **Backend**: Node.js + Express auf ECS Fargate
- **Database**: DynamoDB + S3
- **Infrastructure**: CDK + Terraform Mix
- **Monitoring**: CloudWatch + X-Ray

**Features**:
- Progressive Web App
- Multi-stage Deployment Pipeline
- Infrastructure as Code Vergleich (CDK vs Terraform)
- Automated Testing (Unit, Integration, E2E)
- Security Scanning in Pipeline
- Cost Optimization Dashboard

**Cost**: ~2€/Monat (statische Inhalte)

## 🚀 Deployment-Strategien für Kostenoptimierung

### **1. On-Demand Testing**
```bash
# Services nur für Tests starten
./scripts/start-demo-environment.sh

# Nach Demo automatisch herunterfahren (nach 2h)
./scripts/auto-shutdown.sh
```

### **2. Schedule-basierte Infrastruktur**
```yaml
# GitHub Actions Workflow
schedule:
  - cron: '0 9 * * 1-5'  # Mo-Fr 9:00 starten
  - cron: '0 18 * * 1-5' # Mo-Fr 18:00 stoppen
```

### **3. Kostenwarnungen & Limits**
```json
{
  "budget_alerts": {
    "50%": "5€ erreicht - Warnung per E-Mail",
    "80%": "8€ erreicht - Stoppe alle ECS Services",
    "100%": "10€ erreicht - Vollständiger Shutdown"
  }
}
```

## 📊 Portfolio-Präsentation

### **GitHub Repository Struktur**
```
vitalij-aws-portfolio/
├── 01-serverless-multi-lang/     # Projekt 1 (Python/Go/Node.js)
├── 02-microservices-containers/  # Projekt 2 (Java/Go/Python)  
├── 03-pwa-devops-showcase/       # Projekt 3 (Angular PWA)
├── shared-infrastructure/        # Gemeinsame IaC Module
├── cost-optimization/            # Budget Management Tools
└── docs/                        # Dokumentation & Diagramme
```

### **Live-Demo URLs** (für Bewerbungen)
```
https://api-demo.dein-portfolio.de     # Multi-Language API
https://micro.dein-portfolio.de        # Microservices Demo  
https://pwa.dein-portfolio.de          # PWA Showcase
https://docs.dein-portfolio.de         # Technische Dokumentation
```

## 🛠️ Development Workflow (pro Projekt: 4 Wochen)

### **Woche 1**: Setup & Infrastructure
- Account Setup & IAM Policies
- Infrastructure as Code (Terraform/CDK)
- CI/CD Pipeline Grundgerüst
- Domain & SSL Zertifikate

### **Woche 2**: Backend Development
- API Entwicklung in verschiedenen Sprachen
- Datenbank Schema & Migration
- Authentication & Authorization
- Unit Tests

### **Woche 3**: Frontend & Integration
- Frontend Entwicklung (Angular)
- API Integration
- E2E Tests
- Performance Optimization

### **Woche 4**: Deployment & Documentation
- Production Deployment
- Monitoring Setup
- Dokumentation schreiben
- Demo-Präsentation vorbereiten

## 🔍 Monitoring & Cost Control

### **Daily Cost Tracking**
```bash
# Automatisches Daily Cost Report
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-02 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### **Automated Shutdown**
```python
# Lambda Function für Auto-Shutdown
def lambda_handler(event, context):
    if current_month_cost() > BUDGET_LIMIT * 0.8:
        stop_all_ecs_services()
        disable_api_gateways()
        send_budget_alert()
```

## 🎯 Portfolio-Highlights für Bewerbungen

1. **Multi-Language Expertise**: Python, Go, Java, Node.js in einem Projekt
2. **Infrastructure as Code**: Terraform + CDK Vergleich
3. **Container Orchestrierung**: ECS Fargate mit Service Discovery
4. **Cost Optimization**: Budget-bewusste Cloud-Architektur
5. **DevOps Excellence**: Vollautomatische CI/CD Pipelines
6. **Modern Frontend**: Angular PWA mit Offline-Funktionalität
7. **Observability**: CloudWatch + X-Ray Monitoring
8. **Security**: IAM Best Practices, Least Privilege Access

---

**Nächster Schritt**: Account Security Setup durchführen und mit Projekt 1 beginnen!