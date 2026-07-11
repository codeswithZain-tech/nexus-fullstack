import express from "express";
import {
  scheduleMeeting,
  getMyMeetings,
  respondToMeeting,
  cancelMeeting,
} from "../controllers/meetingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, scheduleMeeting);
router.get("/", protect, getMyMeetings);
router.put("/:id/respond", protect, respondToMeeting);
router.delete("/:id", protect, cancelMeeting);

export default router;
