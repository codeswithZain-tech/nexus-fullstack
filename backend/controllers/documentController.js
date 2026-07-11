import Document from "../models/Document.js";

// @route POST /api/documents/upload
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const doc = await Document.create({
      owner: req.user._id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      sharedWith: req.body.sharedWith ? JSON.parse(req.body.sharedWith) : [],
    });

    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/documents  (docs owned by or shared with user)
export const getMyDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/documents/:id/sign
export const signDocument = async (req, res, next) => {
  try {
    const { signatureImageUrl } = req.body;
    if (!signatureImageUrl) {
      return res.status(400).json({ message: "signatureImageUrl is required" });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isAuthorized =
      doc.owner.toString() === req.user._id.toString() ||
      doc.sharedWith.map(String).includes(req.user._id.toString());
    if (!isAuthorized) return res.status(403).json({ message: "Not authorized" });

    doc.signature = {
      signedBy: req.user._id,
      signatureImageUrl,
      signedAt: new Date(),
    };
    doc.status = "signed";
    doc.version += 1;
    await doc.save();

    res.json(doc);
  } catch (error) {
    next(error);
  }
};
