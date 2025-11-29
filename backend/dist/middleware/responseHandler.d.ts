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
export declare class ResponseHandler {
    static success<T>(data: T, message?: string, pagination?: PaginationInfo): SuccessResponse<T>;
    static error(code: string, message: string, details?: string): ErrorResponse;
}
export declare class Pagination {
    static parseQuery(req: any): PaginationQuery;
    static calculatePagination(page: number, limit: number, total: number): PaginationInfo;
}
