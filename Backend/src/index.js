import Express, { urlencoded } from "express";
import dotenv from "dotenv";
import router from "./routes/index.js";
import cors from "cors";
import { logMiddleware } from "./models/logMiddleware.js";

dotenv.config();
const app = Express();

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 3000;

// * Middleware configuration *

app.use(logMiddleware);
app.use(cors());
app.use(Express.json());
app.use(urlencoded({ extended: false }));

// user routes here
app.use("/", router);

app.listen(port, host, () => {
  console.log(`Server is running. visit http://${host}:${port}/`);
});



