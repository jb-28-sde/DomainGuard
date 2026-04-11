import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import cron from "node-cron";
import cors from "cors";
// 1. IMPORT THE LOGGER AT THE TOP
import logger from "./Middlewares/Logger.js"; 
import scanRoutes from "./Routes/ScanRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({origin: 'http://127.0.0.1:5500'}));
app.use('/api',scanRoutes);


// 2. LOG THE DATABASE CONNECTION
connectDB();
logger.info("DATABASE: Connection attempt initiated.");

const PORT = process.env.PORT || 4001;

// 3. UPDATE THE SERVER START TO USE LOGGER
app.listen(PORT, () => {
    logger.info(`SERVER: System successfully started on port ${PORT}`);
});

// 4. ADD A TEST TRIGGER FOR THE CRON LOG (Milestone 36)
cron.schedule('* * * * *', () => {
    logger.info("CRON EVENT: Automated system check performed.");
});
