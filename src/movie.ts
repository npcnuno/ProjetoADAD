import { Router, Request, Response } from 'express';
import { DatabaseService } from './databaseService';
import { ResponseHandler, Pagination, PaginationQuery } from './responseHandler';

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

}
