import mongoose from "mongoose";
const { Schema } = mongoose;

const imageSchema = new Schema({
    title: String,
    imageUrl: String,
    public_id : String,
})

const Image = mongoose.model("ImageCollection", imageSchema)

export default Image