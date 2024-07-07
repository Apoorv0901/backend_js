//require("dotenv").config({path:"./env"})
import dotenv from "dotenv";
import express from "express";

import connectDB from "./db/db_.js";

dotenv.config({
    path : './env'
})
connectDB()
.then(()=>{
    try {
        app.listen(process.env.PORT || 8000 , () => {
            console.log("Server is running at port : ", process.env.PORT)
        })
    } catch(err){
        console.log("Unable to start server !! ", err)
    }
})
.catch((err)=>{
    console.log("Database connection failed !!" , err)
})






//const app = express();

// ;(async () => {
//     try{
//         const uri = process.env.MONGODB_URI;
//         const db = DB_NAME;
//         await mongoose.connect((uri + '/' + db))
//         app.on("error",(error) => {
//             console.log("Error:",error);
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log('App is listening on port',process.env.PORT);
//         })
//     } catch(error){
//         console.error("ERROR:",error);
//         throw error
//     }
// })()