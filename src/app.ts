import express from "express";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.disable("x-powered-by");

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
