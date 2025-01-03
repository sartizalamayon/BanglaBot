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

const generationTitleConfig = {
    temperature: 1.2,
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        caption: {
          type: "string"
        },
        file_name: {
          type: "string"
        }
      },
      required: [
        "title",
        "caption",
        "file_name"
      ]
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

async function generateMetadata(text) {
    const chatSession = model.startChat({
        generationConfig: generationTitleConfig,
        history: [
            {
                role: "user",
                parts: [
                    {
                        text: `The goal is to enable the model to generate an appropriate title, caption, and a possible file name for a given Bangla text or paragraph.`
                    }
                ]
            }
        ]
    });

    const result = await chatSession.sendMessage(text);
    res = result.response.text();
    console.log(res);
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


        app.post('/api/generate-metadata', async (req, res) => {
            try {
                const { text } = req.body;
                
                if (!text) {
                    return res.status(400).json({ error: 'Text is required' });
                }
        
                const metadata = await generateMetadata(text);
                
                res.send( metadata );
        
            } catch (error) {
                console.error('Metadata generation error:', error);
                res.status(500).json({ error: 'Metadata generation failed' });
            }
        });

        const generatedPDFs = db.collection("generatedPDFs");
        app.post('/api/generate_pdf', async (req, res) => {
            try {
                const { text, email } = req.body;
                
                // Input validation
                if (!text || !email) {
                    return res.status(400).json({ 
                        error: 'Both text and email are required' 
                    });
                }
        
                // Generate metadata using existing function
                const metadata = await generateMetadata(text);
        
                // Create document to insert
                const pdfDocument = {
                    email: email,
                    text: text,
                    title: metadata.title,
                    caption: metadata.caption,
                    filename: metadata.file_name,
                    date: new Date(),
                };
        
                // Insert into MongoDB
                const result = await generatedPDFs.insertOne(pdfDocument);
        
                // Send success response
                res.json({
                    success: true,
                    message: 'PDF metadata saved successfully',
                    data: pdfDocument
                });
        
            } catch (error) {
                console.error('PDF generation error:', error);
                res.status(500).json({ 
                    error: 'Failed to generate and save PDF metadata' 
                });
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