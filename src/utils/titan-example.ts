const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");

// Email configuration
const senderEmail = process.env.SEND_EMAIL_USER_EMAIL;
const senderPassword = process.env.SEND_EMAIL_USER_PASS;
const recipientEmail = process.env.SEND_EMAIL_TO_EMAIL;
const subject = "Testing email script";
const body = "This is a test email sent from a Node.js script.";

// SMTP (sending) server details
const smtpServer = "SMTP.titan.email";
const smtpPort = 587;

// IMAP (receiving) server details
const imapServer = "IMAP.titan.email";
const imapPort = 993;

async function sendEmailAndAppend() {
  try {
    // Create a nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    });

    // Create the email options
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      text: body,
    };

    console.log(transporter);

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.");
    console.log("Info object:", info);

    // Append the sent email to the "Sent" folder using IMAP
    const imap = new Imap({
      user: senderEmail,
      password: senderPassword,
      host: imapServer,
      port: imapPort,
      tls: true,
    });

    imap.once("ready", () => {
      imap.openBox("Sent", true, (err: any) => {
        if (err) {
          console.error('Error opening "Sent" folder:', err);
          imap.end();
          return;
        }

        // Create the email message as MIMEText
        const emailMessage = `From: ${senderEmail}\r\nTo: ${recipientEmail}\r\nSubject: ${subject}\r\n\r\n${body}`;

        // Append the sent email to the "Sent" folder
        imap.append(emailMessage, { mailbox: "Sent" }, (appendErr: any) => {
          if (appendErr) {
            console.error('Error appending email to "Sent" folder:', appendErr);
          } else {
            console.log('Email appended to "Sent" folder.');
          }
          imap.end();
        });
      });
    });

    imap.once("error", (imapErr: any) => {
      console.error("IMAP Error:", imapErr);
    });

    imap.connect();
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Call the function to send the email and append it to the "Sent" folder
sendEmailAndAppend();
