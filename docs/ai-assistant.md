# AI Assistant Feature

## Overview

The AI Assistant is a role-based conversational AI that helps users with their fleet management tasks. It provides context-aware guidance, operational insights, and troubleshooting help based on the user's role and organization.

## Features

### Role-Based Assistance
- **Superadmin**: System-wide insights, platform administration, security recommendations
- **Owner**: Strategic guidance, KPI insights, organizational management, compliance advice
- **Admin**: Operational management, daily operations, resource allocation, report interpretation
- **Manager**: Team management, scheduling, route planning, performance monitoring

### Security & Privacy
- **Server-side role validation**: All permissions checked on backend
- **PII filtering**: Sensitive data automatically redacted from prompts
- **Rate limiting**: 50 messages per hour per user
- **Cost tracking**: Token usage and costs logged per request
- **Audit logging**: All interactions logged for compliance

### Context Awareness
The AI automatically gathers relevant context based on:
- User role and permissions
- Active organization
- Current operational data (employees, vehicles, routes, etc.)
- Recent notifications and pending requests

## Quick Setup

### 1. Get a Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key

### 2. Add to Environment
```bash
# In packages/server/.env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Run Database Migration
```bash
cd packages/server
npx prisma migrate dev --name add_ai_assistant_models
npx prisma generate
```

### 4. Start the Application
```bash
# Terminal 1 - Start server
cd packages/server
pnpm dev

# Terminal 2 - Start client
cd packages/client
pnpm dev
```

## How to Use

### Finding the AI Assistant
Look for the **floating chat button** in the bottom-right corner of your screen.

### Asking Questions
Just click the button and type your question. Examples:

**For Owners:**
- "What are my organization's key metrics?"
- "How do I add an admin to my organization?"
- "Why am I getting a 'not a member' error?"

**For Admins:**
- "How do I optimize route assignments?"
- "What's the best way to manage vehicle maintenance?"
- "Help me understand the payroll report"

**For Managers:**
- "How do I assign employees to routes?"
- "What's the process for scheduling shifts?"
- "How can I track driver availability?"

## Architecture

### Backend Components

#### 1. Database Models (`prisma/schema.prisma`)
```prisma
model AiConversation {
  id             String   @id @default(cuid())
  userId         String
  organizationId String?
  userRole       String // Role at time of conversation
  title          String? // Auto-generated from first message
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  archived       Boolean  @default(false)

  user         User             @relation("UserConversations", fields: [userId], references: [id], onDelete: Cascade)
  organization Organization?    @relation("OrgConversations", fields: [organizationId], references: [id], onDelete: Cascade)
  messages     AiMessage[]

  @@index([userId])
  @@index([organizationId])
  @@index([createdAt])
  @@map("ai_conversations")
}

model AiMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           MessageRole // user or assistant
  content        String   @db.Text
  tokens         Int?     // Track token usage
  cost           Decimal? @db.Decimal(10, 6) // Track cost per message
  contextUsed    String?  @db.Text // What context was provided to the AI
  createdAt      DateTime @default(now())

  conversation AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([createdAt])
  @@map("ai_messages")
}

model AiUsageLog {
  id             String   @id @default(cuid())
  userId         String
  organizationId String?
  endpoint       String // Which endpoint was called
  tokensUsed     Int
  cost           Decimal  @db.Decimal(10, 6)
  success        Boolean  @default(true)
  errorMessage   String?
  responseTime   Int? // milliseconds
  createdAt      DateTime @default(now())

  @@index([userId])
  @@index([organizationId])
  @@index([createdAt])
  @@map("ai_usage_logs")
}

enum MessageRole {
  user
  assistant
  system
}
```

#### 2. AI Service (`src/services/aiService.ts`)
- `gatherContext()`: Collects role-specific context data
- `generateAIResponse()`: Calls Google Gemini API with context
- `checkRateLimit()`: Enforces usage limits
- `logAIUsage()`: Tracks costs and usage patterns
- `sanitizeContext()`: Removes PII from prompts

#### 3. API Routes (`src/routes/ai.ts`)
- `POST /api/ai/chat`: Send message and get response
- `GET /api/ai/conversations`: List conversation history
- `GET /api/ai/conversations/:id`: Get specific conversation
- `DELETE /api/ai/conversations/:id`: Archive conversation
- `GET /api/ai/context`: View current context (debugging)
- `GET /api/ai/usage`: View usage statistics (admin only)

#### 4. Middleware (`src/middleware/aiMiddleware.ts`)
- `aiRateLimit`: Prevents abuse with per-user limits
- `costControl`: Future cost limiting capabilities

### Frontend Components

#### 1. AIChat Component (`components/AIChat.tsx`)
Full-featured chat interface with:
- Message history
- Real-time typing indicators
- Role-aware UI styling
- Error handling
- Auto-scrolling
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

#### 2. AIAssistantButton Component (`components/AIAssistantButton.tsx`)
Floating action button with:
- Animated presence indicator
- Tooltip on hover
- Responsive positioning

#### 3. useAIAssistant Hook (`hooks/useAIAssistant.ts`)
Determines if AI should be shown based on user role

## API Reference

### POST /api/ai/chat
Send a message and receive AI response.

**Request:**
```json
{
  "message": "How do I add a new vehicle?",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "conversationId": "clx123...",
  "message": {
    "id": "clx456...",
    "role": "assistant",
    "content": "To add a new vehicle...",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "tokens": 250
}
```

**Rate Limits:**
- 50 messages per hour per user
- Returns 429 if limit exceeded

### GET /api/ai/conversations
List user's conversations.

**Query Parameters:**
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**
```json
{
  "conversations": [
    {
      "id": "clx123...",
      "title": "Vehicle Management Help",
      "userRole": "admin",
      "messageCount": 8,
      "preview": "How do I add a new vehicle?",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

## Cost Tracking

The system tracks costs using Google's pricing:
- Gemini 1.5 Flash: FREE tier (up to 15 requests/minute)
- Costs are logged in `AiUsageLog` table and can be viewed by admins via the `/api/ai/usage` endpoint.

## Security Considerations

### 1. PII Protection
The `sanitizeContext()` function automatically redacts:
- Passwords
- API tokens/secrets
- Bank account numbers
- Any field containing "password", "token", "secret", "key", "bankAccount"

### 2. Rate Limiting
- Default: 50 messages per hour per user
- Configurable per organization
- Returns helpful error message when exceeded

### 3. Role Validation
- All API calls validate user session
- Organization membership verified
- Role checked server-side (never trust client)

### 4. Audit Logging
- All prompts logged (with PII redaction)
- Response times tracked
- Success/failure status recorded
- Cost per request tracked

### 5. Context Scope
- Superadmin: System-wide data
- Organization roles: Only their organization's data
- No cross-organization data leakage

## Testing Checklist

### Pre-Deployment Steps

#### 1. Database Setup
```bash
cd packages/server

# Generate Prisma client with new models
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_ai_assistant_models

# Verify tables were created
npx prisma studio
# Check for: ai_conversations, ai_messages, ai_usage_logs
```

#### 2. Environment Configuration
```bash
# Add to .env file
GEMINI_API_KEY=your-gemini-api-key-here

# Verify it's set correctly
node -e "console.log(process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing')"
```

#### 3. Dependencies
```bash
cd packages/server
pnpm install  # @google/generative-ai should be installed

# Verify package
pnpm list @google/generative-ai
```

### Test Cases

#### ✅ Test 1: Visibility by Role
- [ ] Login as **superadmin** → Should see AI button
- [ ] Login as **owner** → Should see AI button
- [ ] Login as **admin** → Should see AI button
- [ ] Login as **manager** → Should see AI button
- [ ] Login as **driver** → Should NOT see AI button
- [ ] Login as **employee** → Should NOT see AI button

#### ✅ Test 2: Basic Chat Functionality
- [ ] Click AI button → Chat window opens
- [ ] Send message "Hello" → Get response
- [ ] Check message appears in chat
- [ ] Check response appears below
- [ ] Minimize chat → Window minimizes
- [ ] Click button again → Chat reopens
- [ ] Close chat → Button reappears

#### ✅ Test 3: Context Awareness
Login as **admin** and ask:
- [ ] "What's my organization's name?" → Should know it
- [ ] "How many vehicles do I have?" → Should provide count
- [ ] "How many employees?" → Should provide count

#### ✅ Test 4: Rate Limiting
- [ ] Send 50+ messages rapidly
- [ ] After 50, should get rate limit error
- [ ] Error message should be user-friendly
- [ ] Wait 5 minutes, try again → Should work

#### ✅ Test 5: Error Handling
- [ ] Stop server while chat is open
- [ ] Try to send message → Should show error
- [ ] Restart server → Should recover
- [ ] Invalid API key → Should log error

#### ✅ Test 6: Conversation History
- [ ] Have a conversation
- [ ] Refresh page
- [ ] Start new conversation → Should create new thread
- [ ] Check API: GET /api/ai/conversations
- [ ] Should see conversation list

#### ✅ Test 7: Mobile Responsiveness
- [ ] Open on mobile device or resize browser
- [ ] Chat should be responsive
- [ ] Button should be visible
- [ ] Messages should be readable

#### ✅ Test 8: Dark Mode
- [ ] Switch to dark mode
- [ ] Chat UI should update
- [ ] Should remain readable
- [ ] Button should be visible

## Troubleshooting

### AI not responding
1. Check `GEMINI_API_KEY` is set correctly
2. Verify API key has sufficient credits
3. Check server logs for Gemini errors
4. Ensure Prisma client is generated

### Rate limit errors
1. Check user's recent message count in `AiMessage` table
2. Adjust limit in `aiService.ts` if needed
3. Clear old messages if necessary

### Context not loading
1. Verify user has active organization
2. Check organization membership in database
3. Review `gatherContext()` function for errors

### Frontend not showing button
1. Check user role is privileged (superadmin/owner/admin/manager)
2. Verify `useAIAssistant` hook returns `shouldShow: true`
3. Check browser console for errors

### Common Issues & Solutions

#### Issue: "Property 'aiConversation' does not exist"
**Solution**: Run `npx prisma generate` to regenerate client

#### Issue: Chat button not showing
**Solution**: Check user role, should be superadmin/owner/admin/manager

#### Issue: "Rate limit exceeded"
**Solution**: Normal, wait 1 hour or adjust limit in aiService.ts

#### Issue: No AI response
**Solution**: Check GEMINI_API_KEY is set and valid

#### Issue: High costs
**Solution**: Review usage in ai_usage_logs table, adjust rate limits

## Example Workflows

### Scenario 1: Owner Needs Help Adding Employees
**Problem**: "I'm getting an error when trying to add employees"

**AI Response**:
> "I see you're having trouble adding employees. This typically happens when the user you're trying to add isn't a member of your organization yet. Here's how to fix it:
>
> 1. First, invite the user to your organization via Organization Management
> 2. Once they accept and become a member, then you can create an employee record for them
> 3. Make sure you have the correct shift, department, and location set up first
>
> Would you like step-by-step guidance on any of these steps?"

### Scenario 2: Manager Optimizing Routes
**Problem**: "How can I improve my route efficiency?"

**AI Response**:
> "Based on your organization's data (15 vehicles, 45 employees, 3 shifts), here are specific optimization suggestions:
>
> 1. **Clustering**: Group employees by location proximity
>    - You have employees spread across 5 locations
>    - Current average route distance: 25km
>    - Optimal clustering could reduce this by 20-30%
>
> 2. **Vehicle Utilization**:
>    - 3 vehicles running at <50% capacity
>    - Consider consolidating some routes
>
> 3. **Shift Timing**:
>    - Morning shift has 60% of employees
>    - Evening shift underutilized
>
> Would you like specific route suggestions or help using the clustering feature?"

### Scenario 3: Admin Troubleshooting
**Problem**: "The payroll report looks wrong"

**AI Response**:
> "I can help you verify the payroll report. Let me check your current data:
>
> Your organization has:
> - 12 drivers (in-house)
> - 8 vehicles
> - 3 service providers
>
> Common issues:
> 1. Missing attendance records → Check Attendance page for gaps
> 2. Incorrect driver rates → Verify hourly/daily rates in Driver Management
> 3. Service provider fees → Check Service Provider contracts
>
> Which area should we investigate first?"

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Document upload for context
- [ ] Custom prompt templates per organization
- [ ] Integration with notification system
- [ ] Proactive suggestions based on patterns
- [ ] Cost limits per organization
- [ ] Export conversation history
- [ ] Share conversations with team
- [ ] AI-powered analytics insights

## Contributing

When making changes to the AI Assistant:

1. Update Prisma schema if needed
2. Run migrations: `npx prisma migrate dev`
3. Update role-specific prompts in `aiService.ts`
4. Add tests for new functionality
5. Update this documentation
6. Test with all roles (superadmin, owner, admin, manager)
7. Verify PII redaction works
8. Check cost tracking accuracy

## Support

For issues or questions:
- Check the troubleshooting section above
- Review server logs in `packages/server/logs/`
- Check database for conversation/usage data
- Contact the development team

---

**Built with Google Gemini 1.5 Flash** | Secure | Cost-effective | Context-aware
