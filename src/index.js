import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({
    path: './env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is at :${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("mongo connection error",err);
})