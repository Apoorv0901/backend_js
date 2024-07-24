import mongoose, { Schema } from "mongoose";

const likeSchema = new mongoose.Schema({
    vedios : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Vedio"
    },
    comment : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment"
    },
    tweet : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Tweet"
    },
    likedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps})

export const Like = mongoose.model("Like",likeSchema)