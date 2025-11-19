import express, { Request, Response } from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import { MovieController } from './controllers/movieController';
import { UserController } from './controllers/userController';
import { ResponseHandler } from './middleware/responseHandler';

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
app.use(cors());
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
  app.use('/api/v1/movies', movieController.router);
  app.use('/api/v1/users', userController.router);
}

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json(ResponseHandler.success({ status: 'OK' }, 'API is running'));
});

// Start server
const startServer = async () => {
  await connectDB();
  await initializeControllers();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   Movies: http://localhost:${PORT}/api/v1/movies`);
    console.log(`   Users:  http://localhost:${PORT}/api/v1/users`);
    console.log(`   Health: http://localhost:${PORT}/api/v1/health`);

    console.log(`\n📚 Available User Endpoints:`);
    console.log(`   GET    /api/v1/users - Get all users (with pagination)`);
    console.log(`   POST   /api/v1/users - Create user(s)`);
    console.log(`   GET    /api/v1/users/:id - Get user by ID (includes top 3 movies)`);
    console.log(`   PUT    /api/v1/users/:id - Update user`);
    console.log(`   DELETE /api/v1/users/:id - Delete user`);
    console.log(`   POST   /api/v1/users/:id/review/:event_id - Add review to movie`);

    console.log(`\n📚 Available Movie Endpoints:`);
    console.log(`   GET    /api/v1/movies - Get all movies (with pagination)`);
    console.log(`   POST   /api/v1/movies - Create movie(s)`);
    console.log(`   GET    /api/v1/movies/top/:limit - Get top rated movies`);
    console.log(`   GET    /api/v1/movies/ratings/:order - Get movies by ratings count`);
    console.log(`   GET    /api/v1/movies/star - Get star movies (5+ five-star reviews)`);
    console.log(`   GET    /api/v1/movies/year/:year - Get movies by year`);
    console.log(`   GET    /api/v1/movies/genre/:genre - Get movies by genre`);
    console.log(`   GET    /api/v1/movies/search/:query - Search movies by title`);
    console.log(`   GET    /api/v1/movies/user/:userId/reviews - Get user reviews`);
    console.log(`   GET    /api/v1/movies/stats/summary - Get statistics summary`);
    console.log(`   GET    /api/v1/movies/:id - Get movie by ID`);
    console.log(`   PUT    /api/v1/movies/:id - Update movie`);
    console.log(`   DELETE /api/v1/movies/:id - Delete movie`);
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📦 Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});

startServer().catch((err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
