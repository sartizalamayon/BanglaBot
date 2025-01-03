const express = require('express');
const cors = require('cors');
require('dotenv').config();
//
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs').promises;
const multer = require("multer"); 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GeminiApi);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });


app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b6ckjyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("BanglaBot"); // Database name
        const users = db.collection("users"); 
    
    } catch (e) {
        console.error(e);
    }
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
}
);