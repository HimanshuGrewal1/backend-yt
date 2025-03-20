import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../modles/User.modle.js"
import { uploadonc } from "../utils/cloudnary.js";
import { ApiResponce } from "../utils/Apiresponce.js";

const generateAccessAndRefreshtoken=async(userId)=>{
   try {
      const user=await User.findById(userId)
      const accessToken=user.generateAccesstoken()
      const refreshToken=user.generateRefreshtoken()

      user.refreshToken=refreshToken
      await user.save({validateBeforeSave:false})
      return {accessToken,refreshToken}
   } catch (error) {
      throw new ApiError(500,"something went wrong while generating refresh token")
   }
}


const registerUser = asynchandler(async (req, res) => {

   const {fullname, email, username, password } = req.body
   console.log(email, username, password, fullname)

   if ([fullname, email, username, password].some((field) =>
      field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }


   const existUser = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (existUser) {
      throw new ApiError(409, "User with email or username already exist!")
   }

   let coverImageLocalPath;
   const avatarLocalPath = req.files?.avatar[0]?.path;
   if(req.field && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files?.coverImage[0]?.path;
   }
   
   if (!avatarLocalPath) {
      throw new ApiError(400, "NO Avatar Image found");

   }


   const avatar = await uploadonc(avatarLocalPath);
   const coverImage = await uploadonc(coverImageLocalPath)

   if (!avatar){
      throw new ApiError(400, "NO Avatar Image found");
   }
   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the User")
   }



   return res.status(201).json(
      new ApiResponce(200, createdUser, "User registered Successfully")
   )

})

const loginUser= asynchandler(async (req,res)=>{
    const{email,username,password} = req.body

   

    if(!username && !email){
        throw new ApiError(400,"Username or email is required")

    }

    const existUser = await User.findOne({
      $or: [{ username },{email}]
   })
   
   if (!existUser) {
      throw new ApiError(404,"User not found")
   }
   

   const passwordc=await existUser.ispasswordcorrect(password)
   
   if(!passwordc){
      throw new ApiError(401,"Invalid user credentials")
   }
   
   const {accessToken,refreshToken}=await generateAccessAndRefreshtoken(existUser._id)

   const loggedUser=await User.findById(existUser._id).select("-password -refreshToken")

   const options={
      httpOnly:true,
      secure:true
   }

   return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResponce(200,{user:loggedUser,accessToken,refreshToken},"User loggen In successfully"))
})

const logoutUser=asynchandler(async (req,res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined
         }
    },
     {
        new:true
     }
   )
   
   const options={
      httpOnly:true,
      secure:true
   }

   return res.status(200).clearcookie("accessToken",options).clearcookie("refreshToken",options).json(new ApiResponce(200,{},"User logged Out Successfully"))

})

export {registerUser,loginUser,logoutUser}