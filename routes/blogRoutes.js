// backend/routes/blogRoutes.js
import express from 'express';
import {
  getBlogs,
  getBlogById,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blogController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/')
  .get(getBlogs)
  .post(protect, admin, createBlog);

router.route('/admin')
  .get(protect, admin, getAdminBlogs);

router.route('/:id')
  .get(getBlogById)
  .put(protect, admin, updateBlog)
  .delete(protect, admin, deleteBlog);

export default router;
