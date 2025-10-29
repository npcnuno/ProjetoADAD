import express, { Request, Response } from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME || 'movieDB';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Create MongoDB client
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: any = null;

// Connect to MongoDB once at startup
async function connectDB() {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB Atlas');

    // Optional: Test connection
    await db.command({ ping: 1 });
    console.log('Ping successful!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());

// GET: Retrieve all movies
app.get('/api/movies', async (req: Request, res: Response) => {
  try {
    const movies = await db.collection('movies').find({}).toArray();
    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movies',
      error: error.message,
    });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GET all movies: http://localhost:${PORT}/api/movies`);
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nClosing MongoDB connection...');
  await client.close();
  process.exit(0);
});

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
