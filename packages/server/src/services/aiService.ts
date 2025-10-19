import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../db';
import type { Request } from 'express';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
  
  let context = `User Role: ${role}\n`;
  
  try {
    // Superadmin context
    if (role === 'superadmin') {
      const orgCount = await prisma.organization.count();
      const userCount = await prisma.user.count();
      const activeUsers = await prisma.session.count({
        where: { expiresAt: { gte: new Date() } }
      });
      
      context += `System Overview:\n`;
      context += `- Total Organizations: ${orgCount}\n`;
      context += `- Total Users: ${userCount}\n`;
      context += `- Active Sessions: ${activeUsers}\n`;
      return context;
    }
    
    // Organization-scoped roles
    if (activeOrganizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: activeOrganizationId },
        include: {
          _count: {
            select: {
              employees: true,
              drivers: true,
              vehicles: true,
              routes: true,
              members: true,
            }
          }
        }
      });
      
      if (org) {
        context += `Organization: ${org.name}\n`;
        context += `Members: ${org._count.members}\n`;
        
        // Owner/Admin context - full operational data
        if (role === 'owner' || role === 'admin') {
          context += `Employees: ${org._count.employees}\n`;
          context += `Drivers: ${org._count.drivers}\n`;
          context += `Vehicles: ${org._count.vehicles}\n`;
          context += `Routes: ${org._count.routes}\n`;
          
          // Recent activity
          const recentNotifications = await prisma.notification.count({
            where: {
              organizationId: activeOrganizationId,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          });
          
          context += `Recent Notifications (24h): ${recentNotifications}\n`;
          
          // Pending requests
          const pendingRequests = await prisma.vehicleRequest.count({
            where: {
              organizationId: activeOrganizationId,
              status: 'PENDING'
            }
          });
          
          context += `Pending Vehicle Requests: ${pendingRequests}\n`;
        }
        
        // Manager context - operational data
        if (role === 'manager') {
          context += `Employees: ${org._count.employees}\n`;
          context += `Drivers: ${org._count.drivers}\n`;
          context += `Vehicles: ${org._count.vehicles}\n`;
          context += `Routes: ${org._count.routes}\n`;
        }
      }
    }
  } catch (error) {
    console.error('Error gathering context:', error);
    context += 'Unable to gather full context.\n';
  }
  
  return sanitizeContext(context);
}

/**
 * Get role-specific system prompt
 */
function getRoleSystemPrompt(role: string): string {
  const basePrompt = `You are an AI assistant for a multi-fleet management system. Be helpful, concise, and professional. Always prioritize security and data privacy.`;
  
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
  
  // Initialize Gemini model
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Start chat with history
  const chat = model.startChat({
    history: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  });
  
  // Send message and get response
  const result = await chat.sendMessage(userMessage);
  const response = result.response;
  const responseText = response.text();
  
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
) {
  return await prisma.aiUsageLog.create({
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Generate a short 3-5 word title for this conversation. Only return the title, nothing else.\n\nMessage: ${firstMessage}` }],
      }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 20,
      },
    });
    
    const response = result.response;
    return response.text().trim() || 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}
