const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.PORT || 3001;

// Create a raw HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TemanTugas WebSocket Server Running");
});

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // User joins with their own DB User ID so others can target them directly
  socket.on("register_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} registered as user_${userId}`);
  });

  // STUDENT requests a session with MENTOR
  socket.on("request_session", (data) => {
    // data: { mentorId, student, subject, questionTitle }
    console.log("Session requested by", data.student.name, "to mentor", data.mentorId);
    
    // Send event to the mentor's specific channel
    io.to(`user_${data.mentorId}`).emit("incoming_session_request", {
      sessionId: `session_${Date.now()}`,
      student: data.student,
      subject: data.subject,
      questionTitle: data.questionTitle,
      timestamp: Date.now()
    });
  });

  // MENTOR accepts session
  socket.on("accept_session", (data) => {
    // data: { sessionId, mentor, studentId }
    console.log("Session accepted by", data.mentor.name);
    // Tell the student that it's accepted
    io.to(`user_${data.studentId}`).emit("session_accepted", {
      sessionId: data.sessionId,
      mentor: data.mentor
    });
  });

  // MENTOR rejects session
  socket.on("reject_session", (data) => {
    // data: { sessionId, studentId }
    console.log("Session rejected by mentor");
    io.to(`user_${data.studentId}`).emit("session_rejected", {
      sessionId: data.sessionId
    });
  });

  // BOTH join a shared room for the live session
  socket.on("join_live_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined live room ${roomId}`);
    
    // Notify others in room
    socket.to(roomId).emit("user_joined_room", socket.id);
  });

  // WHITEBOARD & CHAT SYNC
  socket.on("whiteboard_draw", (data) => {
    // data: { roomId, element }
    socket.to(data.roomId).emit("whiteboard_draw", data.element);
  });
  
  socket.on("chat_message", (data) => {
    // data: { roomId, message }
    socket.to(data.roomId).emit("chat_message", data.message);
  });

  // WEBRTC SIGNALING
  socket.on("webrtc_offer", (data) => {
    // data: { roomId, offer, senderId }
    socket.to(data.roomId).emit("webrtc_offer", data);
  });

  socket.on("webrtc_answer", (data) => {
    socket.to(data.roomId).emit("webrtc_answer", data);
  });

  socket.on("webrtc_ice_candidate", (data) => {
    socket.to(data.roomId).emit("webrtc_ice_candidate", data);
  });

  // END SESSION
  socket.on("end_session", (data) => {
    socket.to(data.roomId).emit("session_ended");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server is running on http://localhost:${PORT}`);
});
