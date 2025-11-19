export interface BaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface SuccessResponse<T> extends BaseResponse {
  success: true;
  data: T;
  pagination?: PaginationInfo;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    details?: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class ResponseHandler {
  static success<T>(data: T, message: string = 'Success', pagination?: PaginationInfo): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };
  }

  static error(code: string, message: string, details?: string): ErrorResponse {
    return {
      success: false,
      message,
      error: {
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export class Pagination {
  static parseQuery(req: any): PaginationQuery {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const sort = (req.query.sort as string) || 'createdAt';
    const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

    return { page, limit, sort, order };
  }

  static calculatePagination(page: number, limit: number, total: number): PaginationInfo {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
