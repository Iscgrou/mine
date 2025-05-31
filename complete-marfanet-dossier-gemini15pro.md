# COMPLETE MARFANET BLUEPRINT & CURRENT STATE DOSSIER
## For Gemini 1.5 Pro Latest - Project Genesis Reborn

### CRITICAL MANDATE
**90% AI-DRIVEN DEVELOPMENT REQUIREMENT**: Gemini 1.5 Pro Latest must provide comprehensive code solutions, security implementations, and architectural decisions. Manual implementation limited to 10% maximum.

### EXECUTIVE SUMMARY
MarFanet is a Persian-language AI-powered CRM platform for Iranian mobile phone stores serving as V2Ray proxy reseller representatives. The system requires complete reconstruction with legacy threat eradication and modern security implementation.

### CURRENT AUTHENTICATION STATUS
**WORKING CREDENTIALS:**
- Admin: `mgr/m867945`
- CRM: `crm/c867945`
- System: Username/password authentication active
- Session management: Express-session with secure configuration

### LEGACY THREATS REQUIRING IMMEDIATE ERADICATION

#### 1. Grok Integration Remnants
**FILES REQUIRING CLEANUP:**
- `client/src/pages/settings-fixed.tsx` - Lines 152-170 (Grok variable declarations)
- `client/src/pages/settings-fixed.tsx` - Lines 243-261 (Grok case section)
- `client/src/pages/settings-fixed.tsx` - Lines 162 (Grok tab in navigation)
- `server/final-v2ray-test.ts` - Lines 20-45 (Grok authentication testing)

#### 2. Secret Path References
**FILES REQUIRING LANGUAGE UPDATES:**
- `server/project-phoenix-orchestrator.ts` - Replace "secret path" terminology with "secure authentication system"

### SECURITY ENHANCEMENT REQUIREMENTS

#### 1. Rate Limiting Implementation
**REQUIRED:** Express rate limiting for authentication endpoints
- 5 login attempts per 15 minutes per IP
- Persian error messages for rate limit exceeded
- Integration with existing authentication system

#### 2. CSRF Protection
**REQUIRED:** Cross-site request forgery protection
- Token-based CSRF validation
- Session integration
- API endpoint protection

#### 3. Enhanced Session Security
**REQUIRED:** Improved session configuration
- Secure session storage
- Enhanced cookie security
- Session timeout management

### CURRENT SYSTEM ARCHITECTURE

#### Database Schema (Drizzle ORM)
```typescript
// Core entities operational
users, representatives, invoices, invoiceItems, invoiceBatches
fileImports, settings, collaborators, notifications
```

#### API Endpoints (Express.js)
```typescript
// Authentication system working
POST /login, POST /logout, GET /api/user
// Business logic operational  
GET /api/stats, /api/invoices, /api/representatives
// Settings system active
GET /api/settings, POST /api/settings
// File processing working
POST /api/import-json (JSON invoice import)
```

#### Frontend Architecture (React + Wouter)
```typescript
// Admin Panel: /admin/* routes
// CRM Panel: /crm/* routes  
// Authentication: Login/logout flow working
// RTL Support: Persian language optimized
```

### AI INTEGRATION REQUIREMENTS

#### 1. Current AI Capabilities
- Google Vertex AI ecosystem integration established
- Text processing and analysis functional
- Persian language support confirmed

#### 2. Required AI Enhancements
- Enhanced customer interaction analysis
- Automated invoice processing intelligence
- Performance prediction algorithms
- Voice note transcription and analysis

### UI/UX MODERNIZATION REQUIREMENTS

#### 1. Current State
- Clean white theme implemented
- RTL Persian layout functional
- Responsive design partially complete
- Modern shadcn components integrated

#### 2. Required Improvements
- Dynamic sidebar responsiveness
- Enhanced mobile optimization
- Performance monitoring displays
- Professional data visualization

### BUSINESS LOGIC SPECIFICATIONS

#### 1. V2Ray Subscription Management
```typescript
// Limited subscriptions: Per GB pricing
// Unlimited subscriptions: Fixed monthly pricing
// Multi-duration support: 1-6 months
// Representative-specific pricing tiers
```

#### 2. Invoice Generation System
```typescript
// JSON data import with ODS support
// Automated pricing calculation
// Batch processing capabilities
// Professional template rendering
```

#### 3. Representative Management
```typescript
// Admin username tracking
// Store information management
// Performance analytics
// Commission calculation system
```

### TECHNICAL INFRASTRUCTURE

#### 1. Dependencies (Current)
```json
// Frontend: React, Wouter, TanStack Query, shadcn
// Backend: Express, Drizzle ORM, PostgreSQL
// AI: Google Generative AI, Vertex AI integration
// Security: Express-session, bcrypt, passport
```

#### 2. Environment Configuration
```typescript
// Database: PostgreSQL with connection pooling
// Authentication: Session-based with secure cookies
// File Storage: Memory-based with size limits
// API Integration: Google AI Studio confirmed working
```

### PROJECT GENESIS REBORN EXECUTION PHASES

#### PHASE 1: Authentication Security Foundation (CURRENT)
- Legacy threat eradication (Grok references, secret paths)
- Rate limiting implementation
- CSRF protection deployment
- Enhanced session security

#### PHASE 2: Core System Stabilization
- Database optimization and performance tuning
- API endpoint security hardening
- Error handling standardization
- Logging and monitoring enhancement

#### PHASE 3: AI Intelligence Integration
- Advanced customer analysis algorithms
- Predictive business intelligence
- Automated performance optimization
- Enhanced Persian language processing

#### PHASE 4: UI/UX Excellence Achievement
- Professional interface refinement
- Dynamic responsiveness implementation
- Performance dashboard creation
- Mobile optimization completion

#### PHASE 5: Business Logic Optimization
- Revenue prediction modeling
- Automated workflow intelligence
- Advanced reporting systems
- Strategic decision support tools

### GEMINI 1.5 PRO LATEST SPECIFIC REQUIREMENTS

#### 1. Code Generation Expectations
- Complete implementation solutions (not pseudocode)
- Security-first approach with validated patterns
- Persian language integration where applicable
- Performance-optimized algorithms

#### 2. Analysis Capabilities Required
- Deep codebase understanding and issue identification
- Architectural pattern recommendations
- Security vulnerability assessment
- Performance bottleneck detection

#### 3. Implementation Strategy
- Micro-task approach for complex features
- Incremental deployment with testing validation
- Comprehensive documentation generation
- Error handling and edge case coverage

### SUCCESS METRICS

#### 1. AI Contribution Target
- 90% of development work performed by Gemini 1.5 Pro Latest
- 10% maximum manual implementation and integration
- Comprehensive code quality and security compliance

#### 2. System Performance Goals
- Sub-100ms API response times
- 99.9% uptime reliability
- Zero security vulnerabilities
- Professional-grade user experience

#### 3. Business Value Delivery
- Streamlined representative management
- Automated invoice processing efficiency
- Enhanced customer relationship intelligence
- Predictive business analytics capability

---

**IMMEDIATE NEXT STEP:** Gemini 1.5 Pro Latest to provide complete rate limiting implementation for authentication endpoints with Persian error messages and integration with existing authentication system.

**MODEL CONFIRMED:** gemini-1.5-pro-latest
**PROJECT STATUS:** Ready for 90% AI-driven execution
**MANDATE:** Complete system reconstruction with legacy eradication