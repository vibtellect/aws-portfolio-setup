# 01 - Serverless Todo App

**IaC Tool**: AWS CDK (TypeScript)  
**Timeline**: 1-2 Wochen  
**Complexity**: ⭐⭐ (Intermediate)  
**Estimated Cost**: 0-2€/Monat (Free Tier optimiert)  

---

## 🎯 **Project Goals**

### **Technical Skills Demonstrated**
- ✅ **Serverless Architecture** - Event-driven, pay-per-use
- ✅ **Infrastructure as Code** - AWS CDK with TypeScript
- ✅ **Full-Stack Development** - React Frontend + Python Backend
- ✅ **Authentication & Security** - Cognito User Pools + JWT
- ✅ **Database Design** - DynamoDB NoSQL patterns
- ✅ **API Design** - REST API with proper error handling
- ✅ **Frontend Deployment** - S3 + CloudFront static hosting
- ✅ **Cost Optimization** - Free Tier focus, monitoring included

### **Business Value**
- Real-world CRUD application pattern
- Modern serverless architecture
- Production-ready security implementation
- Scalable design patterns

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │    API Gateway   │    │     Lambda      │
│   (React SPA)   │◄──►│  (REST Endpoint) │◄──►│  (Python CRUD)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   S3 Bucket     │    │     Cognito      │    │    DynamoDB     │
│  (Static Files) │    │   (User Auth)    │    │   (Todo Data)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Service Breakdown & Free Tier Usage**
- **S3**: Static React app hosting (5GB free)
- **CloudFront**: Global CDN (1TB transfer free)
- **API Gateway**: REST API endpoints (1M requests free)
- **Lambda**: Business logic (1M invocations free)
- **DynamoDB**: NoSQL database (25GB + 25 RCU/WCU free)
- **Cognito**: User authentication (50K MAU free)

**💰 Expected Monthly Cost**: 0€ (if under Free Tier limits)

---

## 📁 **Project Structure**

```
01-serverless-todo-app/
├── README.md                    # This file
├── infrastructure/              # CDK Infrastructure Code
│   ├── app.ts                  # CDK App entry point
│   ├── stacks/
│   │   ├── todo-backend-stack.ts       # API + Lambda + DynamoDB
│   │   ├── todo-frontend-stack.ts      # S3 + CloudFront
│   │   └── todo-auth-stack.ts          # Cognito User Pool
│   ├── package.json            # CDK dependencies
│   └── cdk.json               # CDK configuration
├── backend/                    # Python Lambda Functions
│   ├── src/
│   │   ├── handlers/           # Lambda handlers
│   │   │   ├── create_todo.py
│   │   │   ├── get_todos.py
│   │   │   ├── update_todo.py
│   │   │   └── delete_todo.py
│   │   ├── models/            # Data models
│   │   │   └── todo.py
│   │   ├── utils/             # Helper functions
│   │   │   ├── auth.py        # JWT validation
│   │   │   ├── response.py    # API responses
│   │   │   └── dynamodb.py    # Database helpers
│   │   └── requirements.txt   # Python dependencies
│   └── tests/                 # Unit tests
├── frontend/                  # React Application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API calls
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── public/
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD Pipeline
└── docs/
    ├── ARCHITECTURE.md        # Technical deep-dive
    ├── DEPLOYMENT.md          # Deployment guide
    └── API.md                # API documentation
```

---

## 🛠️ **Implementation Roadmap**

### **Phase 1: Infrastructure Setup (CDK)**

#### **1.1 CDK Bootstrap & Project Init**
```bash
# Learning Focus: CDK basics, project structure
npm install -g aws-cdk
mkdir infrastructure && cd infrastructure
cdk init app --language typescript
```

**Key Learning Points:**
- CDK project structure verstehen
- TypeScript CDK patterns
- Stack organization strategies

#### **1.2 Auth Stack (Cognito)**
```typescript
// todo-auth-stack.ts - Implementation guidance
// - UserPool with email verification
// - UserPoolClient for web app
// - Identity Pool for AWS credentials (optional)
// - Pre-signup triggers (optional)
```

**CDK Constructs to Explore:**
- `@aws-cdk/aws-cognito.UserPool`
- Email verification configuration
- Password policies
- Custom attributes

#### **1.3 Backend Stack (API + Lambda + DynamoDB)**
```typescript
// todo-backend-stack.ts - Implementation guidance
// - DynamoDB table with partition key 'userId', sort key 'todoId'
// - Lambda functions for CRUD operations
// - API Gateway with Cognito authorizer
// - Proper CORS configuration
```

**CDK Constructs to Explore:**
- `@aws-cdk/aws-dynamodb.Table`
- `@aws-cdk/aws-lambda.Function`
- `@aws-cdk/aws-apigateway.RestApi`
- `@aws-cdk/aws-apigateway.CognitoUserPoolsAuthorizer`

#### **1.4 Frontend Stack (S3 + CloudFront)**
```typescript
// todo-frontend-stack.ts - Implementation guidance
// - S3 bucket with static website hosting
// - CloudFront distribution with S3 origin
// - OAI (Origin Access Identity) for security
// - Custom domain (optional)
```

### **Phase 2: Backend Development (Python)**

#### **2.1 Lambda Function Architecture**
```python
# Learning Focus: Serverless Python patterns
# - Lambda handler patterns
# - Environment variables management
# - Error handling and logging
# - DynamoDB SDK usage
```

**Key Implementation Areas:**
- JWT token validation with Cognito
- DynamoDB single-table design patterns
- Proper HTTP status codes and error responses
- Input validation and sanitization

#### **2.2 Database Design**
```
DynamoDB Table: "TodoApp"
Primary Key: userId (Partition Key) + todoId (Sort Key)
Attributes: title, description, completed, createdAt, updatedAt

Access Patterns:
- Get all todos for user: Query(userId)
- Get specific todo: GetItem(userId, todoId) 
- Create todo: PutItem with auto-generated todoId
- Update todo: UpdateItem(userId, todoId)
- Delete todo: DeleteItem(userId, todoId)
```

#### **2.3 API Endpoints**
```
GET    /todos              # Get all todos for authenticated user
POST   /todos              # Create new todo
GET    /todos/{todoId}     # Get specific todo
PUT    /todos/{todoId}     # Update todo
DELETE /todos/{todoId}     # Delete todo
```

### **Phase 3: Frontend Development (React)**

#### **3.1 React App Setup**
```bash
# Learning Focus: Modern React patterns
npx create-react-app frontend --template typescript
# Add libraries: @aws-amplify/auth, axios, react-router
```

**Key Implementation Areas:**
- AWS Amplify Auth for Cognito integration
- Custom hooks for API calls
- State management (useState/useReducer or Context)
- TypeScript interfaces for API responses

#### **3.2 Components Architecture**
```
App.tsx
├── AuthProvider (Context)
├── PrivateRoute (Auth guard)
├── LoginPage
├── TodoDashboard
│   ├── TodoList
│   │   └── TodoItem
│   ├── TodoForm (Create/Edit)
│   └── TodoFilters
└── ProfilePage
```

#### **3.3 Authentication Flow**
```javascript
// Learning Focus: Cognito integration patterns
// - Sign up with email verification
// - Sign in with JWT handling
// - Automatic token refresh
// - Protected routes implementation
```

### **Phase 4: Deployment & CI/CD**

#### **4.1 CDK Deployment**
```bash
# Learning Focus: CDK deployment strategies
cdk bootstrap
cdk diff
cdk deploy --all
```

#### **4.2 GitHub Actions Setup**
```yaml
# .github/workflows/deploy.yml - Implementation areas:
# - Build and test all components
# - CDK diff for infrastructure changes
# - Automated deployment to AWS
# - Cost monitoring integration
```

---

## 🧪 **Testing Strategy**

### **Backend Testing**
- **Unit Tests**: Lambda functions with mocked DynamoDB
- **Integration Tests**: API endpoints with test database
- **Load Testing**: API performance under load

### **Frontend Testing**
- **Component Tests**: React Testing Library
- **E2E Tests**: Cypress for user flows
- **Accessibility Tests**: WAVE/axe integration

### **Infrastructure Testing**
- **CDK Assertions**: Infrastructure unit tests
- **Security Tests**: IAM policy validation
- **Cost Tests**: Validate Free Tier usage

---

## 📊 **Monitoring & Observability**

### **CloudWatch Integration**
- Lambda function metrics and logs
- DynamoDB capacity utilization
- API Gateway request/error rates
- Custom business metrics (todos created/completed)

### **Cost Monitoring**
- Daily cost alerts
- Free Tier usage tracking
- Cost attribution by service

### **Performance Monitoring**
- Lambda cold start times
- API response times
- Frontend Core Web Vitals

---

## 🔐 **Security Considerations**

### **Authentication & Authorization**
- Cognito User Pools for user management
- JWT token validation in Lambda
- API Gateway with Cognito authorizer
- Least privilege IAM roles

### **Data Protection**
- DynamoDB encryption at rest
- HTTPS everywhere (API Gateway + CloudFront)
- Input validation and sanitization
- XSS protection in React app

### **Network Security**
- VPC (optional for enhanced security)
- Security Groups for Lambda
- CloudFront security headers

---

## 🎓 **Learning Objectives & Outcomes**

### **What You'll Master**
1. **CDK Mastery**: Complex multi-stack deployments
2. **Serverless Patterns**: Event-driven architecture design
3. **NoSQL Design**: DynamoDB single-table patterns
4. **Modern Auth**: Cognito + JWT implementation
5. **React Best Practices**: Hooks, TypeScript, testing
6. **DevOps**: CI/CD with automated testing and deployment
7. **Cost Optimization**: Free Tier maximization strategies

### **Portfolio Value**
- **For Startups**: Demonstrates cost-effective scaling
- **For Enterprises**: Shows security and compliance awareness  
- **For DevOps Roles**: Infrastructure automation expertise
- **For Full-Stack Roles**: End-to-end development skills

---

## 🚀 **Getting Started**

1. **Pre-requisites Setup**
   ```bash
   npm install -g aws-cdk
   aws configure  # Ensure your AWS credentials are set
   ```

2. **Choose Your Starting Point**
   - **CDK Beginner**: Start with simple single-stack approach
   - **Serverless Experience**: Jump to multi-stack architecture
   - **React Focus**: Begin with frontend and mock API

3. **Development Workflow**
   ```bash
   # Infrastructure first approach
   cd infrastructure
   npm install
   cdk bootstrap
   cdk deploy
   
   # Or application first approach
   cd backend && python -m pytest
   cd frontend && npm test
   ```

4. **Documentation as You Go**
   - Document architecture decisions
   - Screenshot key features for portfolio
   - Write deployment runbook

---

## 🤔 **Extension Ideas**

Once you've mastered the basics, consider these enhancements:
- **Real-time Updates**: WebSocket API for collaborative todos
- **File Attachments**: S3 integration with pre-signed URLs
- **Notifications**: SNS/SES for todo reminders
- **Analytics**: Kinesis for user behavior tracking
- **Multi-tenancy**: Organization-based todo management
- **Mobile App**: React Native with same backend

---

**💡 Ready to Start?** Pick your preferred starting point (Infrastructure or Frontend-first) and dive in! Remember: the goal is learning by building, not perfection on first try.