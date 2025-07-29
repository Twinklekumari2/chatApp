import Message from "../models/Message.js";
import cloudinary from "cloudinary"
import User from "../models/User.js";
import {io, userSocketMap} from "../server.js"
import mongoose from "mongoose";

//get all user excpet the logged in user
export const getUsersForSidebar = async (req,res) => {
    try{
        const userId = req.user._id;
        const filteredUSers = await User.find({_id: {$ne: userId}}).select("-password");
        //count the number of messages not seen

        const unseenMessages = {}
        const promises = filteredUSers.map(async (user) => {
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false});

            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filteredUSers,unseenMessages})

    }catch(err){
        console.log(err.message);
        res.json({success:false,message:filteredUSers,unseenMessages})

    }
}

//get all message for selected user(by using id)
export const getMessages = async (req,res) => {
    try{
        const {id: selectedUserId} = req.params;
        const myId = req.user._id;
        const messages = await Message.find({$or: [
            {senderId:myId, receiverId:selectedUserId},
            {senderId:selectedUserId, receiverId:myId},
        ]})
        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});

        res.json({
            success:true,messages
        })
    }
    catch(err){
        res.json({success:false,message:err.message});
    }
}

//api to mark messages as seen using message id
// export const markMessageAsSeen = async (req,res) => {
//     try{
//         const { id }= req.params;
//         await Message.findByIdAndUpdate(id,{seen:true})
//         res.json({success:true});

//     }catch(err){
//         console.log(err.message);
//         res.json({success:false,message:err.message});

//     }
// }

// PUT /api/messages/mark/:id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid message id" });
    }

    // (Optional but recommended) Only the recipient should be allowed to mark a message as seen
    // assuming you have req.user.id from an auth middleware and your schema has receiverId
    // const messageDoc = await Message.findById(id);
    // if (!messageDoc) {
    //   return res.status(404).json({ success: false, message: "Message not found" });
    // }
    // if (String(messageDoc.receiverId) !== String(req.user.id)) {
    //   return res.status(403).json({ success: false, message: "Not allowed" });
    // }

    const updated = await Message.findByIdAndUpdate(
      id,
      { $set: { seen: true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    return res.json({ success: true, data: { _id: updated._id, seen: updated.seen } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




export const sendMEssage = async (req,res) => {
    try{
        const {text,image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;

        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl,
        });
        res.json({success:true,newMessage});
        
        //emit the nwe msg to the receivers socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

    }
    catch(err){
        res.json({success:false, message:err.message
        })

    }
}