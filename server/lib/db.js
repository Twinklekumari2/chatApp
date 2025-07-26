// import mongoose from "mongoose";
// // import "dotenv/config";

// //function to connect to the mongodb database
// // const MONGODB_URI="mongodb+srv://twinkle:twinkle246@quickchat.ksoucmx.mongodb.net/chat-app"
// const MONGODB_URI = process.env.DB_URL; 
// // const MONGODB_URI = 'mongodb://localhost:27017/quickchat'
// // const MONGODB_URI = process.env.DB_URL_LOCAL; 
// if(!MONGODB_URI){
//     console.log("found not")
// }
// mongoose.connect(MONGODB_URI)
// const db = mongoose.connection;

// db.on('connected', () => {
//     console.log("database connected");
// })
// db.on('error',(err) => {
//     console.log("error",err)
// })
// db.on('disconnected', () => {
//     console.log("database disconnected")
// })
 
// export default db;

import mongoose from "mongoose";

export const connectDB = async () => {

    try{
        mongoose.connection.on('connected', () => console.log('Database Connected')); 
        await mongoose.connect(process.env.DB_URL);

    }catch(err){
        console.log(err);

    }

}