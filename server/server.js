// require('dotenv').config();
import 'dotenv/config'
import express from 'express';
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';

console.log("✅ MONGODB_URI from env:", process.env.DB_URL)
//creating express app and http server
const app = express();
const server = http.createServer(app); //socket.io support this

//middlewares
app.use(express.json({limit: "4mb"}));
app.use(cors());

//routes
app.use("/api/status", (req,res)=>{res.send("server is live")})
app.use("/api/auth",userRouter);
app.use("/api/messages", messageRouter)

//connect ot mongodb
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT,() => { 
    console.log("server is running on PORT: " + PORT);
}) 