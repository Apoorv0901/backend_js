import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{// one who subscribing 
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    channel : {// a channel whom subscribing
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)