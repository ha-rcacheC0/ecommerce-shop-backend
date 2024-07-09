import nodemailer from "nodemailer";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const transporter = nodemailer.createTransport({
  host: "smtp.example.com", // Replace with your SMTP server
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "your_email@example.com", // Replace with your email
    pass: "your_email_password", // Replace with your email password
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: '"Your Company" <your_email@example.com>', // Replace with your from email
    to,
    subject,
    html,
  });
};

// Mock function to add purchase ID to a daily list (to be implemented)
export const addToDailyUnitBreakList = async (purchaseId: string) => {
  // Implement the logic to add the purchase ID to a daily list
  // For example, you could store it in a database table
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

const prisma = new PrismaClient();

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

    const staffEmail = "staff@example.com"; // Replace with actual staff email
    await sendEmail(staffEmail, "Daily Unit Break Requests", emailContent);

    // Clear the break requests after sending the email
    await prisma.breakCaseRequest.deleteMany();
  }
};

// Schedule the cron job to run at 5 PM every day
cron.schedule("0 17 * * *", sendDailyUnitBreakEmail);
