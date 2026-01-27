import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from 'cors'
import errorHandler from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import router from "./routes";
import { userRouter } from "./modules/user/user.route";




const app = express();

app.use(cors({
    origin:process.env.APP_URL || "http://localhost:3000",
    credentials: true
}))
app.use(express.json());

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use("/api/v1", router)



app.get("/", (req, res) => {
  res.send("SkillBridge API is running");
});


app.use(notFound)

app.use(errorHandler)

export default app;