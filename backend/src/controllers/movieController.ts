import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ResponseHandler, Pagination, PaginationQuery } from '../middleware/responseHandler';
import { Movie, Review, MovieResponse, MovieDocument } from '../models/movie';
import { Int32 } from 'mongodb';

export class MovieController {
  public router: Router;
  private movieService: DatabaseService;

  constructor(collection: any) {
    this.router = Router();
    this.movieService = new DatabaseService(collection);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllMovies.bind(this));
    this.router.post('/', this.createMovies.bind(this));
    this.router.get('/top/:limit', this.getTopMovies.bind(this));
    this.router.get('/ratings/:order', this.getMoviesByRatingsCount.bind(this));
    this.router.get('/star', this.getStarMovies.bind(this));
    this.router.get('/year/:year', this.getMoviesByYear.bind(this));
    this.router.get('/genre/:genre', this.getMoviesByGenre.bind(this));
    this.router.get('/search/:query', this.searchMovies.bind(this));
    this.router.get('/user/:userId/reviews', this.getUserReviews.bind(this));
    this.router.get('/stats/summary', this.getStatsSummary.bind(this));
    this.router.get('/:id', this.getMovieById.bind(this));
    this.router.put('/:id', this.updateMovie.bind(this));
    this.router.delete('/:id', this.deleteMovie.bind(this));
  }
  private async getAllMovies(req: Request, res: Response) {
    try {
      const paginationQuery: PaginationQuery = Pagination.parseQuery(req);
      const { data, total } = await this.movieService.findWithPagination({}, paginationQuery);

      const pagination = Pagination.calculatePagination(
        paginationQuery.page,
        paginationQuery.limit,
        total
      );

      res.json(ResponseHandler.success(data, 'Movies retrieved successfully', pagination));
    } catch (error: any) {
      console.error('Error fetching movies:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies', error.message)
      );
    }
  }

  private async createMovies(req: Request, res: Response) {
    try {
      const input = req.body;
      let moviesArray: any[];

      if (Array.isArray(input)) {
        moviesArray = input;
      } else if (typeof input === 'object' && input !== null) {
        moviesArray = [input];
      } else {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields: please insert one or more movies')
        );
      }

      if (moviesArray.length === 0) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'No movies were provided')
        );
      }

      // Get the base ID once and increment sequentially
      let baseId = await this.movieService.getNextId();
      const moviesToInsert = [];

      for (const movie of moviesArray) {
        const { title, genres, year } = movie;

        if (!title || !genres || !year) {
          return res.status(400).json(
            ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields: title, genres and year are required')
          );
        }

        let genresArray: string[];
        if (typeof genres === 'string') {
          genresArray = genres.split('|');
        } else if (Array.isArray(genres)) {
          genresArray = genres;
        } else {
          genresArray = [genres.toString()];
        }

        moviesToInsert.push({
          _id: new Int32(baseId++),
          title,
          genres: genresArray,
          year,
          reviews: []
        });
      }

      const totalInsert = moviesToInsert.length;
      let result;

      if (totalInsert === 1) {
        const insertedMovie = await this.movieService.create(moviesToInsert[0]);
        if (!insertedMovie) {
          throw new Error('Failed to create movie');
        }
        result = {
          insertedCount: 1,
          insertedId: (insertedMovie as MovieDocument)._id
        };
      } else {
        const insertResult = await this.movieService.insertMany(moviesToInsert);
        result = {
          insertedCount: insertResult.insertedCount,
          insertedIds: insertResult.insertedIds
        };
      }

      res.status(201).json(
        ResponseHandler.success(
          result,
          totalInsert === 1 ? 'Movie added successfully' : `${result.insertedCount} movies added successfully`
        )
      );

    } catch (error: any) {
      console.error('Error adding movie(s):', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to add movie(s)', error.message)
      );
    }
  }

  private async getMovieById(req: Request, res: Response) {
    try {
      const movieId = new Int32(parseInt(req.params.id));

      const movie = await this.movieService.findById(movieId) as MovieDocument;

      if (!movie) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'Movie not found')
        );
      }

      let averageScore = 0;
      if (movie.reviews && movie.reviews.length > 0) {
        const totalRating = movie.reviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
        averageScore = totalRating / movie.reviews.length;
      }

      const response: MovieResponse = {
        _id: movie._id,
        title: movie.title,
        genres: movie.genres,
        year: movie.year,
        averageScore: Math.round(averageScore * 100) / 100
      };

      res.json(
        ResponseHandler.success(response, 'Movie retrieved successfully')
      );

    } catch (error: any) {
      console.error('Error fetching movie:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movie', error.message)
      );
    }
  }

  private async updateMovie(req: Request, res: Response) {
    try {
      const movieId = new Int32(parseInt(req.params.id));
      const updateMovie = req.body;
      const { title, genres, year } = updateMovie;

      if (!title && !genres && !year) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'You must provide at least one field to update: title, genres or year')
        );
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (genres) updateData.genres = Array.isArray(genres) ? genres : [genres];
      if (year) updateData.year = year;

      const result = await this.movieService.findOneAndUpdate(
        { _id: movieId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'Movie not found')
        );
      }

      res.json(
        ResponseHandler.success(result, 'Movie updated successfully')
      );

    } catch (error: any) {
      console.error('Error updating movie:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to update movie', error.message)
      );
    }
  }

  private async deleteMovie(req: Request, res: Response) {
    try {
      const movieId = new Int32(parseInt(req.params.id));

      const result = await this.movieService.delete(movieId);

      if (!result || !result.value) {
        return res.status(404).json(
          ResponseHandler.error('NOT_FOUND', 'Movie not found')
        );
      }

      res.status(204).send();

    } catch (error: any) {
      console.error(`Error deleting movie with ID ${req.params.id}:`, error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to delete movie', error.message)
      );
    }
  } private async getTopMovies(req: Request, res: Response) {
    try {
      const limit = parseInt(req.params.limit);

      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Invalid limit parameter')
        );
      }

      const pipeline = [
        {
          $addFields: {
            averageScore: {
              $cond: {
                if: { $isArray: "$reviews" },
                then: { $avg: "$reviews.rating" },
                else: 0
              }
            }
          }
        },
        { $sort: { averageScore: -1 } },
        { $limit: limit }
      ];

      const results = await this.movieService.aggregate(pipeline);

      res.json(
        ResponseHandler.success(results, 'Top movies retrieved successfully')
      );

    } catch (error: any) {
      console.error('Error fetching top movies:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch top movies', error.message)
      );
    }
  }

  private async getMoviesByRatingsCount(req: Request, res: Response) {
    try {
      const order = req.params.order;

      if (order !== 'asc' && order !== 'desc') {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Order must be "asc" or "desc"')
        );
      }

      const pipeline = [
        {
          $addFields: {
            reviewsCount: {
              $cond: {
                if: { $isArray: "$reviews" },
                then: { $size: "$reviews" },
                else: 0
              }
            }
          }
        },
        { $sort: { reviewsCount: order === 'asc' ? 1 : -1 } }
      ];

      const results = await this.movieService.aggregate(pipeline);

      res.json(
        ResponseHandler.success(results, 'Movies retrieved successfully')
      );

    } catch (error: any) {
      console.error('Error fetching movies by ratings count:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies by ratings count', error.message)
      );
    }
  }

  private async getStarMovies(req: Request, res: Response) {
    try {
      const minFiveStarReviews = 5;

      const pipeline = [
        { $unwind: "$reviews" },
        { $match: { "reviews.rating": 5 } },
        {
          $group: {
            _id: "$_id",
            fiveStarCount: { $sum: 1 },
            movieDetails: { $first: "$$ROOT" }
          }
        },
        { $match: { fiveStarCount: { $gte: minFiveStarReviews } } },
        {
          $project: {
            _id: 0,
            movieDetails: 1,
            numberOfFiveStarReviews: "$fiveStarCount"
          }
        }
      ];

      const results = await this.movieService.aggregate(pipeline);

      res.json(
        ResponseHandler.success(results, 'Star movies retrieved successfully')
      );
    } catch (error: any) {
      console.error('Error fetching star movies:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch star movies', error.message)
      );
    }
  }

  private async getMoviesByYear(req: Request, res: Response) {
    try {
      const { year } = req.params;
      const targetYear = parseInt(year, 10);

      if (isNaN(targetYear)) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Invalid year format')
        );
      }

      const paginationQuery: PaginationQuery = Pagination.parseQuery(req);
      const { data, total } = await this.movieService.findWithPagination(
        { year: targetYear },
        paginationQuery
      );

      const pagination = Pagination.calculatePagination(
        paginationQuery.page,
        paginationQuery.limit,
        total
      );

      res.json(
        ResponseHandler.success(data, `Movies from ${targetYear} retrieved successfully`, pagination)
      );

    } catch (error: any) {
      console.error(`Error fetching movies for year ${req.params.year}:`, error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies', error.message)
      );
    }
  }

  private async getMoviesByGenre(req: Request, res: Response) {
    try {
      const { genre } = req.params;

      if (!genre) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Genre parameter is required')
        );
      }

      const paginationQuery: PaginationQuery = Pagination.parseQuery(req);
      const { data, total } = await this.movieService.findWithPagination(
        { genres: { $in: [new RegExp(genre, 'i')] } },
        paginationQuery
      );

      const pagination = Pagination.calculatePagination(
        paginationQuery.page,
        paginationQuery.limit,
        total
      );

      res.json(
        ResponseHandler.success(data, `Movies in genre '${genre}' retrieved successfully`, pagination)
      );

    } catch (error: any) {
      console.error(`Error fetching movies for genre ${req.params.genre}:`, error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies by genre', error.message)
      );
    }
  }

  private async searchMovies(req: Request, res: Response) {
    try {
      const { query } = req.params;

      if (!query || query.length < 2) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Search query must be at least 2 characters long')
        );
      }

      const paginationQuery: PaginationQuery = Pagination.parseQuery(req);
      const { data, total } = await this.movieService.findWithPagination(
        { title: { $regex: query, $options: 'i' } },
        paginationQuery
      );

      const pagination = Pagination.calculatePagination(
        paginationQuery.page,
        paginationQuery.limit,
        total
      );

      res.json(
        ResponseHandler.success(data, `Search results for '${query}'`, pagination)
      );

    } catch (error: any) {
      console.error(`Error searching movies with query ${req.params.query}:`, error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to search movies', error.message)
      );
    }
  }

  private async getUserReviews(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json(
          ResponseHandler.error('VALIDATION_ERROR', 'Invalid User ID format - must be a number')
        );
      }

      const paginationQuery: PaginationQuery = Pagination.parseQuery(req);
      const pipeline = [
        { $unwind: "$reviews" },
        { $match: { "reviews.userId": userId } },
        { $sort: { "reviews.createdAt": -1 } },
        { $skip: (paginationQuery.page - 1) * paginationQuery.limit },
        { $limit: paginationQuery.limit },
        {
          $project: {
            movieTitle: "$title",
            movieYear: "$year",
            rating: "$reviews.rating",
            reviewedAt: "$reviews.createdAt",
            movieId: "$_id"
          }
        }
      ];

      const countPipeline = [
        { $unwind: "$reviews" },
        { $match: { "reviews.userId": userId } },
        { $count: "total" }
      ];

      const [reviews, countResult] = await Promise.all([
        this.movieService.aggregate(pipeline),
        this.movieService.aggregate(countPipeline)
      ]);

      const total = countResult[0]?.total || 0;
      const pagination = Pagination.calculatePagination(
        paginationQuery.page,
        paginationQuery.limit,
        total
      );

      res.json(
        ResponseHandler.success(reviews, 'User reviews retrieved successfully', pagination)
      );

    } catch (error: any) {
      console.error(`Error fetching reviews for user ${req.params.userId}:`, error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch user reviews', error.message)
      );
    }
  }

  private async getStatsSummary(req: Request, res: Response) {
    try {
      const pipeline = [
        {
          $facet: {
            totalMovies: [{ $count: "count" }],
            totalReviews: [
              { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: true } },
              { $count: "count" }
            ],
            averageRating: [
              { $unwind: "$reviews" },
              { $group: { _id: null, average: { $avg: "$reviews.rating" } } }
            ],
            moviesByYear: [
              { $group: { _id: "$year", count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            topRatedMovies: [
              {
                $addFields: {
                  averageScore: {
                    $cond: {
                      if: { $isArray: "$reviews" },
                      then: { $avg: "$reviews.rating" },
                      else: 0
                    }
                  }
                }
              },
              { $match: { averageScore: { $gte: 4 } } },
              { $sort: { averageScore: -1 } },
              { $limit: 5 },
              { $project: { title: 1, averageScore: 1, year: 1 } }
            ]
          }
        }
      ];

      const results = await this.movieService.aggregate(pipeline);
      const stats = results[0];

      const summary = {
        totalMovies: stats.totalMovies[0]?.count || 0,
        totalReviews: stats.totalReviews[0]?.count || 0,
        averageRating: stats.averageRating[0]?.average ? Math.round(stats.averageRating[0].average * 100) / 100 : 0,
        moviesByYear: stats.moviesByYear,
        topRatedMovies: stats.topRatedMovies
      };

      res.json(
        ResponseHandler.success(summary, 'Statistics summary retrieved successfully')
      );

    } catch (error: any) {
      console.error('Error fetching statistics summary:', error);
      res.status(500).json(
        ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch statistics', error.message)
      );
    }
  }
}
