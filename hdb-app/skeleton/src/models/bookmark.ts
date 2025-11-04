// Skeleton: bookmark model stub (not used by DB). Present to mirror structure/imports.

export type Bookmark = {
  id?: string;
  username: string;    // owner of the bookmark (or userId in a real app)
  listingId: string;   // the referenced flat/listing id
  createdAt?: string;
};

// Default export to align with how real Mongoose models are imported.
const BookmarkModel = {} as unknown as Bookmark;
export default BookmarkModel;
