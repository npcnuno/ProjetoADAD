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

//Tirar o campo de ano do title
async function cleanMovieData() {
  console.log('Extração do campo "year" na coleção movies...');
  
  const moviesCursor = await db.collection('movies').find({});  
  let updateCount = 0;
  
  await moviesCursor.forEach(async (movie: any) => {

    if (movie.title && movie.title.endsWith(')')) {
      const titleLength = movie.title.length;
      const movieYear = movie.title.substring(titleLength - 5, titleLength - 1);
      const movieNewTitle = movie.title.substring(0, titleLength - 7).trim(); 
      
      await db.collection('movies').updateOne(
          { _id: movie._id },
          { $set: { title: movieNewTitle, year: parseInt(movieYear, 10) } }
      );
      updateCount++;
    }
  });

  console.log(`Extração realizada. ${updateCount} documentos de filmes atualizados.`);
}

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Start server
const startServer = async () => {
  await connectDB();

  //Corre o código para limpar o ano do movie title (deixar comentado quando já foi feita a separação)
  //await cleanMovieData();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GET all movies: http://localhost:${PORT}/api/movies`);
    console.log(`GET all movies: http://localhost:${PORT}/api/users`);
    console.log(`GET movies with more than 5 stars: http://localhost:${PORT}/api/movies/star`);
    console.log(`GET movies by Year: http://localhost:${PORT}/api/movies/:year`);
    console.log(`DELETE movies by ID: http://localhost:${PORT}/api/movies/:id`);
    console.log(`DELETE users by ID: http://localhost:${PORT}/api/users/:id`);


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
