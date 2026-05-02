import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "fancy-beetle-112031.upstash.io",
  port: 6379,
  username: "default",
  password: "gQAAAAAAAbWfAAIgcDI0NTdiYjdmYzI0YzY0NjgyOTlkZTM4NDAwYTA3NmRjNg",
  tls: {},
  maxRetriesPerRequest: null,
});

export const scanQueue = new Queue("scan-queue", {
  connection,
});