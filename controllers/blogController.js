// backend/controllers/blogController.js
import asyncHandler from 'express-async-handler';
import Blog from '../models/Blog.js';

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ isPublished: true }).sort({ publishDate: -1 });
  res.json(blogs);
});

// @desc    Get single blog details
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog post not found');
  }
});

// @desc    Get all blogs (Admin only)
// @route   GET /api/blogs/admin
// @access  Private/Admin
const getAdminBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({}).sort({ createdAt: -1 });
  res.json(blogs);
});

// @desc    Create a blog post
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = asyncHandler(async (req, res) => {
  const { title, thumbnail, author, content, category, isPublished } = req.body;

  if (!title || !thumbnail || !author || !content) {
    res.status(400);
    throw new Error('Please enter all required fields (title, thumbnail, author, content)');
  }

  const blog = new Blog({
    title,
    thumbnail,
    author,
    content,
    category: category || 'General',
    isPublished: isPublished !== undefined ? isPublished : true,
    publishDate: Date.now(),
  });

  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
});

// @desc    Update a blog post
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = asyncHandler(async (req, res) => {
  const { title, thumbnail, author, content, category, isPublished } = req.body;

  const blog = await Blog.findById(req.params.id);

  if (blog) {
    blog.title = title || blog.title;
    blog.thumbnail = thumbnail || blog.thumbnail;
    blog.author = author || blog.author;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    if (isPublished !== undefined) {
      blog.isPublished = isPublished;
    }

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } else {
    res.status(404);
    throw new Error('Blog post not found');
  }
});

// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (blog) {
    await blog.deleteOne();
    res.json({ message: 'Blog post removed' });
  } else {
    res.status(404);
    throw new Error('Blog post not found');
  }
});

export {
  getBlogs,
  getBlogById,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
};
