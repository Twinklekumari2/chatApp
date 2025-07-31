//middleware to preotect routes

import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req,res,next) => {
    const token = req.headers.token;
    if(!token) return res.status(401).json({success:false, message: "Unauthorized"})
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
        res.status(401).json({success:false,message:err.message});
    }

}