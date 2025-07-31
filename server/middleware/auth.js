//middleware to preotect routes

import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req,res,next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer')) return res.status(401).json({success:false, message: "Unauthorized"})

    const token = authHeader.split(' ')[1];
    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select("-password");

        if(!user) {
            return res.json({success:false, message:"User not found"})
        }
        req.user = user;
        next();
    }
    catch(err){ 
        res.json({success:false,message:err.message});
    }

}