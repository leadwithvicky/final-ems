# Global Chat System Documentation

## Overview
This is a real-time global chat system for the EMS (Employee Management System) that allows employees, admins, and super admins to communicate in a public channel.

## Features
- Real-time messaging (polls every 3 seconds when chat is open)
- Role-based message display (employee, admin, superadmin)
- Chronological message ordering
- Message notifications with unread count
- Responsive floating chat interface
- MongoDB storage with proper indexing

## Architecture

### Database Schema
- **ChatMessage Model**: Stores messages with senderId, senderRole, senderName, message, timestamp
- **Indexes**: timestamp and senderId for efficient querying

### API Endpoints
- `GET /api/chat/messages`: Retrieves messages (paginated, max 100)
- `POST /api/chat/messages`: Sends new message

### Frontend Components
- **GlobalChat**: Main chat interface component
- **useChatNotifications**: Hook for handling unread message notifications

## Usage

### Installation
1. Install dependencies:
   ```bash
   cd aems-nextjs
   npm install date-fns
   ```

2. Ensure MongoDB is running and models are synced

3. The chat system is automatically integrated into the dashboard

### Features
- **Floating Chat Button**: Located at bottom-right corner
- **Real-time Updates**: Messages refresh every 3 seconds when chat is open
- **Notifications**: Shows unread message count on chat button
- **Role Display**: Shows user role (employee, admin, superadmin) next to name
- **Message Limit**: 1000 character limit per message
- **Security**: JWT token authentication required

### Files Created
- `aems-nextjs/src/lib/models/ChatMessage.ts` - Database model
- `aems-nextjs/src/app/api/chat/messages/route.ts` - API endpoints
- `aems-nextjs/src/components/GlobalChat.tsx` - Main chat component
- `aems-nextjs/src/hooks/useChatNotifications.ts` - Notification hook
- `aems-nextjs/src/app/dashboard/page.tsx` - Updated dashboard
- `aems-nextjs/CHAT_SYSTEM.md` - Documentation

## Security Considerations
- JWT token validation on all API endpoints
- Input sanitization for messages
- Rate limiting can be added to prevent spam
- CORS configuration for production
