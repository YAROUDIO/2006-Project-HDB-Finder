import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /.+@.+\..+/, // basic email format check
  },
  password: { type: String, required: true },
  income: { type: String },
  citizenship: { type: String },
  householdSize: { type: Number },
  loan: { type: String },
  flatType: { type: String },
  budget: { type: String },
  area: { type: String },
  leaseLeft: { type: String }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
