require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

require("./routes/oauth");

const authRoutes = require("./routes/auth");
const oauthRoutes = require("./routes/oauth");
const workspaceRoutes = require("./routes/workspaces");
const resourceRoutes = require("./routes/resources");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [process.env.CLIENT_URL];
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
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

app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces", resourceRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Only listen when running locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  process.on("SIGTERM", () => {
    server.close(() => {
      console.log("Process terminated");
    });
  });
}

// Required for Vercel
module.exports = app;