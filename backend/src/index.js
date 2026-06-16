require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

// 1. Initialize Passport Strategies
require("./routes/oauth");

// 2. Import Routes
const authRoutes = require("./routes/auth");
const oauthRoutes = require("./routes/oauth");
const workspaceRoutes = require("./routes/workspaces");
const resourceRoutes = require("./routes/resources");

const app = express();
const PORT = process.env.PORT || 3001;

// 3. Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = [
        process.env.CLIENT_URL,
        /\.vercel\.app$/,
      ];
      if (!origin || allowed.some(p => typeof p === "string" ? p === origin : p.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces", resourceRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// 5. Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Process terminated");
  });
});