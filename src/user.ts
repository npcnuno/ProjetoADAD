import { Router, Request, Response } from 'express';
import { DatabaseService } from './databaseService';
import { ResponseHandler, Pagination, PaginationQuery } from './responseHandler';

export interface User {
  _id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserController {
  public router: Router;
  private userService: DatabaseService;

  constructor(collection: any) {
    this.router = Router();
    this.userService = new DatabaseService(collection);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllUsers.bind(this));
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
}
