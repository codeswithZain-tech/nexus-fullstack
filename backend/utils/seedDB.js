/**
 * Seed Script — Resets the Nexus database to a clean state with 2 demo users.
 *
 * Usage:  node utils/seedDB.js
 *
 * This deletes ALL existing users, meetings, documents, transactions and messages
 * then creates exactly:
 *   1. Sarah Chen        — Entrepreneur
 *   2. Michael Rodriguez — Investor
 *
 * Both use password: password123
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import Document from "../models/Document.js";
import Transaction from "../models/Transaction.js";
import Message from "../models/Message.js";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // ---------- Wipe everything ----------
    await User.deleteMany({});
    await Meeting.deleteMany({});
    await Document.deleteMany({});
    await Transaction.deleteMany({});
    await Message.deleteMany({});
    console.log("🗑️  All collections cleared");

    // ---------- Create demo users ----------
    const entrepreneur = await User.create({
      name: "Sarah Chen",
      email: "sarah@techwave.io",
      password: "password123",
      role: "entrepreneur",
      bio: "Serial entrepreneur with 10+ years in AI/ML startups. Founded TechWave to revolutionize business analytics using artificial intelligence.",
      avatarUrl: "",
      startupHistory: [
        {
          name: "TechWave AI",
          description:
            "AI-powered business analytics platform that helps enterprises make data-driven decisions in real time.",
          stage: "seed",
          fundingNeeded: 500000,
        },
      ],
      preferences: {
        sectors: ["AI/ML", "SaaS", "Analytics"],
      },
      twoFactorEnabled: false,
      isVerified: false,
    });

    const investor = await User.create({
      name: "Michael Rodriguez",
      email: "michael@vcinnovate.com",
      password: "password123",
      role: "investor",
      bio: "Managing Partner at VC Innovate. 15+ years investing in early-stage technology companies across AI, FinTech, and HealthTech.",
      avatarUrl: "",
      investmentHistory: [
        {
          startupName: "DataSync Inc.",
          amount: 250000,
          year: 2024,
          sector: "SaaS",
        },
        {
          startupName: "HealthBridge",
          amount: 500000,
          year: 2023,
          sector: "HealthTech",
        },
      ],
      preferences: {
        sectors: ["AI/ML", "FinTech", "HealthTech", "SaaS"],
        minTicketSize: 100000,
        maxTicketSize: 1000000,
      },
      twoFactorEnabled: false,
      isVerified: false,
    });

    console.log("👤 Created entrepreneur:", entrepreneur.email);
    console.log("👤 Created investor:    ", investor.email);
    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Demo Credentials:");
    console.log("   Entrepreneur → sarah@techwave.io / password123");
    console.log("   Investor     → michael@vcinnovate.com / password123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
