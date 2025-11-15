import express, { type Express } from "express";
import cors from "cors";
import routes from "./routes";
import notFoundHandler from "./middlewares/notFoundHandler";
import errorHandler from "./middlewares/errorHandler";
import apiKeyAuth from "./middlewares/apiKeyAuth";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiKeyAuth, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

