
import "dotenv/config";

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg(process.env.DATABASE_URL);



const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
});

// Connect to the database
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("db connected via prisma");
    } catch (error) {
        console.log(`Database connection error: ${error.message}`);
        process.exit(1);
    }
}

const disconnectDB = async () => {
    await prisma.$disconnect();
}


export {prisma , connectDB ,disconnectDB};