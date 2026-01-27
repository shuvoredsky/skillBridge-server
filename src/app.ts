import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from 'cors'
import errorHandler from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";




const app = express();

app.use(cors({
    origin:process.env.APP_URL || "http://localhost:3000",
    credentials: true
}))

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());



app.get("/", (req,res)=>{
    res.send("Hello this is blog app")
})


app.get("/", (req, res)=>{
    res.send("Hello, World")
})

app.use(notFound)

app.use(errorHandler)

export default app;