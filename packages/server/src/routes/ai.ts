import express from 'express';
import { requireAuth } from '../middleware/auth';
import { aiRateLimit } from '../middleware/aiMiddleware';
import {
  generateAIResponse,
  saveMessage,
  logAIUsage,
  getOrCreateConversation,
  generateConversationTitle,
  gatherContext,
} from '../services/aiService';
import prisma from '../db';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Send a message and get AI response
 */
router.post('/chat', requireAuth, aiRateLimit, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, conversationId } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }
    
    const userId = req.user!.id;
    const organizationId = req.activeOrganizationId || null;
    const userRole = req.organizationRole || req.user?.role || 'user';
    
    // Get or create conversation
    const conversation = await getOrCreateConversation(
      userId,
      organizationId,
      userRole,
      conversationId
    );
    
    // Save user message
    await saveMessage(conversation.id, 'user', message);
    
    // Generate AI response
    const { response, tokens, cost } = await generateAIResponse(
      conversation.id,
      message,
      req
    );
    
    // Save AI response
    const aiMessage = await saveMessage(
      conversation.id,
      'assistant',
      response,
      tokens.input + tokens.output,
      cost,
      await gatherContext(req)
    );
    
    // Generate title for new conversations
    if (conversation.messages.length === 0 && !conversation.title) {
      const title = await generateConversationTitle(message);
      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { title },
      });
    }
    
    // Log usage
    const responseTime = Date.now() - startTime;
    await logAIUsage(
      userId,
      organizationId,
      'POST /api/ai/chat',
      tokens.input + tokens.output,
      cost,
      true,
      undefined,
      responseTime
    );
    
    res.json({
      conversationId: conversation.id,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: response,
        createdAt: aiMessage.createdAt,
      },
      tokens: tokens.input + tokens.output,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    
    // Log failed usage
    const responseTime = Date.now() - startTime;
    try {
      await logAIUsage(
        req.user!.id,
        req.activeOrganizationId || null,
        'POST /api/ai/chat',
        0,
        0,
        false,
        error.message,
        responseTime
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    res.status(500).json({
      error: 'Failed to process AI request',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/conversations
 * Get user's conversation history
 */
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.activeOrganizationId;
    const { limit = 20, offset = 0 } = req.query;
    
    const where: any = {
      userId,
      archived: false,
    };
    
    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    const conversations = await prisma.aiConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Just get the first message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
    });
    
    const total = await prisma.aiConversation.count({ where });
    
    res.json({
      conversations: conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title || 'New Conversation',
        userRole: conv.userRole,
        messageCount: conv._count.messages,
        preview: conv.messages[0]?.content?.substring(0, 100) || '',
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

/**
 * GET /api/ai/conversations/:id
 * Get specific conversation with all messages
 */
router.get('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({
      id: conversation.id,
      title: conversation.title || 'New Conversation',
      userRole: conversation.userRole,
      messages: conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

/**
 * DELETE /api/ai/conversations/:id
 * Archive a conversation
 */
router.delete('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const conversation = await prisma.aiConversation.findFirst({
      where: { id, userId },
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    await prisma.aiConversation.update({
      where: { id },
      data: { archived: true },
    });
    
    res.json({ message: 'Conversation archived successfully' });
  } catch (error: any) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

/**
 * GET /api/ai/context
 * Get current context information (for debugging/transparency)
 */
router.get('/context', requireAuth, async (req, res) => {
  try {
    const context = await gatherContext(req);
    
    res.json({
      role: req.organizationRole || req.user?.role,
      organizationId: req.activeOrganizationId,
      context,
    });
  } catch (error: any) {
    console.error('Get context error:', error);
    res.status(500).json({ error: 'Failed to retrieve context' });
  }
});

/**
 * GET /api/ai/usage
 * Get usage statistics (admin/owner only)
 */
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.activeOrganizationId;
    const role = req.organizationRole || req.user?.role;
    
    // Only admins, owners, and superadmins can view usage
    if (!['admin', 'owner', 'superadmin'].includes(role?.toLowerCase() || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const where: any = organizationId
      ? { organizationId }
      : { userId };
    
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const usage = await prisma.aiUsageLog.aggregate({
      where: {
        ...where,
        createdAt: { gte: last30Days },
      },
      _sum: {
        tokensUsed: true,
        cost: true,
      },
      _count: true,
    });
    
    res.json({
      period: '30 days',
      totalRequests: usage._count,
      totalTokens: usage._sum.tokensUsed || 0,
      totalCost: parseFloat(usage._sum.cost?.toString() || '0'),
    });
  } catch (error: any) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to retrieve usage statistics' });
  }
});

export default router;
