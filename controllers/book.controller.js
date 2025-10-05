const fs = require("fs");
const crypto = require("crypto");
const { sendResponse, throwError } = require("../utils/response");

// Helper đọc db.json
function readDB() {
  return JSON.parse(fs.readFileSync("db.json", "utf-8"));
}

// Helper ghi db.json
function writeDB(db) {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
}

// GET /books
exports.getBooks = (req, res, next) => {
  try {
    const allowedFilter = ["author", "country", "language", "title", "page", "limit"];
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    Object.keys(filterQuery).forEach((key) => {
      if (!allowedFilter.includes(key)) throwError(400, `Query ${key} is not allowed`);
      if (!filterQuery[key]) delete filterQuery[key];
    });

    const db = readDB();
    const { books } = db;
    let result = books;

    for (let key in filterQuery) {
      result = result.filter((book) => book[key] === filterQuery[key]);
    }

    const offset = limit * (page - 1);
    result = result.slice(offset, offset + limit);

    sendResponse(res, 200, result, "Fetched books successfully");
  } catch (error) {
    next(error);
  }
};

// POST /books
exports.createBook = (req, res, next) => {
  try {
    const { author, country, imageLink, language, pages, title, year } = req.body;
    if (!author || !country || !imageLink || !language || !pages || !title || !year)
      throwError(400, "Missing body info");

    const db = readDB();
    const newBook = {
      author,
      country,
      imageLink,
      language,
      pages: parseInt(pages),
      title,
      year: parseInt(year),
      id: crypto.randomBytes(4).toString("hex"),
    };

    db.books.push(newBook);
    writeDB(db);
    sendResponse(res, 201, newBook, "Book created successfully");
  } catch (error) {
    next(error);
  }
};

// PUT /books/:bookId
exports.updateBook = (req, res, next) => {
  try {
    const allowedFields = ["author", "country", "imageLink", "language", "pages", "title", "year"];
    const updates = req.body;
    const invalidFields = Object.keys(updates).filter((key) => !allowedFields.includes(key));
    if (invalidFields.length) throwError(400, "Invalid update fields");

    const db = readDB();
    const index = db.books.findIndex((book) => book.id === req.params.bookId);
    if (index < 0) throwError(404, "Book not found");

    db.books[index] = { ...db.books[index], ...updates };
    writeDB(db);

    sendResponse(res, 200, db.books[index], "Book updated successfully");
  } catch (error) {
    next(error);
  }
};

// DELETE /books/:bookId
exports.deleteBook = (req, res, next) => {
  try {
    const db = readDB();
    const index = db.books.findIndex((book) => book.id === req.params.bookId);
    if (index < 0) throwError(404, "Book not found");

    db.books.splice(index, 1);
    writeDB(db);

    sendResponse(res, 204, null, "Book deleted successfully");
  } catch (error) {
    next(error);
  }
};
