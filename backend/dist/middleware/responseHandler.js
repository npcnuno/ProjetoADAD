"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = exports.ResponseHandler = void 0;
class ResponseHandler {
    static success(data, message = 'Success', pagination) {
        return {
            success: true,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString(),
        };
    }
    static error(code, message, details) {
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
exports.ResponseHandler = ResponseHandler;
class Pagination {
    static parseQuery(req) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order === 'asc' ? 'asc' : 'desc';
        return { page, limit, sort, order };
    }
    static calculatePagination(page, limit, total) {
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
exports.Pagination = Pagination;
