const express = require('express');
const blogDb = require('../model/blog.model');
const uploadFile = require('../middleware/fileupload');
//  add middleware here...
const authenticate = require('../middleware/auth');
const fs = require('fs');
const router = express.Router();

// Get All Blogs
router.get('/BlogList', authenticate, (req, res, next) => {
  try {
    let { page = 1, limit = 10, search = '' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Sanitize input for LIKE queries
    const searchTerm = `%${search}%`;

    // Query to count total matching rows
    const countQuery = `
    SELECT COUNT(*) AS total 
    FROM blogposttable 
    WHERE title LIKE ? OR content LIKE ? OR author LIKE ?
  `;

    const dataQuery = `
    SELECT * FROM blogposttable 
    WHERE title LIKE ? OR content LIKE ? OR author LIKE ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ message: "Page and limit must be valid numbers", status: 400 });
    }

    blogDb.query(countQuery, [searchTerm, searchTerm, searchTerm], (err, countResult) => {
      if (err) {
        console.error('Error fetching count:', err);
        return res.status(500).json({ message: 'Internal Server Error', status: 500 });
      }

      const total = countResult[0].total;
      const offset = (page - 1) * limit;
      if (offset >= total && total > 0) {
        return res.status(404).json({ message: "Page number exceeds total pages", status: 404 });
      }
      // Then fetch paginated data
      blogDb.query(dataQuery, [searchTerm, searchTerm, searchTerm, limit, offset], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Internal Server Error', status: 500 });
        }
        if (results.length === 0) {
          return res.status(200).json({message: 'Data Not Found', status: 200, data: results});
        }
        return res.status(200).json({
          status: 200,
          message: 'Data Found',
          data: results,
          pagination: {
            totalItems: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit: limit
          }
        });
      });
    });
  }
  catch (err) {
    next(err);
  }
});

// Add Blog
router.post('/addblog', authenticate, uploadFile.single("file"), async (req, res, next) => {
  try {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ message: 'Please fill all fields', status: 400 });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required', status: 400 });
    }

    const imagePath = req.file.path;

    const query = `INSERT INTO blogposttable (title, content, author, file) VALUES (?, ?, ?, ?)`;
    blogDb.query(query, [title, content, author, imagePath], (err, result) => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).json({ message: 'Internal Server Error', status: 500 });
      }

      return res.status(201).json({
        message: 'Blog post inserted successfully',
        status: 201,
        data: {
          id: result.insertId,
          title,
          content,
          author,
          image: imagePath,
        }
      });
    });
  } catch (er) {
    next(er);
  }
});

// Update Blog
router.put('/updateBlogDetail/:id', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, content, author } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ status: 400, message: 'Invalid Blog ID' });
    }

    if (!title || !content || !author) {
      return res.status(400).json({ status: 400, message: 'All fields are required' });
    }

    const updateBlog = `UPDATE blogposttable set title = ?, content = ?, author = ? WHERE id = ?`;
    blogDb.query(updateBlog, [title, content, author, id], (err, result) => {
      if (err) {
        console.error('Error updating blog:', err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 404, message: 'Blog Not Found' });
      }

      return res.status(200).json({
        status: 200,
        message: 'Blog Updated Successfully',
        data: { id, title, content, author }
      });
    });
  } catch (er) {
    next(er);
  }
});

// Get Blog by ID
router.get('/getBlogDetailById/:id', authenticate, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ status: 400, message: 'Invalid Blog ID' });
    }

    const query = `SELECT * FROM blogposttable WHERE id = ?`;
    blogDb.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching blog:', err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ status: 404, message: 'Blog Not Found', data: {} });
      }

      return res.status(200).json({ status: 200, message: 'Blog Found', data: results[0] });
    });
  }
  catch (er) {
    next(er);
  }
});

router.delete('/deleteBlog/:id', authenticate, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ status: 400, message: 'Invalid Blog ID' });
    }
    console.log('check id', id);
    // Step 1: Get image path before deleting
    const selectQuery = `SELECT file FROM blogposttable WHERE id = ?`;
    blogDb.query(selectQuery, [id], (err, results) => {
      if (err) {
        console.log('er', err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ status: 404, message: 'Blog Not Found' });
      }

      const imagePath = results[0].file;

      // Step 2: Delete from DB
      const deleteQuery = `DELETE FROM blogposttable WHERE id = ?`;
      blogDb.query(deleteQuery, [id], (err, result) => {
        if (err) {
          return res.status(500).json({ status: 500, message: 'Internal Server Error' });
        }

        // Step 3: Delete image file
        if (imagePath && fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        return res.status(200).json({ status: 200, message: 'Blog Deleted Successfully' });
      });
    });
  }
  catch (er) {
    next(er);
  }


});

module.exports = router;