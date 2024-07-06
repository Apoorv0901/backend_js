//require("dotenv").config({path:"./env"})
import dotenv from "dotenv";
import express from "express";

import connectDB from "./db/db_.js";

dotenv.config({
    path : './env'
})
connectDB()
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