// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = 3000;

// Allow requests from http://localhost:4200
app.use(cors({ origin: "http://localhost:4200" }));

// PostgreSQL database configuration
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "pablo",
  port: 5432,
});

// Middleware
app.use(bodyParser.json());

// Test Database Connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Database connection successful!");
    release(); // Release the client to the pool
  }
});

//Middleware
app.use(bodyParser.json());

// Routes
// POST a new item
app.post("/items", async (req, res) => {
  const { name, description } = req.body;

  try {
    // Get the maximum ID from the items table
    const { rows: maxIdRows } = await pool.query(
      "SELECT MAX(id) AS max_id FROM items"
    );
    const nextId = maxIdRows[0].max_id + 1;

    // Insert the new item with the generated ID
    const { rows } = await pool.query(
      "INSERT INTO items (id, name, description) VALUES ($1, $2, $3) RETURNING *",
      [nextId, name, description]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update an item by ID
app.put("/items/:id", async (req, res) => {
  const itemId = req.params.id;
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, itemId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE an item by ID
app.delete("/items/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    const { rows } = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [itemId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all items
app.get("/items", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM items");
    res.json(rows);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET a single item by ID
app.get("/items/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [
      itemId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
