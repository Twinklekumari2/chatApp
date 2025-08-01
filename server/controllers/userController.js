//user kya kya kar sakta hai ye hai voh

import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";


//signup a new user
export const signup = async (req,res) => {
    const {fullName,email,password,bio} = req.body;

    try{
        if(!fullName || !email || !password || !bio){
            return res.json({success:false,message:"Missing Details"});
        }
        const user = await User.findOne({email});

        if(user){
            return res.json({success:false, message:"Account already exist"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = await User.create({
            fullName,email,password:hashedPassword,bio
        });

        const token = generateToken(newUser._id);
        res.json({success:true,userData: newUser, token, message:"Account created successfully"})

    }catch(err){
        res.json({success:false,message:err.message});

    }
}

//controller to login a user
export const login = async (req,res) => {
    try{
        const {email,password} = req.body;
    if(!email || !password){
        res.json({success:false,message:"Missing details"})
    }
    const userData = await User.findOne({email});
    if(!userData){
        res.json({success:false, message:"user not found"})
    }
    const isPasswordCorrect = await bcrypt.compare(password,userData.password);

    if(!isPasswordCorrect){
        res.json({
            success:false, message:"Invalid credentials"
        })
    }

    const token = generateToken(userData._id);

    res.json({success:true, userData, token, message:"Login Successfully"});
    }catch(err){
        res.json({success:false, message:err.message});
    }
    
}

//controller to check if user is authenticated
export const checkAuth = (req,res) => {
    res.json({success:true,user:req.user});
}

//controller to update user profile details
export const updateProfile = async (req,res) => {
    try{
        const {profilePic,bio,fullName} = req.body;
        const userId = req.user._id;
        let updatedUser;
        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(userId,{bio,fullName}, {new:true});
        }
        else{
            //first we have to update on cloudinary then we will get url 
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName}, {new:true});
        }
        res.json({success:true,user:updatedUser});
    }catch(err){
        res.json({success:false,message:err.message});
    }
}