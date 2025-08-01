// require('dotenv').config();
import 'dotenv/config'
import express from 'express';
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';
import User from './models/User.js';


console.log("✅ MONGODB_URI from env:", process.env.DB_URL)
//creating express app and http server
const app = express();
const server = http.createServer(app); //socket.io support this

//initiallize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

//store online users
export const userSocketMap = {}; //{userId: socketId}

//socket.io connection handler
io.on("connection", (socket) =>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected",userId)


    //when the user is available then we will use socket map
    if(userId) userSocketMap[userId] = socket.id;

    //emit online users to all connected client
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })
} )

//middlewares
app.use(express.json({limit: "10mb"}));
app.use(cors({
  origin: ['https://chat-app-twbp.vercel.app',
    'https://chat-app-z3j4.vercel.app',
    'https://chat-app-uwz2.vercel.app'], // <-- Vercel domain
  methods: ['GET','POST','PUT'],
//   credentials: true,
}));

//routes
app.use("/api/status", (req,res)=>{res.send("server is live")})
app.use("/api/auth",userRouter);
app.use("/api/messages", messageRouter)

//connect ot mongodb
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT,() => { 
    console.log(`server is running on PORT: ${PORT}`);
}) 



//export server for vercel
export default server;
