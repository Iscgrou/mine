/**
 * Direct Vertex AI Analysis Execution for Settings Reconstruction
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY!);

async function executeVertexAIAnalysis() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
VERTEX AI ANALYSIS REQUEST - SETTINGS SYSTEM RECONSTRUCTION

You are analyzing a failing Persian V2Ray CRM Settings system that needs complete reconstruction.

CRITICAL FAILURES:
1. Settings not persisting to database
2. Invoice template customizations not applying  
3. Telegram configuration not saving
4. State management issues
5. Missing error handling

REQUIREMENTS:
- Complete React TypeScript component
- Persian RTL interface
- Database persistence
- Error handling
- Invoice template preview
- Telegram bot configuration
- Company branding settings

Please provide:

## ROOT CAUSE ANALYSIS
[Identify specific technical failures]

## ARCHITECTURAL SOLUTION  
[Technical approach to fix all issues]

## COMPLETE REPLACEMENT CODE
\`\`\`typescript
// Complete Settings component code here
\`\`\`

## IMPLEMENTATION STEPS
1. [Step by step instructions]

## TESTING STRATEGY
[How to validate the fixes]

Focus on production-ready code that eliminates all current failures.
`;

  try {
    console.log('🔥 Executing Vertex AI analysis...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('\n🧠 VERTEX AI ANALYSIS COMPLETE\n');
    console.log(response);
    
    // Save analysis
    await fs.writeFile('../vertex-ai-analysis-result.txt', response);
    console.log('\n💾 Analysis saved to vertex-ai-analysis-result.txt');
    
    return response;
  } catch (error) {
    console.error('Vertex AI analysis failed:', error);
    throw error;
  }
}

executeVertexAIAnalysis();