import express, { Request, Response } from 'express';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import { title } from 'process';


//Import the router

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

//POST Adicionar 1 ou mais movies
app.post('/api/movies', async (req: Request, res: Response) => {
  const input = req.body;
  let moviesArray: any[];
  const id = req.params.id;

  //Verifica se o input é um array
  if (Array.isArray(input)){
    moviesArray = input;
  }else if (typeof input == 'object' && input !== null){
    //Verifica se o input é um objeto e não nulo
    moviesArray = [input];
  }else{
      return res.status(400).json({
      success: false,
      message: 'Missing required fields: please insert one or more movies'});
  }

  //Ver se foram inseridos filmes
  if (moviesArray.length == 0){
      return res.status(404).json({
      success: false,
      message: 'No movies were provided.',
      });
  }

  const moviesToInsert = [];

  //Loop para separar o input em vários movies
  for (const movie of moviesArray){
    const {title, genres, year} = movie;

  //Verifica se o input é valido
    if (!title || !genres || !year) {
      return res.status(400).json({
      success: false,
      message: 'Missing required fields: title, genres and review are required.',
      });
    }

    moviesToInsert.push({
      ...movie,
    });
  }

  try{
    const totalInsert = moviesToInsert.length;
    let result;

    if (totalInsert == 1){
      result = await db.collection('movies').insertOne(moviesToInsert[0]);

      res.status(201).json({
        success: true,
        message: 'Movie added successfully',
        data: {id, ...moviesToInsert[0]},
      });
    } else {
      //Se for adicionado mais do que um filme
      result = await db.collection('movies').insertMany(moviesToInsert);

      return res.status(201).json({
        success: true,
        message: `${result.insertedCount} movies added successfully`,
        data: {
          insertedCount: result.insertedCount
        },
      });
   }
  } catch (error: any) {
    console.error('Error adding movie(s):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add movie', 
      error: error.message,
    });
  }
});

//POST adicionar 1 ou mais users
app.post('/api/users', async (req: Request, res: Response) => {
  const input = req.body;
  const id = req.params.id;
  let usersArray: any[];

  //Verifica se o input é um array
  if (Array.isArray(input)){
    usersArray = input;
  }else if (typeof input == 'object' && input !== null){
    //Verifica se o input é um objeto e não nulo
    usersArray = [input];
  }else{
      return res.status(400).json({
      success: false,
      message: 'Missing required fields: please insert one or more users'});
  }

  //Ver se foram inseridos users
  if (usersArray.length == 0){
      return res.status(404).json({
      success: false,
      message: 'No users were provided.',
      });
  }

  const usersToInsert = [];

  //Loop para separar o input em vários users
  for (const user of usersArray){
    const {name, gender, age, ocupation, movies} = user;

  //Verifica se o input é valido
    if (!name || !gender || !age || !ocupation && !movies) {
      return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, gender, age and ocupation are required.',
      });
    }

    for (const movie of movies){
      const {title, genres, year } = movie;

      if(!title || !genres || !year ) {
        return res.status(400).json({
          sucess: false,
          message: 'Missing required fields: title, genres and review are required.'
        });
      }
    }


    usersToInsert.push({
      ...user,
    });
  }

  try{
    const totalInsert = usersToInsert.length;
    let result;

    if (totalInsert == 1){
      result = await db.collection('users').insertOne(usersToInsert[0]);

      res.status(201).json({
        success: true,
        message: 'User added successfully',
        data: {id, ...usersToInsert[0]},
      });
    } else {
      //Se for adicionado mais do que um user
      result = await db.collection('users').insertMany(usersToInsert);

      return res.status(201).json({
        success: true,
        message: `${result.insertedCount} users added successfully`,
        data: {
          insertedCount: result.insertedCount,
        },
      });
     }
  } catch (error: any) {
    console.error('Error adding user(s):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add users', 
      error: error.message,
    });
  }
});


// PUT update a movie
app.put('/api/movies/:id', async (req: Request, res: Response) => {
  const movieId = req.params.id;
  const updateMovie = req.body;

  const {title, genres, review} = updateMovie;



  //Validação que pelo menos um argumento é preenchido
  if (!title && !genres && !review) {
      return res.status(400).json({
      success: false,
      message: 'You must provide at least one field to update: title, genres or review.',
      });
  }

  if (!ObjectId.isValid(movieId)) {
     return res.status(400).json({
         success: false,
         message: 'Invalid Movie ID format.'
     });
  }

  try {
    const result = await db.collection('movies').updateOne(
      {_id: new ObjectId (movieId).toString()},
      {$set: updateMovie}
    )

    if (result.matchedCount == 0){
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'The movie was successfully updated!',
      data: {
        modifiedCount: result.modifiedCount,
        _id: movieId,
        ...updateMovie,
      },
    });
  }catch (error: any) {
    console.error(`Error updating movie with ID ${movieId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update movie',
      error: error.message,
    });
  }
});

// PUT update a user
app.put('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;
  const updateUser = req.body;

  const {name, gender, age, ocupation, movies} = updateUser;

  //Validação que pelo menos um argumento é preenchido
  if (!name && !gender && !age && !ocupation && !movies) {
      return res.status(400).json({
      success: false,
      message: 'You must provide at least one field to update: name, gender, age, ocupation or movies.',
      });
  }

  //Validação dos parametros do movie
  for (const movie of movies){
    const {title, genres, year } = movie;

    if(!title || !genres || !year ) {
      return res.status(400).json({
        sucess: false,
        message: 'Missing required fields: title, genres and review are required.'
       });
     }
   }


  try {
    const result = await db.collection('users').updateOne(
      {_id: new ObjectId (userId)},
      {$set: updateUser}
    )

    if (result.matchedCount == 0){
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'The user was successfully updated!',
      data: {
        modifiedCount: result.modifiedCount,
        _id: userId,
        ...updateUser,
      },
    });
  }catch (error: any) {
    console.error('Error updating user with ID ${userId}:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});


//POST Adicionar uma nova review a um filme
app.post('/users/:id/review/:movie_id', async (req: Request, res: Response) => {


  const {id: userId, movie_id: movieId} = req.params;
  const review = req.body;

  if (review == undefined || review == null){
    return res.status(400).json({
      success: false,
      message: 'Missing review.'
    })
  }

  //Validação do input da review
  if (!Number.isInteger(review) || review < 1 || review > 5) {
      return res.status(400).json({
          success: false,
          message: 'Invalid review. The review must be an integer between 1 and 5.'
      });
  }

  //Validação do id
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(movieId)) {
      return res.status(400).json({
          success: false,
          message: 'Invalid User ID or Movie ID format.'
      });
  }

  const newReview = {
      userId: new ObjectId(userId), 
      rating: review,       
      createdAt: new Date(),
  };

  try {
      // Encontrar o filme que quero dar review
      const result = await db.collection('movies').updateOne(
          { _id: new ObjectId(movieId) },
          { 
            $push: { reviews: newReview } 
          }
      );

      if (result.matchedCount === 0) {
          return res.status(404).json({
              success: false,
              message: 'Movie not found.'
          });
      }

      res.status(201).json({
          success: true,
          message: 'Review added successfully!',
          data: {
              movieId: movieId,
              rating: review,
              userId: userId,
              createdAt: newReview.createdAt,
          },
      });

  } catch (error: any) {
      console.error(`Error adding review to movie ${movieId}:`, error);
      res.status(500).json({
          success: false,
          message: 'Failed to add review',
          error: error.message,
      });
  }

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
