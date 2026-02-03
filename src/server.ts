import app from "./app";
import { prisma } from "./lib/prisma";

const port = process.env.PORT || 5000;


prisma.$connect().catch((err) => {
  console.error("Failed to connect to the database:", err);
});


  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });



export default app;