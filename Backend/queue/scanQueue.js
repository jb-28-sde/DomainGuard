import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis();

const scanQueue = new Queue("scan-queue", {
  connection,
});

export default scanQueue;