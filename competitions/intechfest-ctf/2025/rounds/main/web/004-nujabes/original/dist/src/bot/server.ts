import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { port } from "./app/config";
import { setCSPHeader } from "./app/middlewares/csp";
import csrfProtection from "./app/middlewares/csrf";
import dashboardRoutes from "./app/routes/dashboard.route";
import indexRoutes from "./app/routes/index.route";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app/views"));
app.use(express.static(path.join(__dirname, "app/public/static")));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(setCSPHeader);

// Routes
app.use("/", csrfProtection, indexRoutes);
app.use("/dashboard", dashboardRoutes);

app.listen(port, () => {
  console.log(`Bot listening on port ${port}`);
});
