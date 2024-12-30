const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000; // Use dynamic port in production (Render)

app.use(
  cors({
    origin: "https://pending-oo5r.onrender.com", // Replace with your actual frontend URL on Render
  })
);
app.use(express.json());

// Setup Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create directory if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file naming
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Nodemailer transporter configuration
const transporter1 = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const transporter2 = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER2,
    pass: process.env.GMAIL_PASS2,
  },
});

// Handle POST request to /send-email
app.post("/send-email", upload.single("resume"), async (req, res) => {
  try {
    // Extract form fields
    const { fullName, email, mobile, gender, languages, designation } =
      req.body;
    const resumeFile = req.file;

    // Validate form fields
    if (!resumeFile) {
      return res.status(400).json({ error: "Resume file is required." });
    }
    if (
      !fullName ||
      !email ||
      !mobile ||
      !gender ||
      !languages ||
      !designation
    ) {
      return res
        .status(400)
        .json({ error: "All fields are required, including the resume file." });
    }

    // --- Mail 1: Send confirmation email to the user ---
    const mailOptionsToUser = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Internship Application Received - Elevix`,
      text: `Hello ${fullName},\n\nThank you for applying for the internship opportunity at Elevix. We have successfully received your application and will begin reviewing it shortly.\n\nOur team carefully reviews all applications, and we will get back to you as soon as possible with the next steps. If your profile matches the requirements for the role, we will contact you directly to arrange an interview.\n\nWe appreciate your interest in joining Elevix and your patience throughout this process.\n\nThank you again, and we look forward to being in touch soon!\nBest regards,\nelvix`,
    };

    // --- Mail 2: Send application details to admin email ---
    const mailOptionsToAdmin = {
      from: process.env.GMAIL_USER2,
      to: process.env.ADMIN_EMAIL,
      subject: `New Application Received from ${fullName}`,
      text: `A new application has been submitted. Here are the details:
      
      Name: ${fullName}
      Email: ${email}
      Mobile: ${mobile}
      Gender: ${gender}
      Designation: ${designation}
      Languages Known: ${languages}
      
      Please find the attached resume.`,
      attachments: [
        {
          filename: resumeFile.originalname,
          path: `./uploads/${resumeFile.filename}`, // Path to the uploaded file
        },
      ],
    };

    // Send emails
    await transporter1.sendMail(mailOptionsToUser);
    await transporter2.sendMail(mailOptionsToAdmin);

    res.status(200).json({ message: "Application submitted successfully!" });
  } catch (error) {
    console.error("[ERROR] Error processing request:", error);
    if (error instanceof multer.MulterError) {
      res.status(400).json({
        error: "File upload error. Please check the file and try again.",
      });
    } else {
      res.status(500).json({ error: "Internal server error." });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
