const express = require('express');
const cors = require('cors');
require('dotenv').config();
//
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const fs = require('fs').promises;
const multer = require("multer"); 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});


const generationConfig = {
    temperature: 1.25,
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        convertedBangla: {
          type: "string"
        }
      }
    },
};


app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b6ckjyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


async function convert(text) {
    const chatSession = model.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [{ text: `I want you to convert this benglish text to plain bangla: ${text}` }],
            }
        ],
    });

    const result = await chatSession.sendMessage(text);
    res = result.response.text();
    return res;
}
  


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


        app.post('/api/convert', async (req, res) => {
            try {
                const { text } = req.body;
                
                if (!text) {
                    return res.status(400).json({ error: 'Text is required' });
                }
        
                const convertedText = await convert(text);
                res.send( convertedText );
            } catch (error) {
                console.error('Conversion error:', error);
                res.status(500).json({ error: 'Conversion failed' });
            }
        });
    
    } catch (e) {
        console.error(e);
    }
}
run().catch(console.dir);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello World!');
}
);