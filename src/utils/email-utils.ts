import nodemailer from "nodemailer";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { PurchaseItem, PurchaseRecord } from "./types";

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

export const sendEmail = async (to: string, subject: string, html: string) => {
  console.log();
  const info = await transporter.sendMail({
    from: `"Crew Fireworks" <${process.env.SEND_EMAIL_USER_EMAIL}>`, // Replace with your from email
    to,
    subject,
    html,
  });
  console.log("Email sent successfully.");
};

// Function to generate the email HTML content
export const generateEmailHtml = (purchase: PurchaseRecord) => {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(purchase.amount.toNumber());

  return `
    <div style="font-family: Arial, sans-serif; color: #333; width:80%; margin:5% auto;">
      <h1 style="color: #007BFF;">New Order for Shipping</h1>

      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Customer Information</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 8px;"><strong>First Name:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">${
            purchase.User.profiles?.firstName
          }</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 8px;"><strong>Last Name:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">${
            purchase.User.profiles?.lastName
          }</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 8px;"><strong>Phone Number:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">${
            purchase.User.profiles?.phoneNumber
          }</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 8px;"><strong>Email Address:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">${
            purchase.User.email
          }</td>
        </tr>
      </table>

      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 8px;"><strong>Order ID:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">${
            purchase.id
          }</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 8px;"><strong>Amount:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">${formattedAmount}</td>
        </tr>
      </table>

      <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Shipping Address</h3>
      <p style="margin: 0 0 20px 0;">${purchase.shippingAddress.street1} ${
    purchase.shippingAddress.street2 ?? ""
  }<br>${purchase.shippingAddress.city}, ${
    purchase.shippingAddress.state
  }<br> ${purchase.shippingAddress.postalCode}</p>

      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px; text-align:center;">Purchase Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">SKU</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Quantity</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Form</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Title</th>
          </tr>
        </thead>
        <tbody>
          ${purchase.PurchaseItems.map(
            (item: PurchaseItem) => `
            <tr>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${
                item.Product.sku
              }</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${
                item.quantity
              }</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${
                item.isUnit ? "Unit" : "Case"
              }</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${
                item.Product.title
              }</td>
            </tr>
            `
          ).join("")}
        </tbody>
      </table>
    </div>
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
          <li>${request.quantity} units of Product ID: ${request.Product.sku}</li>
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

// Schedule the cron job to run at 5 PM every day
cron.schedule("0 17 * * *", sendDailyUnitBreakEmail);
