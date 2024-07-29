import nodemailer from "nodemailer";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
  host: process.env.SEND_EMAIL_STMP_HOST, // Replace with your SMTP server
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SEND_EMAIL_USER_EMAIL, // Replace with your email
    pass: process.env.SEND_EMAIL_USER_PASS, // Replace with your email password
  },
});
console.log(transporter);

export const sendEmail = async (to: string, subject: string, html: string) => {
  console.log();
  const info = await transporter.sendMail({
    from: `"Crew Fireworks" <${process.env.SEND_EMAIL_USER_EMAIL}>`, // Replace with your from email
    to,
    subject,
    html,
  });
  console.log("Email sent successfully.");
  console.log("Info object:", info);
};

// Function to generate the email HTML content
export const generateEmailHtml = (purchase: any) => {
  return `
    <h1>New Order for Shipping</h1>
    <p>Order ID: ${purchase.id}</p>
    <p>User ID: ${purchase.userId}</p>
    <p>Amount: ${purchase.amount}</p>
    <p>Purchase Items:</p>
    <ul>
      ${purchase.PurchaseItems.map(
        (item: any) => `
        <li>${item.quantity} ${
          item.isUnit ? "Units" : "Cases"
        } of Product ID: ${item.productId}</li>
      `
      ).join("")}
    </ul>
  `;
};

const sendDailyUnitBreakEmail = async () => {
  const breakRequests = await prisma.breakCaseRequest.findMany({
    include: { Product: true },
  });

  if (breakRequests.length > 0) {
    const emailContent = `
      <h1>Daily Unit Break Requests</h1>
      <ul>
        ${breakRequests
          .map(
            (request) => `
          <li>${request.quantity} units of Product ID: ${request.productId}</li>
        `
          )
          .join("")}
      </ul>
    `;

    const staffEmail = process.env.SEND_EMAIL_TO_EMAIL || ""; // Replace with actual staff email
    await sendEmail(staffEmail, "Daily Unit Break Requests", emailContent);

    // Clear the break requests after sending the email
    await prisma.breakCaseRequest.deleteMany();
  }
};

transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

const subject = "Testing email script";
const body = "This is a test email sent from a Node.js script.";
sendEmail(process.env.SEND_EMAIL_TO_EMAIL!, subject, body);

// Schedule the cron job to run at 5 PM every day
cron.schedule("0 17 * * *", sendDailyUnitBreakEmail);
