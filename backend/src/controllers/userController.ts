import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ResponseHandler, Pagination, PaginationQuery } from '../middleware/responseHandler';
import { User, UserResponse, UserMovie, UserDocument } from '../models/user';
import {  Db, Int32, MongoClient, MongoDBCollectionNamespace } from 'mongodb';
import { MovieController } from './movieController';

export class UserController {
  public router: Router;
  private userService: DatabaseService;
  private db: Db;
  private mongo: MongoClient



  constructor(collection: any, db: Db, mongo: MongoClient) {
    this.router = Router();
    this.userService = new DatabaseService(collection);
    this.initializeRoutes();
    this.db = db
    this.mongo = mongo
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllUsers.bind(this));
    this.router.post('/', this.createUsers.bind(this));
    this.router.get('/:id', this.getUserById.bind(this));
    this.router.put('/:id', this.updateUser.bind(this));
    this.router.delete('/:id', this.deleteUser.bind(this));
    this.router.post('/:id/review/:event_id', this.addReview.bind(this));
  }

  private async getAllUsers(req: Request, res: Response) {
    try {
      const paginationQuery: PaginationQuery = Pagination.parseQuery(req);
      const { data, total } = await this.userService.findWithPagination({}, paginationQuery);

      const pagination = Pagination.calculatePagination(
        paginationQuery.page,
        paginationQuery.limit,
        total
      );

      res.json(ResponseHandler.success(data, 'Users retrieved successfully', pagination));
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch users', error.message)
      );
    }
  }

  private async createUsers(req: Request, res: Response) {
    try {
      const input = req.body;
      let usersArray: any[];

      if (Array.isArray(input)) {
        usersArray = input;
      } else if (typeof input === 'object' && input !== null) {
        usersArray = [input];
      } else {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields: please insert one or more users')
        );
      }

      if (usersArray.length === 0) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'No users were provided')
        );
      }

      let baseId = await this.userService.getNextId();
      const usersToInsert = [];

      for (const user of usersArray) {
        const {name, age, occupation, movies } = user;

        if (movies && Array.isArray(movies)) {
          for (const movie of movies) {
            const { movieid, rating } = movie;
            if (movieid === undefined) {
              return res.status(400).json(
                ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields in user movie: movieid is required')
              );
            }
          }
        }

        usersToInsert.push({
          _id: new Int32(baseId++),
          name,
          age,
          occupation: occupation ? (Array.isArray(occupation) ? occupation : [occupation]) : undefined,
          movies: movies || []
        });
      }

      const totalInsert = usersToInsert.length;
      let result;

      if (totalInsert === 1) {
        const insertedUser = await this.userService.create(usersToInsert[0]);
        if (!insertedUser) {
          throw new Error('Failed to create user');
        }
        result = {
          insertedCount: 1,
          insertedId: (insertedUser as UserDocument)._id
        };
      } else {
        const insertResult = await this.userService.insertMany(usersToInsert);
        result = {
          insertedCount: insertResult.insertedCount,
          insertedIds: insertResult.insertedIds
        };
      }

      res.status(201).json(
        ResponseHandler.success(
          result,
          totalInsert === 1 ? 'User added successfully' : `${result.insertedCount} users added successfully`
        )
      );

    } catch (error: any) {
      console.error('Error adding user(s):', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to add user(s)', error.message)
      );
    }
  }

  private async getUserById(req: Request, res: Response) {
    try {
      const userId = new Int32(parseInt(req.params.id));

      const user = await this.userService.findById(userId) as UserDocument;

      if (!user) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'User not found')
        );
      }

      // Get top 3 movies by rating (highest first)
      let topMovies: UserMovie[] = [];
      if (user.movies && user.movies.length > 0) {
        topMovies = user.movies
          .sort((a: UserMovie, b: UserMovie) => b.rating - a.rating)
          .slice(0, 3);
      }

      const response: UserResponse = {
        _id: user._id,
        name: user.name,
        age: user.age,
        occupation: user.occupation,
        movies: user.movies,
        topMovies
      };

      res.json(
        ResponseHandler.success(response, 'User retrieved successfully')
      );

    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch user', error.message)
      );
    }
  }

  private async updateUser(req: Request, res: Response) {
    try {
      const userId = new Int32(parseInt(req.params.id));
      const updateUser = req.body;
      const { name, age, occupation, movies } = updateUser;

      if (age === undefined && !occupation && !movies && name === undefined) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'You must provide at least one field to update: age, occupation or movies')
        );
      }

      if (movies && Array.isArray(movies)) {
        for (const movie of movies) {
          const { movieid, rating } = movie;
          if (movieid === undefined || rating === undefined) {
            return res.status(400).json(
              ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields in movie: movieid and rating are required')
            );
          }
        }
      }

      const updateData: any = {};
      if(name !== undefined ) updateData.name = name;
      if (age !== undefined) updateData.age = age;
      if (occupation) {
        updateData.occupation = Array.isArray(occupation) ? occupation : [occupation];
      }
      if (movies) updateData.movies = movies;

      const result = await this.userService.findOneAndUpdate(
        { _id: userId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'User not found')
        );
      }

      res.json(
        ResponseHandler.success(result, 'User updated successfully')
      );

    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to update user', error.message)
      );
    }
  }

  private async deleteUser(req: Request, res: Response) {
    try {
      const userId = new Int32(parseInt(req.params.id));

      const result = await this.userService.delete(userId);

      if (!result || !result.value) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'User not found')
        );
      }

      res.status(204).send();

    } catch (error: any) {
      console.error(`Error deleting user with ID ${req.params.id}:`, error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to delete user', error.message)
      );
    }
  }

  private async addReview(req: Request, res: Response) {
    try {
            const session = await this.mongo.startSession(); // Or your client's startSession method
      const userId = parseInt(req.params.id);
      const eventId = parseInt(req.params.event_id);
      const { rating } = req.body;

      if (rating === undefined || rating === null) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Missing rating')
        );
      }

      if (!Number.isInteger(rating) || rating < 0) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Invalid rating. The rating must be an integer over 0')

        );
      }

      if (isNaN(userId) || isNaN(eventId)) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Invalid User ID or Event ID format - must be numbers')
        );
      }

      // Check if user exists
      const user = await this.userService.findById(new Int32(userId));
      if (!user) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'User not found')
        );
      }

          session.startTransaction();
      // Add the review to the user's movies array
      const newUserMovie = {
        movieid: new Int32(eventId),
        rating,
        timestamp: Math.floor(Date.now() / 1000),
        date: new Date()
      };

      const newMovieReview = {
        userId: new Int32(userId),
        rating,
        timestamp: Math.floor(Date.now() / 1000),
        date: new Date()
      }

      // Update user with the new movie review
      const result = await this.userService.findOneAndUpdate(
        { _id: new Int32(userId) },
        {
          $push: { movies: newUserMovie }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'User not found during update')
        );
      }

     const movieResult = await this.db.collection('movies') .updateOne(
        { _id: new Int32(eventId) },
        { $inc: { reviewsCount: 1 },
        $push: {reviews: newMovieReview}},
      );


      // --- Operation 1: Update the User ---
    const userUpdateResult = await this.userService.findOneAndUpdate(
      { _id: new Int32(userId) },
      {
        $push: { movies: newUserMovie }
      },
      { 
        returnDocument: 'after',
      }
    );

    if (!userUpdateResult) {
      await session.abortTransaction(); // Rollback
      return res.status(404).json(ResponseHandler.error('NOT_FOUND', 'User not found'));
    }

    // --- Operation 2: Update the Movie ---
    const movieUpdateResult = await this.db.collection("movies").updateOne(
      { _id: new Int32(eventId) },
      { 
        $inc: { reviewsCount: 1 },
        $push: { reviews: newMovieReview } // This adds the user's review to the movie
      },
      { session } // Pass the session to this operation too
    );

      // 3. If both updates were successful, commit the transaction
    await session.commitTransaction();
    
    // 4. Send a success response
    return res.status(200).json(
      ResponseHandler.success('Review added successfully')
    );

    } catch (error: any) {
      console.error('Error adding review:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to add review', error.message)
      );
    }
  }
}
