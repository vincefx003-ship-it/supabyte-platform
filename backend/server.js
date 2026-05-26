require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");

const { db, bucket } = require("./config/firebase");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

/*
  🔐 TELEGRAM CONFIG
*/
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/*
  📩 TELEGRAM FUNCTION
*/
async function sendTelegramNotification(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const res = await axios.post(
      url,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      },
      {
        timeout: 15000,
        family: 4
      }
    );

    console.log("✅ Telegram sent:", res.data);

  } catch (error) {
    console.error("❌ Telegram failed:", error.code || error.message);
  }
}

/*
  📦 FILE UPLOAD (Firebase Storage)
*/
const upload = multer({ storage: multer.memoryStorage() });

/*
  🏠 HOME
*/
app.get("/", (req, res) => {
  res.send("🚀 Supabyte Firebase Backend Running...");
});

/*
  📥 SUBMIT REQUEST (Firestore + Telegram)
*/
app.post("/submit-request", async (req, res) => {
  try {
    const requestData = req.body;

    /*
      SMART ROUTING
    */
    let assignedTo = "General Desk";

    if (requestData.service === "KUCCPS Application") {
      assignedTo = "Education Desk";
    } else if (requestData.service === "eCitizen Services") {
      assignedTo = "Government Services Desk";
    } else if (requestData.service === "Printing & Scanning") {
      assignedTo = "Cyber Desk";
    }

    /*
      CREATE REQUEST
    */
    const newRequest = {
      id: Date.now(),
      ...requestData,
      assignedTo,
      status: "Pending",
      createdAt: new Date()
    };

    /*
      SAVE TO FIRESTORE
    */
    await db.collection("requests").add(newRequest);
    console.log("🔥 Saved to Firestore");

    /*
      TELEGRAM MESSAGE
    */
    const telegramMessage =
      "🚨 <b>NEW SERVICE REQUEST</b>\n\n" +
      `👤 Name: ${newRequest.name}\n` +
      `📞 Phone: ${newRequest.phone}\n` +
      `🛠 Service: ${newRequest.service}\n` +
      `📌 Assigned To: ${newRequest.assignedTo}\n` +
      `📅 Time: ${new Date().toLocaleString()}`;

    await sendTelegramNotification(telegramMessage);

    /*
      RESPONSE
    */
    res.json({
      success: true,
      message: "Request submitted successfully",
      data: newRequest
    });

  } catch (error) {
    console.error("❌ Submit error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/*
  📤 FILE UPLOAD (Firebase Storage)
*/
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(fileName);

    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    stream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    });

    stream.on("finish", async () => {
      await fileRef.makePublic();

      const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.json({
        success: true,
        url
      });
    });

    stream.end(file.buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/*
  📄 GET REQUESTS (Firestore)
*/
app.get("/requests", async (req, res) => {
  try {
    const snapshot = await db.collection("requests").get();

    let requests = [];

    snapshot.forEach(doc => {
      requests.push({
        docId: doc.id,
        ...doc.data()
      });
    });

    res.json(requests);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

/*
  🚀 START SERVER
*/
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});