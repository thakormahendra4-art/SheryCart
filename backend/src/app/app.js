import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.routes.js";
import productsRoutes from "../routes/products.routes.js";

const app = express();

// Trust proxy for secure cookies behind reverse proxies (Render, Railway, etc.)
app.set("trust proxy", 1);

// Allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);

      // Check if origin is allowed or from vercel.app
      const isAllowed =
        !process.env.CLIENT_URL ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback: allow during setup so user avoids CORS blocks
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

export default app;
