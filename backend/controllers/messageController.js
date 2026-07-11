import Message from "../models/Message.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ message: "receiverId and content are required" });
    }
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
    });
    const populated = await message.populate("sender", "name email avatarUrl");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: null,
          users: {
            $addToSet: {
              $cond: [
                { $eq: ["$sender", req.user._id] },
                "$receiver",
                "$sender",
              ],
            },
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $unwind: "$users" },
      { $sort: { "lastMessage.createdAt": -1 } },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          avatarUrl: "$user.avatarUrl",
          role: "$user.role",
          lastMessage: 1,
        },
      },
    ]);

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email avatarUrl")
      .populate("receiver", "name email avatarUrl");

    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};
