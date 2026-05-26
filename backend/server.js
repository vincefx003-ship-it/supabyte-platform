require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

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

    console.error(
      "❌ Telegram failed:",
      error.code || error.message
    );

  }
}

/*
  🗂 TEMP LOCAL DATABASE
*/
let requests = [];

/*
  🏠 HOME ROUTE
*/
app.get("/", (req, res) => {
  res.send("🚀 Supabyte Local Backend Running...");
});

/*
  📥 SUBMIT REQUEST
*/
app.post("/submit-request", async (req, res) => {

  try {

    const requestData = req.body;

    /*
      SMART ROUTING
    */
    let assignedTo = "General Desk";

    if (
      requestData.service ===
      "KUCCPS Application"
    ) {

      assignedTo = "Education Desk";

    } else if (
      requestData.service ===
      "eCitizen Services"
    ) {

      assignedTo =
        "Government Services Desk";

    } else if (
      requestData.service ===
      "Printing & Scanning"
    ) {

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
      SAVE LOCALLY
    */
    requests.push(newRequest);

    console.log("🔥 Request saved locally");

    /*
      TELEGRAM MESSAGE
    */
    const telegramMessage =
      "🚨 NEW SERVICE REQUEST\n\n" +
      `👤 Name: ${newRequest.name}\n` +
      `📞 Phone: ${newRequest.phone}\n` +
      `🛠 Service: ${newRequest.service}\n` +
      `📌 Assigned To: ${newRequest.assignedTo}\n` +
      `📅 Time: ${new Date().toLocaleString()}`;

    await sendTelegramNotification(
      telegramMessage
    );

    /*
      TERMINAL LOG
    */
    console.log("\n==============================");
    console.log("🚨 NEW SERVICE REQUEST");
    console.log("==============================");
    console.log("Name:", newRequest.name);
    console.log("Phone:", newRequest.phone);
    console.log("Service:", newRequest.service);
    console.log("Assigned To:", newRequest.assignedTo);
    console.log("==============================\n");

    /*
      RESPONSE
    */
    res.json({
      success: true,
      message:
        "Request submitted successfully",
      data: newRequest
    });

  } catch (error) {

    console.error(
      "❌ Submit error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });

  }

});

/*
  📄 GET ALL REQUESTS
*/
app.get("/requests", (req, res) => {

  res.json(requests);

});
app.post("/requests", (req, res) => {
  const newRequest = req.body;

  requests.push(newRequest);

  console.log("Received request:", newRequest);

  res.json({
    success: true,
    message: "Request saved successfully"
  });
});

/*
  🔄 UPDATE STATUS
*/
app.put("/update-status/:id", (req, res) => {

  const id = Number(req.params.id);

  const { status } = req.body;

  const request = requests.find(
    r => r.id === id
  );

  if (!request) {

    return res.status(404).json({
      message: "Request not found"
    });

  }

  request.status = status;

  res.json({
    success: true,
    message: "Status updated"
  });

});

/*
  👤 ASSIGN TASK
*/
app.put("/assign-task/:id", (req, res) => {

  const id = Number(req.params.id);

  const { assignedTo } = req.body;

  const request = requests.find(
    r => r.id === id
  );

  if (!request) {

    return res.status(404).json({
      message: "Request not found"
    });

  }

  request.assignedTo = assignedTo;

  res.json({
    success: true,
    message: "Task assigned"
  });

});

/*
  🚀 START SERVER
*/
app.listen(PORT, () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );

});