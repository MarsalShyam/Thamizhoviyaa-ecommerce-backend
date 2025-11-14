// /backend/routes/pdfRoutes.js
import express from "express";
import { generateInvoicePDF } from "../controllers/pdfController.js";

const router = express.Router();

// GET /api/pdf/invoice/:orderId
// Returns a generated PDF invoice + shipping label for an order
router.get("/invoice/:orderId", generateInvoicePDF);

export default router;
