import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import express from "express";

const connectDB = async() => {
    try {
        const uri = process.env.MONGODB_URI;
        const db = DB_NAME;
        const url = (uri + "/" + db)
        const connectionInstance = await mongoose.connect(url)
        console.log("\n MongoDb connected !! DB host : ",connectionInstance.connection.host)
    } catch(error) {
        console.log("MONGODB connection failed ", error);
        process.exit(1)
    }
}

export default connectDB;