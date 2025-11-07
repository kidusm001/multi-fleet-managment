import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import prisma from '../db';
import type { Request } from 'express';
import { buildOrganizationContext, buildSuperadminContext } from './context';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

let resolvedModelName: string | null = null;

function normalizeModelName(name: string): string {
  if (!name) return '';
  return name.startsWith('models/') ? name : `models/${name}`;
}

function getModelCandidates(): string[] {
  const candidates = [resolvedModelName, ...FALLBACK_MODELS]
    .filter((value): value is string => Boolean(value))
    .map(normalizeModelName);
  return Array.from(new Set(candidates));
}

function isModelNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = (error as { message?: string }).message || String(error);
  return message.includes('models/') && message.toLowerCase().includes('not found');
}

async function runWithGeminiModel<T>(
  action: (modelName: string, model: GenerativeModel) => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;
  for (const candidate of getModelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({ model: candidate });
      const result = await action(candidate, model);
      resolvedModelName = candidate;
      return result;
    } catch (error) {
      lastError = error;
      if (isModelNotFoundError(error)) {
        console.warn(`Gemini model not found: ${candidate}. Trying next fallback.`);
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new Error('No Gemini model is available.');
}

// Cost tracking (approximate Gemini 1.5 Flash pricing - FREE for most usage)
const COST_PER_1K_INPUT_TOKENS = 0.0; // Free up to rate limits
const COST_PER_1K_OUTPUT_TOKENS = 0.0; // Free up to rate limits

/**
 * Filter out PII and sensitive data from context
 */
function sanitizeContext(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitive = ['password', 'token', 'secret', 'key', 'bankAccountNumber'];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Gather context based on user role and organization
 */
export async function gatherContext(req: Request): Promise<string> {
  const { user, organizationRole, activeOrganizationId } = req;
  const role = organizationRole || user?.role || 'user';

  const sections: string[] = [`User Role: ${role}`];

  try {
    if (role === 'superadmin') {
      const superadminContext = await buildSuperadminContext();
      sections.push(superadminContext);
      return sanitizeContext(sections.join('\n'));
    }

    if (activeOrganizationId) {
      const organizationContext = await buildOrganizationContext(role, activeOrganizationId);
      if (organizationContext) sections.push(organizationContext);
    }
  } catch (error) {
    console.error('Error gathering context:', error);
    sections.push('Unable to gather full context.');
  }

  return sanitizeContext(sections.join('\n'));
}

/**
 * Get role-specific system prompt
 */
function getRoleSystemPrompt(role: string): string {
  const basePrompt = `You are an AI assistant for a multi-fleet management system. 

CRITICAL RULES:
- Keep responses CONCISE (2-4 sentences max for simple queries)
- Use bullet points for lists
- Prioritize actionable information
- Be helpful, professional, and direct
- Always prioritize security and data privacy
- Rely ONLY on provided context and verified conversation history; never invent details
- If context is missing required data, ask the user for specifics instead of guessing
- Never assume "all" resources share a status unless the context explicitly proves it. State counts per status as given, and call out unknowns.`;
  
  const rolePrompts: Record<string, string> = {
    superadmin: `${basePrompt}
You are assisting a SUPERADMIN who has full system access. Provide:
- System-wide insights and analytics
- Platform administration guidance
- Security and performance recommendations
- Cross-organization patterns and best practices
- Technical troubleshooting for system issues`,

    owner: `${basePrompt}
You are assisting an ORGANIZATION OWNER. Provide:
- Strategic operational guidance
- KPI insights and business metrics
- Organizational management advice
- High-level resource allocation recommendations
- Compliance and policy guidance
- Help with delegation and team management
When they encounter errors (like "not a member"), explain permission requirements clearly.`,

    admin: `${basePrompt}
You are assisting an ORGANIZATION ADMIN. Provide:
- Operational guidance for daily management
- Employee, driver, and vehicle management help
- Route planning and optimization suggestions
- Resource allocation advice
- Report interpretation and insights
- Help troubleshooting common operational issues
When they encounter permission errors, explain what actions require owner privileges.`,

    manager: `${basePrompt}
You are assisting a MANAGER. Provide:
- Team and employee management guidance
- Schedule and shift planning help
- Route assignment recommendations
- Performance monitoring insights
- Basic operational troubleshooting
Focus on day-to-day operational tasks within their scope.`,

    driver: `${basePrompt}
You are assisting a DRIVER. Provide:
- Route and schedule information
- Navigation and delivery guidance
- Reporting issue instructions
- Basic app usage help
Keep responses focused on driver-specific tasks.`,

    employee: `${basePrompt}
You are assisting an EMPLOYEE. Provide:
- Schedule and route information
- Shuttle request assistance
- Basic app usage help
Keep responses simple and focused on employee needs.`,
  };
  
  return rolePrompts[role] || basePrompt;
}

/**
 * Generate AI response with context
 */
export async function generateAIResponse(
  conversationId: string,
  userMessage: string,
  req: Request
): Promise<{ response: string; tokens: { input: number; output: number }; cost: number }> {
  const { user, organizationRole } = req;
  const role = organizationRole || user?.role || 'user';
  
  // Gather context
  const contextData = await gatherContext(req);
  
  // Get conversation history (last 10 messages)
  const history = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });
  
  // Build conversation history for Gemini
  const conversationHistory: { role: string; parts: { text: string }[] }[] = [];
  
  // Add system context as first user message
  conversationHistory.push({
    role: 'user',
    parts: [{ text: `${getRoleSystemPrompt(role)}\n\nCurrent Context:\n${contextData}` }],
  });
  conversationHistory.push({
    role: 'model',
    parts: [{ text: 'I understand. I\'m ready to assist you with your fleet management tasks.' }],
  });
  
  // Add conversation history
  for (const msg of history) {
    conversationHistory.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }
  
  // Send message and get response (with error handling)
  let responseText = '';
  try {
    await runWithGeminiModel(async (_modelName, model) => {
      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(userMessage);
      responseText = result.response.text();
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('Gemini chat error:', errMsg);
    try {
      await logAIUsage(user?.id || 'unknown', user?.organizationId || null, '/api/ai/chat', 0, 0, false, errMsg);
    } catch (e) {
      console.warn('Failed to log AI usage error:', e);
    }
    throw new Error('AI service error: ' + errMsg);
  }
  
  // Estimate token usage (Gemini doesn't provide exact counts in free tier)
  const inputTokens = Math.ceil((userMessage.length + contextData.length) / 4);
  const outputTokens = Math.ceil(responseText.length / 4);
  const cost = (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS + 
               (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;
  
  return {
    response: responseText || 'I apologize, but I could not generate a response.',
    tokens: { input: inputTokens, output: outputTokens },
    cost,
  };
}

/**
 * Save message to database
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokens?: number,
  cost?: number,
  contextUsed?: string
) {
  return await prisma.aiMessage.create({
    data: {
      conversationId,
      role,
      content,
      tokens,
      cost: cost ? cost.toString() : null,
      contextUsed,
    },
  });
}

/**
 * Log AI usage for monitoring and cost control
 */
export async function logAIUsage(
  userId: string,
  organizationId: string | null,
  endpoint: string,
  tokensUsed: number,
  cost: number,
  success: boolean = true,
  errorMessage?: string,
  responseTime?: number
): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        organizationId,
        endpoint,
        tokensUsed,
        cost: cost.toString(),
        success,
        errorMessage,
        responseTime,
      },
    });
  } catch (error) {
    console.warn('Failed to log AI usage:', error);
  }
}

/**
 * Check user rate limit (messages per hour)
 */
export async function checkRateLimit(userId: string, limit: number = 50): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const count = await prisma.aiMessage.count({
    where: {
      conversation: { userId },
      createdAt: { gte: oneHourAgo },
      role: 'user',
    },
  });
  
  return count < limit;
}

/**
 * Get conversation or create new one
 */
export async function getOrCreateConversation(
  userId: string,
  organizationId: string | null,
  userRole: string,
  conversationId?: string
) {
  if (conversationId) {
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (conversation) return conversation;
  }
  
  // Create new conversation
  return await prisma.aiConversation.create({
    data: {
      userId,
      organizationId,
      userRole,
    },
    include: {
      messages: true,
    },
  });
}

/**
 * Generate conversation title from first message
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    let title = '';
    await runWithGeminiModel(async (_modelName, model) => {
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: 'You are a title generator. Generate a short 3-5 word title for the following conversation. Only return the title.' }] },
          { role: 'user', parts: [{ text: `Message: ${firstMessage}` }] },
        ],
        generationConfig: { temperature: 0.5, maxOutputTokens: 20 },
      });

      const res = await chat.sendMessage('Generate title');
      title = res.response.text().trim();
    });
    return title || 'New Conversation';
  } catch (error: any) {
    console.error('Error generating title:', error?.message || error);
    return 'New Conversation';
  }
}
