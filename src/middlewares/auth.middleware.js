import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../modles/User.modle.js";

export const verifyJWT=asynchandler(async (req,res,next) => {
   try {
    const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
    if (!token) {
       throw new ApiError(401,"Unauthorized request")
    }
 
    const decodedtoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     const user= await User.findById(decodedtoken._id).select("-password -refreshToken")
     if(!user){
         throw new ApiError(401,"Invalid Access Token");
     }
     req.user=user
     next()
   } catch (error) {
       throw new ApiError(401,error?.message || "invaalid Access Token");
       
   }
})