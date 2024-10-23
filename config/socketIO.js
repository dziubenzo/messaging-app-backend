import { Server } from 'socket.io';

export default function initialiseSocketIO(httpServer, allowedURLs) {
  const io = new Server(httpServer, {
    cors: { origin: allowedURLs },
  });

  // Socket.IO event listeners and emitters
  io.on('connection', (socket) => {
    // Send back what's been sent by the sender to every socket except for the sender
    socket.on('change status icon', (userId, imageURL) => {
      if (!userId || !imageURL) {
        return;
      }
      socket.broadcast.emit('update status icon', userId, imageURL);
    });

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
  });
}
