import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { auth } from './auth';
import { parse } from 'cookie';
import { getUserOrganizationRole } from './auth/organizationRole';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        const allowed = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
        if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
        return cb(new Error('CORS not allowed'), false);
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication required'));
      }

      const cookies = parse(cookieHeader);
      const sessionToken = cookies['better-auth.session_token'];

      if (!sessionToken) {
        return next(new Error('Authentication required'));
      }

      const session = await auth.api.getSession({
        headers: new Headers({
          'cookie': `better-auth.session_token=${sessionToken}`
        })
      });

      if (!session?.user) {
        return next(new Error('Invalid session'));
      }

      socket.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || 'user',
        organizationId: session.session.activeOrganizationId || ''
      };

      next();
    } catch (error) {
      console.error('[Socket] Authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }

    const orgRole = await getUserOrganizationRole(
      socket.user.id,
      socket.user.organizationId
    );

    console.log(`[Socket] Client connected: ${socket.id}, user: ${socket.user.email}, global role: ${socket.user.role}, org role: ${orgRole || 'member'}`);

    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${orgRole || 'member'}`);
    socket.join(`org:${socket.user.organizationId}`);

    socket.on('notification:subscribe-role', async (role: string) => {
      if (!socket.user) return;
      
      const orgRole = await getUserOrganizationRole(
        socket.user.id,
        socket.user.organizationId
      );
      
      if (orgRole === role) {
        console.log(`[Socket] Client ${socket.id} subscribing to role: ${role}`);
        socket.join(`role:${role}`);
      }
    });

    socket.on('notification:unsubscribe-role', (role: string) => {
      console.log(`[Socket] Client ${socket.id} unsubscribing from role: ${role}`);
      socket.leave(`role:${role}`);
    });

    socket.on('notification:mark-seen', (notificationId: string) => {
      if (!socket.user) return;
      
      console.log(`[Socket] Marking notification ${notificationId} as seen`);
      socket.broadcast.emit('notification:seen', {
        notificationId,
        userId: socket.user.id,
        userName: socket.user.name
      });
    });

    socket.on('notification:mark-read', (notificationId: string) => {
      console.log(`[Socket] Marking notification ${notificationId} as read`);
    });

    socket.on('notification:mark-all-read', () => {
      console.log(`[Socket] Marking all notifications as read for client ${socket.id}`);
    });

    socket.on('client:ready', () => {
      console.log(`[Socket] Client ${socket.id} is ready for notifications`);
    });

    socket.on('organization:switched', async (newOrgId: string) => {
      if (!socket.user) return;

      const oldRole = await getUserOrganizationRole(socket.user.id, socket.user.organizationId);
      if (oldRole) {
        socket.leave(`role:${oldRole}`);
      }

      const newRole = await getUserOrganizationRole(socket.user.id, newOrgId);
      if (newRole) {
        socket.join(`role:${newRole}`);
      }

      socket.leave(`org:${socket.user.organizationId}`);
      socket.join(`org:${newOrgId}`);

      socket.user.organizationId = newOrgId;
      
      console.log(`[Socket] User ${socket.user.email} switched to org ${newOrgId} with role ${newRole || 'member'}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

export default setupSocketIO;