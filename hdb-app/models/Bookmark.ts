import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  bookmarks: [
    {
      block: String,
      street_name: String,
      flat_type: String,
      month: String,
      resale_price: String,
      compositeKey: String,
      // Add more fields as needed
    }
  ]
});

export default mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema);
