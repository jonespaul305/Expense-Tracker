const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// =============================
// CHECK USERS
// =============================
app.get("/check-users", (req, res) => {
    db.query("SELECT id, login_id, name FROM users", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// =============================
// REGISTER
// =============================
app.post("/register", async (req, res) => {
    try {
        const { login_id, name, password } = req.body;

        if (!login_id || !name || !password) {
            return res.json({ success: false, message: "All fields required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (login_id, name, password) VALUES (?, ?, ?)",
            [login_id, name, hashedPassword],
            (err) => {
                if (err) {
                    console.log(err);
                    return res.json({ success: false, message: "User already exists" });
                }
                res.json({ success: true });
            }
        );
    } catch (error) {
        res.json({ success: false });
    }
});


// =============================
// LOGIN
// =============================
app.post("/login", async (req, res) => {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
        return res.json({ success: false });
    }

    db.query(
        "SELECT * FROM users WHERE login_id=?",
        [login_id],
        async (err, results) => {

            if (err) {
                console.log(err);
                return res.json({ success: false });
            }

            if (results.length === 0) {
                return res.json({ success: false });
            }

            const user = results[0];

            const match = await bcrypt.compare(password, user.password);

            if (match) {
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        login_id: user.login_id,
                        name: user.name
                    }
                });
            } else {
                res.json({ success: false });
            }
        }
    );
});


// =============================
// ADD EXPENSE
// =============================
app.post("/add-expense", (req, res) => {
    const { user_id, amount, category, date } = req.body;

    if (!user_id || !amount || !category || !date) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO expenses (user_id, amount, category, date) VALUES (?, ?, ?, ?)",
        [user_id, amount, category, date],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});


// =============================
// UPDATE EXPENSE
// =============================
app.put("/update-expense/:id", (req, res) => {
    const id = req.params.id;
    const { amount, category, date } = req.body;

    db.query(
        "UPDATE expenses SET amount=?, category=?, date=? WHERE id=?",
        [amount, category, date, id],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});


// =============================
// DELETE EXPENSE
// =============================
app.delete("/delete-expense/:id", (req, res) => {
    const id = req.params.id;

    db.query(
        "DELETE FROM expenses WHERE id=?",
        [id],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});


// =============================
// GET ALL EXPENSES (VERY IMPORTANT FIX)
// =============================
app.get("/expenses/:user_id", (req, res) => {
    const { user_id } = req.params;

    db.query(
        "SELECT * FROM expenses WHERE user_id=? ORDER BY date DESC",
        [user_id],
        (err, results) => {
            if (err) return res.json([]);
            res.json(results);
        }
    );
});


// =============================
// GET EXPENSES FILTER BY MONTH
// =============================
app.get("/expenses/:user_id/:month", (req, res) => {
    const { user_id, month } = req.params;

    db.query(
        "SELECT * FROM expenses WHERE user_id=? AND DATE_FORMAT(date, '%Y-%m')=? ORDER BY date DESC",
        [user_id, month],
        (err, results) => {
            if (err) return res.json([]);
            res.json(results);
        }
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});