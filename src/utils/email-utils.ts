import nodemailer from "nodemailer";
import cron from "node-cron";
import { BreakCaseRequest, PrismaClient } from "@prisma/client";
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

// Utility function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Standard email template function
export const generateEmailHtml = (purchase: PurchaseRecord): string => {
  const formattedAmount = formatCurrency(purchase.amount.toNumber());
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

      ${
        purchase.hasUnits
          ? `
      <div style="padding: 1rem; margin-bottom: 20px; border: 2px solid #FFA500; background-color: #FFF3CD; color: #856404; border-radius: 5px;">
        <strong>Attention:</strong> This order includes units to be added later. Please hold the order until all units are added.
      </div>`
          : ""
      }

      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px; text-align:center;">Purchase Items</h2>
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

// Function to generate the inventory request email
export const generateInventoryEmailHtml = (
  purchase: PurchaseRecord,
  inventoryItems: PurchaseItem[],
  caseBreakRequests: any
): string => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; width:80%; margin:5% auto;">
      <h1 style="color: #007BFF;">Inventory Request - Order ${purchase.id}</h1>

      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Items from Inventory</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">SKU</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Title</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Quantity from Inventory</th>
          </tr>
        </thead>
        <tbody>
          ${inventoryItems
            .map(
              (item) => `
            <tr>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${item.Product.sku}</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${item.Product.title}</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${item.quantity}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      ${
        caseBreakRequests.length > 0
          ? `
      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">New Case Break Requests</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Product Sku</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Product Title</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${caseBreakRequests
            .map(
              (request: any) => `
            <tr>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${request.Product.sku}</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${request.Product.title}</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${request.quantity}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }
    </div>
  `;
};

// Function to generate the case break request email template
export const generateCaseBreakEmailHtml = (
  purchase: PurchaseRecord,
  caseBreakRequests: any
): string => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; width:80%; margin:5% auto;">
      <h1 style="color: #007BFF;"> Case Break Request - Order ${
        purchase.id
      }</h1>
      <p> Cases to be purchased by Crew Fireworks for this order.</p> 

      <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Products Requiring Case Breaks</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Product Sku</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Product Title</th>
            <th style="border-bottom: 1px solid #eee; padding: 8px;">Quantity for Order</th>
          </tr>
        </thead>
        <tbody>
          ${caseBreakRequests
            .map(
              (request: any) => `
            <tr>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${request.Product.sku}</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${request.Product.title}</td>
              <td style="border-bottom: 1px solid #eee; padding: 8px; text-align:center;">${request.quantity}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
};
