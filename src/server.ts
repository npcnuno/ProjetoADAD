import express, { Request, Response } from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import { MovieController } from './movie';
import { UserController } from './user';
import { ResponseHandler } from './responseHandler';

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

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB Atlas');

    await db.command({ ping: 1 });
    console.log('Ping successful!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());

// Response middleware for consistent response handling
app.use((req: Request, res: Response, next) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }

    if (data && data.error) {
      const errorResponse = ResponseHandler.error(
        data.code || 'INTERNAL_ERROR',
        data.message || 'An error occurred',
        data.details
      );
      return originalJson.call(this, errorResponse);
    }

    const successResponse = ResponseHandler.success(data);
    return originalJson.call(this, successResponse);
  };

  next();
});

// Initialize controllers
let movieController: MovieController;
let userController: UserController;

async function initializeControllers() {
  movieController = new MovieController(db.collection('movies'));
  userController = new UserController(db.collection('users'));

  // Mount routes
  app.use('/api/movies', movieController.router);
  app.use('/api/users', userController.router);
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json(ResponseHandler.success({ status: 'OK' }, 'API is running'));
});

// 404 handler
// app.use('/*path', (req: Request, res: Response) => {
//   res.status(404).json(
//     ResponseHandler.error('404', 'Endpoint not found')
//   );
// });

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json(
    ResponseHandler.error('INTERNAL_ERROR', 'Internal server error', error.message)
  );
});

// Start server
const startServer = async () => {
  await connectDB();
  await initializeControllers();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  Movies: http://localhost:${PORT}/api/movies`);
    console.log(`  Users:  http://localhost:${PORT}/api/users`);
    console.log(`  Health: http://localhost:${PORT}/health`);
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
