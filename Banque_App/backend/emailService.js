const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendOTP = async (toEmail, otp) => {
  if (!toEmail) {
    console.error('Adresse email manquante pour envoi OTP');
    return;
  }

  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: toEmail, 
      subject: 'Votre code OTP',
      text: `Voici votre code OTP : ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP envoyé à ${toEmail} : ${otp}`);
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'OTP :', err);
  }
};

module.exports = { sendOTP };
