const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());

// Enable CORS
app.use(cors());

const PORT = process.env.PORT || 3000;

// Primary email transport
const primaryTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "senderemail",
    pass: "senderpassword",
  },
});

// Backup email transport
const backupTransport = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: "senderemailbackup",
    pass: "passwordemailbackup",
  },
});

const sendEmail = async (to, subject, text) => {
  let attempts = 0;
  let success = false;

  while (attempts < 3 && !success) {
    try {
      await primaryTransport.sendMail({
        from: "your-primary-email@gmail.com",
        to,
        subject,
        text,
      });
      success = true;
    } catch (error) {
      attempts++;
      console.log(`Primary email service failed. Attempt ${attempts}`);
      if (attempts === 3) {
        console.log("Switching to backup email service");
        try {
          await backupTransport.sendMail({
            from: "your-backup-email@hotmail.com",
            to,
            subject,
            text,
          });
          success = true;
        } catch (backupError) {
          console.error("Backup email service also failed");
        }
      }
    }
  }

  if (!success) {
    console.error("Failed to send email after 3 attempts");
  }
};

app.post("/send-notification", async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    await sendEmail(to, subject, text);
    res.status(200).send("Notification sent");
  } catch (error) {
    res.status(500).send("Failed to send notification");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
