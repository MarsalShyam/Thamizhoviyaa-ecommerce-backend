// /backend/controllers/pdfController.js
import PDFDocument from "pdfkit";
import Order from "../models/Order.js";

import path from "path";
import fs from "fs";

/**
 * Example seller details. Replace these values with your store/seller info or
 * load from process.env or a DB settings collection as you prefer.
 */
const SELLER_INFO = {
  name: "THAMIZHOVIYAA HERBAL PRODUCTS",
  addressLine1: "PAVADAI STREET, KALANGANI POST",
  addressLine2: "NAMAKKAL, TAMILNADU",
  city: "NAMAKKALr",
  postalCode: "637014",
  state: "TAMILNADU",
  phone: "9576543210",
  gstin: "21AHNPJ5720C1ZU",
};

const mm = (value) => value; // PDFKit uses points; keep simple helper if you want later scaling.

export const generateInvoicePDF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Setup PDF document
    const doc = new PDFDocument({ margin: 20, size: "A4" });

    // Stream to response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=order-${order._id}.pdf`);
    doc.pipe(res);

    // --- Header: Logo left, "Shipping Label" right
    const logoPath = path.join(process.cwd(), "public", "logo.png"); // optional store logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 20, 20, { width: 80 });
    }
    doc.fontSize(18).text("Shipping / Invoice", 0, 25, { align: "right" });
    doc.moveDown(2);

    // --- Top summary block
    doc.fontSize(10);
    const leftStart = 20;
    const rightStart = 330;

    // Order summary left
    doc.font("Helvetica-Bold").text("Order Details", leftStart, 100);
    doc.font("Helvetica").text(`Order ID: ${order._id}`, leftStart, 116);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`, leftStart);
    doc.text(`Payment: ${order.paymentMethod || "N/A"}`);
    doc.text(`Status: ${order.status || "N/A"}`);

    // Right block - routing / AWB placeholder
    doc.font("Helvetica-Bold").text("Courier / AWB", rightStart, 100);
    doc.font("Helvetica").text("AWB No.:", rightStart, 116);
    doc.font("Helvetica").text(order.trackingNumber || "N/A", rightStart);

    // Draw a thin line
    doc.moveTo(leftStart, 170).lineTo(575, 170).stroke();

    // --- Ship To (customer) and Shipped By (seller)
    doc.fontSize(11);
    const sectionTop = 180;
    const colGap = 280;

    // Ship To (Customer)
    doc.font("Helvetica-Bold").text("Ship To:", leftStart, sectionTop);
    const ship = order.shippingAddress || {};
    doc.font("Helvetica").fontSize(10)
      .text(ship.fullName || "N/A", leftStart, sectionTop + 16)
      .text(ship.address || "N/A", leftStart)
      .text(`${ship.city || ""} - ${ship.postalCode || ""}`, leftStart)
      .text(ship.state || "", leftStart)
      .text(`Phone: ${ship.phone || "N/A"}`, leftStart);

    // Shipped By (Seller)
    doc.font("Helvetica-Bold").text("Shipped By:", leftStart + colGap, sectionTop);
    doc.font("Helvetica").fontSize(10)
      .text(SELLER_INFO.name, leftStart + colGap, sectionTop + 16)
      .text(SELLER_INFO.addressLine1, leftStart + colGap)
      .text(SELLER_INFO.addressLine2, leftStart + colGap)
      .text(`${SELLER_INFO.city} - ${SELLER_INFO.postalCode}`, leftStart + colGap)
      .text(`Phone: ${SELLER_INFO.phone}`, leftStart + colGap)
      .text(`GSTIN: ${SELLER_INFO.gstin}`, leftStart + colGap);

    // Another line
    doc.moveTo(leftStart, 300).lineTo(575, 300).stroke();

    // --- Products table header
    doc.fontSize(10);
    const tableTop = 310;
    doc.font("Helvetica-Bold");
    doc.text("Product Name & SKU", leftStart, tableTop, { width: 260 });
    doc.text("HSN", leftStart + 260, tableTop, { width: 60 });
    doc.text("Qty", leftStart + 320, tableTop, { width: 40, align: "right" });
    doc.text("Unit Price", leftStart + 360, tableTop, { width: 70, align: "right" });
    doc.text("Total", leftStart + 430, tableTop, { width: 80, align: "right" });

    doc.font("Helvetica").moveDown(0.5);

    // List products
    let y = tableTop + 18;
    order.orderItems.forEach((item) => {
      const nameWrapHeight = doc.heightOfString(item.name, { width: 260 });
      doc.font("Helvetica").fontSize(9);
      doc.text(item.name, leftStart, y, { width: 260 });
      doc.text(item.hsn || "", leftStart + 260, y);
      doc.text(String(item.qty), leftStart + 320, y, { width: 40, align: "right" });
      doc.text(`₹${(item.price).toFixed(2)}`, leftStart + 360, y, { width: 70, align: "right" });
      doc.text(`₹${(item.qty * item.price).toFixed(2)}`, leftStart + 430, y, { width: 80, align: "right" });
      y += Math.max(nameWrapHeight, 16);
      // page break if needed
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
    });

    // --- Price summary block (right side below table)
    const summaryTop = Math.max(y + 10, 420);
    const summaryLeft = 360;
    doc.font("Helvetica-Bold").fontSize(11).text("Price Summary", summaryLeft, summaryTop);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Items Total: ₹${(order.itemsPrice || 0).toFixed(2)}`, summaryLeft, summaryTop + 20, { align: "left" });
    doc.text(`GST: ₹${(order.taxPrice || 0).toFixed(2)}`, summaryLeft, summaryTop + 36, { align: "left" });
    doc.text(`Shipping: ₹${(order.shippingPrice || 0).toFixed(2)}`, summaryLeft, summaryTop + 52, { align: "left" });
    doc.font("Helvetica-Bold").text(`Grand Total: ₹${(order.totalPrice || 0).toFixed(2)}`, summaryLeft, summaryTop + 76);

    // footer note
    doc.fontSize(9).font("Helvetica").text("Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.", leftStart, 760, { width: 540, align: "center" });

    // finalize the PDF and end the stream
    doc.end();
    // doc.pipe(res) was already set above.
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
};
