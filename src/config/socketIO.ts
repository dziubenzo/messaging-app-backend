import { Server as HttpServer } from 'http';
import { ObjectId } from 'mongoose';
import { Server } from 'socket.io';
import { STATUS_ICONS } from './constants';
import { updateStatusIcon } from './helpers';
import { StatusIcon } from './types';

export default function initialiseSocketIO(
  httpServer: HttpServer,
  allowedURLs: string | string[]
) {
  const io = new Server(httpServer, {
    cors: { origin: allowedURLs },
  });

  // Socket.IO event listeners and emitters
  io.on('connection', (socket) => {
    let user: ObjectId | null;
    
    // Change user's status icon to available and broadcast that to others
    socket.on('user is authenticated', async (userId: ObjectId) => {
      if (!userId) return;
      // Keep user's MongoDB id for use in other listeners
      user = userId;
      await updateStatusIcon(user, STATUS_ICONS.available);
      socket.broadcast.emit('update status icon', user, STATUS_ICONS.available);
    });

    // Change user's status icon to unavailable and broadcast that to others
    socket.on('user is not authenticated', async () => {
      if (!user) return;
      await updateStatusIcon(user, STATUS_ICONS.unavailable);
      socket.broadcast.emit(
        'update status icon',
        user,
        STATUS_ICONS.unavailable
      );
      user = null;
    });

    // Send back what's been sent by the sender to every socket except for the sender
    socket.on(
      'change status icon',
      (userId: ObjectId, imageURL: StatusIcon) => {
        if (!userId || !imageURL) {
          return;
        }
        socket.broadcast.emit('update status icon', userId, imageURL);
      }
    );

    socket.on('change username/text status', (userId, username, textStatus) => {
      socket.broadcast.emit(
        'update username/text status',
        userId,
        username,
        textStatus
      );
    });

    socket.on('send message', (fromId, toId, message, username) => {
      socket.broadcast.emit('receive message', fromId, toId, message);
      socket.broadcast.emit('show new message toast', toId, username);
    });

    socket.on('delete group chat', (groupChat) => {
      socket.broadcast.emit('remove group chat', groupChat);
    });

    socket.on('create group chat', (members, newGroupChat) => {
      socket.broadcast.emit('add group chat', members, newGroupChat);
    });

    socket.on('user is typing (DM)', (fromId, toId, username, isTyping) => {
      socket.broadcast.emit(
        'show/hide isTyping (DM)',
        fromId,
        toId,
        username,
        isTyping
      );
    });

    socket.on('user registers', (username) => {
      socket.broadcast.emit('show new user toast', username);
    });

    // Handle group chats
    socket.on('open group chat', (groupChatId) => {
      socket.join(groupChatId);
    });

    socket.on('send group chat message', (groupChatId, message) => {
      socket
        .to(groupChatId)
        .emit('receive group chat message', groupChatId, message);
    });

    socket.on(
      'user is typing (group chat)',
      (groupChatId, username, isTyping) => {
        socket.broadcast.emit(
          'show/hide isTyping (group chat)',
          groupChatId,
          username,
          isTyping
        );
      }
    );

    // Change user's status icon to unavailable and broadcast that to others
    socket.on('disconnect', async () => {
      if (!user) return;
      await updateStatusIcon(user, STATUS_ICONS.unavailable);
      socket.broadcast.emit(
        'update status icon',
        user,
        STATUS_ICONS.unavailable
      );
      user = null;
    });
  });
}
