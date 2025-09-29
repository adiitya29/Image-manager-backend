import mongoose from "mongoose";
const { Schema } = mongoose;

const imageSchema = new Schema({
    title: String,
    imageUrl: String,
    public_id : String,
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false // Making it optional for backward compatibility
    }
}, {
    timestamps: true
});

const Image = mongoose.model("ImageCollection", imageSchema)

export default Image