import Meeting from "../models/Meeting.js";
import crypto from "crypto";

// @route POST /api/meetings
export const scheduleMeeting = async (req, res, next) => {
  try {
    const { participant, title, notes, startTime, endTime } = req.body;
    if (!participant || !title || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: "startTime must be before endTime" });
    }

    // Conflict detection: overlapping meeting for either party
    const conflict = await Meeting.findOne({
      status: { $in: ["pending", "accepted"] },
      $or: [
        { organizer: req.user._id },
        { participant: req.user._id },
        { organizer: participant },
        { participant: participant },
      ],
      $and: [
        { startTime: { $lt: end } },
        { endTime: { $gt: start } },
      ],
    });

    if (conflict) {
      return res.status(409).json({ message: "Time slot conflicts with an existing meeting" });
    }

    const meeting = await Meeting.create({
      organizer: req.user._id,
      participant,
      title,
      notes,
      startTime: start,
      endTime: end,
      roomId: crypto.randomBytes(8).toString("hex"),
    });

    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/meetings  (all meetings for logged-in user)
export const getMyMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ organizer: req.user._id }, { participant: req.user._id }],
    })
      .populate("organizer", "name email role")
      .populate("participant", "name email role")
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/meetings/:id/respond   { status: "accepted" | "rejected" }
export const respondToMeeting = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be accepted or rejected" });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    if (meeting.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the invited participant can respond" });
    }

    meeting.status = status;
    await meeting.save();
    res.json(meeting);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/meetings/:id  (cancel)
export const cancelMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const isOwner =
      meeting.organizer.toString() === req.user._id.toString() ||
      meeting.participant.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ message: "Not authorized" });

    meeting.status = "cancelled";
    await meeting.save();
    res.json({ message: "Meeting cancelled" });
  } catch (error) {
    next(error);
  }
};
