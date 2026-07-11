import { Server } from "socket.io";

// Maps userId -> Set of socketId (supports multiple tabs)
const onlineUsers = new Map();

export const initVideoSignaling = (httpServer, clientUrl) => {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl || "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ---- WebRTC signaling ----
    socket.on("join-room", ({ roomId, userName }) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", { socketId: socket.id, userName });
    });

    socket.on("offer", ({ roomId, offer, to }) => {
      io.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
      io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("toggle-media", ({ roomId, audio, video }) => {
      socket.to(roomId).emit("peer-toggle-media", { socketId: socket.id, audio, video });
    });

    socket.on("end-call", ({ roomId }) => {
      socket.to(roomId).emit("call-ended", { socketId: socket.id });
      socket.leave(roomId);
    });

    // ---- Real-time Chat ----
    socket.on("chat:register", ({ userId }) => {
      if (userId) {
        socket.data.userId = userId;
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
        io.emit("chat:online-users", Array.from(onlineUsers.keys()));
      }
    });

    socket.on("chat:send", ({ receiverId, message }) => {
      const senderId = socket.data.userId;
      if (receiverId && message) {
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((sid) => {
            io.to(sid).emit("chat:receive", {
              _id: message._id,
              sender: message.sender,
              receiver: message.receiver,
              content: message.content,
              createdAt: message.createdAt,
            });
          });
        }
        // Also emit back to sender so they see it too
        const senderSockets = onlineUsers.get(senderId);
        if (senderSockets) {
          senderSockets.forEach((sid) => {
            io.to(sid).emit("chat:sent", {
              _id: message._id,
              sender: message.sender,
              receiver: message.receiver,
              content: message.content,
              createdAt: message.createdAt,
            });
          });
        }
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit("chat:online-users", Array.from(onlineUsers.keys()));
        }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
