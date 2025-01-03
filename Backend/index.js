const express = require('express');
const cors = require('cors');
require('dotenv').config();
const PDFDocument = require('pdfkit');
const FormData = require('form-data');
const pdfjsLib = require('pdf-parse');

async function extractTextFromPDF(pdfBuffer) {
    try {
        const data = await pdfjsLib(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
}
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

const storage = multer.memoryStorage();
const upload = multer({ 
      storage: storage,
      limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
      }
});

const visionModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash" 
});



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
                        text: `The goal is to enable the model to generate an appropriate title, caption, and a possible file name(.pdf) for a given Bangla text or paragraph.`
                    }
                ]
            }
        ]
    });

    const result = await chatSession.sendMessage(text);
    res = result.response.text();
    return res;
}

async function extractAndConvertText(imageBuffer) {
    const base64Image = imageBuffer.toString('base64');

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
        }
    };

    try {
        const parts = [
            {
                text: "Extract the Banglish text from this image and respond with ONLY the extracted text, nothing else."
            },
            imagePart
        ];

        const result = await visionModel.generateContent(parts);
        const response = await result.response;
        const extractedText = response.text();
        
        // Then convert the extracted text to Bangla
        const banglaText = await convert(extractedText);
        
        return {
            originalText: extractedText,
            convertedText: JSON.parse(banglaText).convertedBangla
        };
    } catch (error) {
        console.error('Error processing image:', error);
        if (error.message.includes('quota')) {
            throw new Error('API quota exceeded. Please try again later.');
        }
        throw error;
    }
}

async function handleChat(input, context = "") {
    const chatSession = model.startChat({
        generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        },
        history: context ? [{
            role: "user", 
            parts: [{ text: context }]
        }] : []
    });
 
    const result = await chatSession.sendMessage(input);
    return result.response.text();
}

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
});

async function handleChat(input, history = []) {
    const chatSession = model.startChat({
        generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192
        }
    });

    // If there's history, send previous messages first
    for (const msg of history) {
        await chatSession.sendMessage(msg.text);
    }

    // Send the current message
    const result = await chatSession.sendMessage(`I want you to be a helpful AI assistant that responds in Bangla language, and here is my question/query: ${input}`);
    return result.response.text();
}

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("BanglaBot"); // Database name
        const users = db.collection("users"); 
        const generatedPDFs = db.collection("generatedPDFs");


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
        const metadataResponse = await generateMetadata(text);
        
        // Parse the metadata if it's a string
        let metadata;
        if (typeof metadataResponse === 'string') {
            try {
                metadata = JSON.parse(metadataResponse);
            } catch (e) {
                console.error('Failed to parse metadata:', e);
                return res.status(500).json({ error: 'Failed to parse metadata' });
            }
        } else {
            metadata = metadataResponse;
        }

        console.log('Parsed metadata:', metadata);  // Debug log

        // Create document to insert
        const pdfDocument = {
            email: email,
            text: text,
            title: metadata.title || '',
            caption: metadata.caption || '',
            filename: metadata.file_name || '',  // Note: using file_name instead of filename to match the API response
            date: new Date(),
            privacy: 'private'
        };

        console.log('Document to insert:', pdfDocument);  // Debug log

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

        app.post('/api/convert-image', upload.single('image'), async (req, res) => {
            try {
                // Check if file exists
                if (!req.file) {
                    return res.status(400).json({ error: 'No image file provided' });
                }
        
                // Check file type
                if (!req.file.mimetype.startsWith('image/')) {
                    return res.status(400).json({ error: 'File must be an image' });
                }
        
                // Add file size check
                if (req.file.size > 5 * 1024 * 1024) { // 5MB
                    return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
                }
        
                const result = await extractAndConvertText(req.file.buffer);
                console.log('Image conversion result:', result);
                res.json(result);
        
            } catch (error) {
                console.error('Image conversion error:', error);
                
                // More specific error messages
                if (error.message.includes('quota')) {
                    return res.status(429).json({
                        error: 'API quota exceeded',
                        details: 'Please try again later'
                    });
                }
        
                res.status(500).json({ 
                    error: 'Failed to process image',
                    details: error.message
                });
            }
        });
        
        // for dashboard - email e joto pdf asesob dekhabe
        app.get('/api/get-pdf/:email', async (req, res) => {
            try {
                const { email } = req.params;
        
                // Find all documents with the provided email
                const result = await generatedPDFs.find({ email: email }).toArray();
        
                res.json(result);
        
            } catch (error) {
                console.error('Failed to get PDFs:', error);
                res.status(500).json({ error: 'Failed to get PDFs' });
            }
        }
        );

        // to download a pdf
        //first take the pdf id and get the pdf data
        // then make a pdf file and send it to the user
        app.get('/api/download-pdf/:id', async (req, res) => {
            try {
                const { id } = req.params;
        
                // Find the document with the provided ID
                const result = await generatedPDFs.findOne({ _id: new ObjectId(id) });
        
                if (!result) {
                    return res.status(404).json({ error: 'PDF not found' });
                }
        
                // Create a PDF with UTF-8 encoding
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    lang: 'bn',
                    pdfVersion: '1.7',
                    tagged: true
                });

                // Register and use the Bangla font
                doc.registerFont('Kalpurush', 'fonts/kalpurush.ttf');

                // Set response headers before piping
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=${result.filename}.pdf`);

                // Pipe the PDF to the response
                doc.pipe(res);

                // Add content with Bangla font
                doc.font('Kalpurush')
                   .fontSize(24)
                   .text(result.title, {
                       align: 'center'
                   });

                doc.moveDown();
                
                doc.fontSize(16)
                   .text(result.caption, {
                       align: 'center'
                   });

                doc.moveDown();

                doc.fontSize(12)
                   .text(result.text, {
                       align: 'left',
                       lineGap: 5
                   });

                // Add generation date at the bottom
                doc.moveDown(2)
                   .fontSize(10)
                   .text(`Generated on: ${new Date().toLocaleString('bn-BD')}`, {
                       align: 'left'
                   });

                doc.end();
        
            } catch (error) {
                console.error('Failed to download PDF:', error);
                res.status(500).json({ error: 'Failed to download PDF' });
            }
        });


        app.get('/api/public/pdfs', async (req, res) => {
            try {
                const result = await generatedPDFs.find({ privacy: 'public' }).toArray();
                res.json(result);
            } catch (error) {
                console.error('Failed to get public PDFs:', error);
                res.status(500).json({ error: 'Failed to get public PDFs' });
            }
        });


        //chatbot
        const chatHistory = db.collection("chatHistory");
        app.post('/api/chat', upload.single('file'), async (req, res) => {
            try {
                const { text, email } = req.body;
                let input = text || '';
                let context = '';
        
                // Handle PDF file if present
                if (req.file && req.file.mimetype === 'application/pdf') {
                    const pdfText = await extractTextFromPDF(req.file.buffer);
                    context = pdfText;
                    input = `Based on this context: ${pdfText}\n\nQuestion: ${input}`;
                }
        
                if (!input && !context) {
                    return res.status(400).json({ 
                        error: 'No input provided. Please provide text or upload a PDF file.' 
                    });
                }
        
                // Get user's chat history for context
                const previousChats = await chatHistory.find({ email })
                    .sort({ timestamp: -1 })
                    .limit(5)  // Get last 5 conversations
                    .toArray();
        
                // Simplify history structure
                const history = previousChats.reverse().map(chat => ({
                    text: chat.input + "\n Response: " + chat.response
                }));
        
                // Get chat response
                const response = await handleChat(input, history);
        
                // Store chat in database
                await chatHistory.insertOne({
                    timestamp: new Date(),
                    email,
                    input: input,
                    response,
                    context: context || null,
                    inputType: req.file ? 'pdf' : 'text',
                    fileName: req.file ? req.file.originalname : null
                });
        
                res.json({
                    success: true,
                    response: response
                });
        
            } catch (error) {
                console.error('Chat error:', error);
                res.status(500).json({ 
                    error: 'Failed to process chat',
                    details: error.message 
                });
            }
        });
        
        
        // Get chat history for a specific user
app.get('/api/chat/history/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const history = await chatHistory.find({ email })
            .sort({ timestamp: -1 })
            .toArray();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get chat history' });
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
});