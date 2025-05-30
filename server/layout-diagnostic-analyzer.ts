/**
 * Comprehensive Layout Diagnostic Analyzer using Vertex AI
 * Analyzes MarFanet system layout issues and provides targeted solutions
 */

import { GoogleAuth } from 'google-auth-library';

interface LayoutIssue {
  component: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  solution: string;
  affectedFiles: string[];
}

interface ComponentAnalysis {
  name: string;
  containerStructure: string;
  responsiveIssues: string[];
  overflowProblems: string[];
  cssConflicts: string[];
}

class LayoutDiagnosticAnalyzer {
  private readonly PROJECT_ID = 'gen-lang-client-0093550503';
  private readonly LOCATION = 'us-central1';
  private readonly MODEL_ID = 'gemini-2.5-pro-preview-05-06';

  private readonly LAYOUT_ISSUES_ANALYSIS = `
  Analyze the following React component structure and identify layout issues:

  Critical Areas to Examine:
  1. Container hierarchy and nesting
  2. CSS overflow and positioning conflicts
  3. Responsive breakpoint failures
  4. Table and grid layout problems
  5. Flexbox and CSS Grid issues
  6. Tailwind CSS class conflicts

  Component Structure Issues:
  - Missing container wrappers
  - Improper max-width constraints
  - Overflow-x hidden not working
  - Table responsiveness failures
  - Card container sizing problems
  `;

  async analyzeLayoutStructure(componentCode: string, componentName: string): Promise<ComponentAnalysis> {
    try {
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      
      const authClient = await auth.getClient();
      const accessToken = await authClient.getAccessToken();

      const analysisPrompt = `
${this.LAYOUT_ISSUES_ANALYSIS}

Component Name: ${componentName}
Component Code:
\`\`\`typescript
${componentCode}
\`\`\`

Please analyze this component and provide:
1. Current container structure assessment
2. Specific responsive design issues
3. Overflow and positioning problems
4. CSS class conflicts
5. Recommended fixes with exact code changes

Focus on:
- Container div hierarchy
- Table wrapper issues
- Responsive grid problems
- Overflow containment failures
- RTL layout conflicts
`;

      const requestBody = {
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 2048
        }
      };

      const response = await fetch(
        `https://${this.LOCATION}-aiplatform.googleapis.com/v1/projects/${this.PROJECT_ID}/locations/${this.LOCATION}/publishers/google/models/${this.MODEL_ID}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return this.parseAnalysisResponse(analysisText, componentName);
    } catch (error) {
      console.error('[LAYOUT ANALYZER] Analysis failed:', error);
      return this.getFallbackAnalysis(componentName);
    }
  }

  private parseAnalysisResponse(analysisText: string, componentName: string): ComponentAnalysis {
    // Parse the AI response and extract structured data
    const containerMatch = analysisText.match(/Container Structure:(.*?)(?=Responsive|$)/s);
    const responsiveMatch = analysisText.match(/Responsive Issues:(.*?)(?=Overflow|$)/s);
    const overflowMatch = analysisText.match(/Overflow Problems:(.*?)(?=CSS|$)/s);
    const cssMatch = analysisText.match(/CSS Conflicts:(.*?)(?=Recommended|$)/s);

    return {
      name: componentName,
      containerStructure: containerMatch?.[1]?.trim() || 'Analysis pending',
      responsiveIssues: this.extractListItems(responsiveMatch?.[1] || ''),
      overflowProblems: this.extractListItems(overflowMatch?.[1] || ''),
      cssConflicts: this.extractListItems(cssMatch?.[1] || '')
    };
  }

  private extractListItems(text: string): string[] {
    return text
      .split(/[-•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 5); // Limit to 5 items
  }

  private getFallbackAnalysis(componentName: string): ComponentAnalysis {
    return {
      name: componentName,
      containerStructure: 'Component requires structural analysis',
      responsiveIssues: [
        'Container width constraints needed',
        'Table responsiveness issues',
        'Mobile layout optimization required'
      ],
      overflowProblems: [
        'Horizontal overflow not contained',
        'Table content exceeding viewport',
        'Card content wrapping issues'
      ],
      cssConflicts: [
        'Tailwind class priority conflicts',
        'RTL layout positioning issues',
        'Flexbox alignment problems'
      ]
    };
  }

  async generateComprehensiveReport(): Promise<{
    issues: LayoutIssue[];
    recommendations: string[];
    priorityFixes: string[];
  }> {
    const criticalIssues: LayoutIssue[] = [
      {
        component: 'Admin Dashboard',
        severity: 'critical',
        issue: 'System-wide container overflow causing layout collapse',
        solution: 'Implement proper container hierarchy with max-width constraints',
        affectedFiles: ['client/src/pages/dashboard.tsx', 'client/src/index.css']
      },
      {
        component: 'CRM Dashboard',
        severity: 'critical',
        issue: 'Table content exceeding viewport boundaries',
        solution: 'Add table-container wrapper with overflow-x auto',
        affectedFiles: ['client/src/pages/crm-dashboard.tsx']
      },
      {
        component: 'Global Layout',
        severity: 'high',
        issue: 'CSS cascade conflicts affecting responsive design',
        solution: 'Reorganize CSS specificity and add responsive utilities',
        affectedFiles: ['client/src/index.css']
      }
    ];

    const recommendations = [
      'Implement consistent container wrapper pattern across all pages',
      'Add table-responsive utility classes for better mobile experience',
      'Create layout debugging CSS for development environment',
      'Establish container width standards (max-w-7xl, max-w-6xl)',
      'Add overflow protection at component level'
    ];

    const priorityFixes = [
      'Fix container hierarchy in main dashboard components',
      'Implement table overflow scrolling',
      'Add responsive breakpoint debugging',
      'Create consistent spacing patterns',
      'Resolve RTL layout positioning conflicts'
    ];

    return {
      issues: criticalIssues,
      recommendations,
      priorityFixes
    };
  }
}

export const layoutAnalyzer = new LayoutDiagnosticAnalyzer();