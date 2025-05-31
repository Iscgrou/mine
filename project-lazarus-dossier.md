# Project Lazarus - MarFanet Critical System Reconstruction Dossier

## EXECUTIVE BRIEFING FOR VERTEX AI (GEMINI 2.5 PRO)

**Mission**: Complete reconstruction of critically failing MarFanet systems through expert analysis and production-ready code solutions.

**Critical Situation**: MarFanet platform experiencing systemic failures requiring immediate ground-up rebuild of core components.

---

## I. CRITICAL SYSTEM FAILURES REQUIRING IMMEDIATE RECONSTRUCTION

### 1. Dashboard System - Complete Instability
**Failure Description**: Dashboard becomes inaccessible with 404 errors after operation period
**Severity**: Critical - Core functionality loss
**Impact**: Admin panel unusable, business operations disrupted
**Required Action**: Complete dashboard architecture rebuild

### 2. Settings Section - Total Failure
**Failure Description**: 
- Non-responsive to any configuration changes
- Vertex AI configurations being deleted
- Telegram channel information input disappeared
- Settings not persisting to database
**Severity**: Critical - System configuration impossible
**Impact**: Cannot configure essential services (AI, notifications, templates)
**Required Action**: Complete settings system rebuild

### 3. Aegis Memory Reporting - False Data
**Failure Description**: Reports 90%+ memory usage when actual usage is ~5%
**Severity**: High - Monitoring system providing false data
**Impact**: Cannot trust system health metrics
**Required Action**: Fix monitoring logic and calculations

### 4. Authentication System Fragments
**Failure Description**: Potential remnants of legacy authentication methods
**Severity**: Medium-High - Security and access consistency
**Impact**: Inconsistent login behavior
**Required Action**: Complete verification and cleanup

---

## II. PROJECT PANTHEON APEX MANDATE (INTENDED END-STATE)

### Core Business Model
MarFanet manages V2Ray proxy subscriptions for 96 Iranian mobile phone store representatives with:
- Volume-based (GB) and unlimited time-based subscriptions
- Automated invoice generation with dynamic pricing
- Commission tracking for collaborator program
- Persian language support with V2Ray technical terminology

### Technical Excellence Standards
- **Aegis Principles**: Bulletproof system reliability and accurate monitoring
- **Nova Vision**: AI-powered CRM with Vertex AI integration
- **Data Integrity**: 100% accurate financial calculations and reporting
- **UI/UX Excellence**: Flawless responsive design with Persian RTL support
- **Performance**: Sub-200ms API responses, zero-latency updates

### Feature Completeness Goals
- Real-time dashboard with live data visualization
- Comprehensive settings management for all system configurations
- Advanced invoice template customization with immediate preview
- AI-powered representative performance analytics
- Automated Telegram notifications for critical events

---

## III. CURRENT CODEBASE ARCHITECTURE

### Technology Stack
- **Frontend**: React 18 + TypeScript, Wouter routing, TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript, PostgreSQL + Drizzle ORM
- **AI Integration**: Google Vertex AI (Gemini 2.5 Pro) - TARGET SYSTEM
- **Authentication**: Session-based with secure credential management

### Database Schema (Current State)
```sql
-- Core entities with 96 active representatives
representatives (id, fullName, adminUsername, pricing tiers, commission rates)
invoices (id, invoiceNumber, representativeId, totalAmount, status, invoiceData)
invoice_items (detailed subscription breakdowns)
settings (key-value configuration storage)
collaborators (affiliate program management)
commission_records (automated calculations)
financial_ledger (transaction tracking)

-- CRM system
crm_users, crm_interactions, crm_ai_processing_queue

-- System monitoring
backups, file_imports
```

### Current File Structure
```
server/
├── auth-system.ts (unified authentication)
├── routes.ts (API endpoints)
├── storage.ts (database interface)
├── invoice-template-service.ts (template generation)
├── vertex-ai-service.ts (AI integration foundation)
├── aegis-logger.ts (system monitoring)

client/src/
├── pages/
│   ├── dashboard.tsx (FAILING - 404 errors)
│   ├── settings.tsx (FAILING - non-responsive)
│   ├── representatives.tsx
│   └── invoices.tsx
├── components/ui/ (shadcn components)
└── lib/ (utilities and query client)

shared/
└── schema.ts (Drizzle ORM definitions)
```

---

## IV. DETAILED FAILURE ANALYSIS

### Settings System Failure
**Current Implementation Issues**:
```typescript
// settings.tsx - Non-functional state management
const [companyName, setCompanyName] = useState("شرکت مارفانت");
// Settings not persisting due to backend/frontend disconnect
```

**Backend Storage Problems**:
```typescript
// Inconsistent settings storage and retrieval
// Key-value pairs not properly synchronized
// Database transactions failing silently
```

### Dashboard System Failure
**Routing Issues**: Potential state management conflicts causing 404 errors
**Data Fetching Problems**: Widgets showing inaccurate or stale data
**Session Management**: Possible session expiration causing navigation failures

### Aegis Monitoring Failure
**Memory Calculation Error**: False high memory reporting
**System Metrics**: Inaccurate resource utilization data
**Monitoring Logic**: Flawed calculation algorithms

---

## V. GEMINI 2.5 PRO RECONSTRUCTION MANDATES

### Priority 1: Settings Section Complete Rebuild
**Required Deliverables**:
1. Complete new settings.tsx component with robust state management
2. Backend API endpoints for secure settings persistence
3. Vertex AI configuration interface with credential validation
4. Telegram bot setup with secure token storage
5. Invoice template customization with real-time preview
6. Commission rate management interface

**Technical Requirements**:
- Fail-safe database transactions
- Input validation and sanitization
- Clear success/error feedback
- Responsive design for all devices
- Persian language support

### Priority 2: Dashboard System Rebuild
**Required Deliverables**:
1. Stable dashboard routing and navigation
2. Real-time data widgets with accurate calculations
3. Live financial metrics from actual database
4. Representative performance analytics
5. System health monitoring display

**Technical Requirements**:
- Bulletproof session management
- Efficient data fetching with caching
- Dynamic updates without page refresh
- Error boundary implementation
- Performance optimization

### Priority 3: Aegis Memory Reporting Fix
**Required Deliverables**:
1. Corrected memory monitoring logic
2. Accurate system resource reporting
3. Real-time performance metrics
4. Resource utilization alerts

---

## VI. VERTEX AI INTEGRATION REQUIREMENTS

### Current API Access
- Google Cloud Service Account configured
- GOOGLE_APPLICATION_CREDENTIALS environment variable set
- Vertex AI User role permissions granted
- All necessary APIs enabled (Vertex AI, STT, Translation)

### Integration Goals
- Persian language processing for CRM insights
- Predictive analytics for representative performance
- Automated invoice optimization recommendations
- Voice processing for customer interactions

---

## VII. SUCCESS CRITERIA

### Technical Excellence
- Zero 404 errors on dashboard navigation
- 100% settings persistence and retrieval
- Accurate system monitoring (within 1% of actual usage)
- Sub-200ms API response times
- Flawless authentication with no legacy remnants

### Business Impact
- Reliable system configuration capability
- Real-time business intelligence
- Accurate financial reporting
- Seamless user experience across all devices

### Stability Metrics
- 99.9% uptime for core functionality
- Zero data loss incidents
- Consistent performance under load
- Complete error handling and recovery

---

**GEMINI 2.5 PRO DIRECTIVE**: Analyze this dossier and provide complete, production-ready code solutions for the Settings section rebuild (Priority 1). Design a robust, fail-safe system that addresses all identified failures with modern best practices and bulletproof implementation.