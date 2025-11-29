"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieController = void 0;
const express_1 = require("express");
const databaseService_1 = require("../services/databaseService");
const responseHandler_1 = require("../middleware/responseHandler");
const mongodb_1 = require("mongodb");
class MovieController {
    constructor(collection) {
        this.router = (0, express_1.Router)();
        this.movieService = new databaseService_1.DatabaseService(collection);
        this.initializeRoutes();
    }
    initializeRoutes() {
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
    getAllMovies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paginationQuery = responseHandler_1.Pagination.parseQuery(req);
                const { data, total } = yield this.movieService.findWithPagination({}, paginationQuery);
                const pagination = responseHandler_1.Pagination.calculatePagination(paginationQuery.page, paginationQuery.limit, total);
                res.json(responseHandler_1.ResponseHandler.success(data, 'Movies retrieved successfully', pagination));
            }
            catch (error) {
                console.error('Error fetching movies:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies', error.message));
            }
        });
    }
    createMovies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = req.body;
                let moviesArray;
                if (Array.isArray(input)) {
                    moviesArray = input;
                }
                else if (typeof input === 'object' && input !== null) {
                    moviesArray = [input];
                }
                else {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields: please insert one or more movies'));
                }
                if (moviesArray.length === 0) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'No movies were provided'));
                }
                // Get the base ID once and increment sequentially
                let baseId = yield this.movieService.getNextId();
                const moviesToInsert = [];
                for (const movie of moviesArray) {
                    const { title, genres, year } = movie;
                    if (!title || !genres || !year) {
                        return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields: title, genres and year are required'));
                    }
                    let genresArray;
                    if (typeof genres === 'string') {
                        genresArray = genres.split('|');
                    }
                    else if (Array.isArray(genres)) {
                        genresArray = genres;
                    }
                    else {
                        genresArray = [genres.toString()];
                    }
                    moviesToInsert.push({
                        _id: new mongodb_1.Int32(baseId++),
                        title,
                        genres: genresArray,
                        year,
                        reviews: []
                    });
                }
                const totalInsert = moviesToInsert.length;
                let result;
                if (totalInsert === 1) {
                    const insertedMovie = yield this.movieService.create(moviesToInsert[0]);
                    if (!insertedMovie) {
                        throw new Error('Failed to create movie');
                    }
                    result = {
                        insertedCount: 1,
                        insertedId: insertedMovie._id
                    };
                }
                else {
                    const insertResult = yield this.movieService.insertMany(moviesToInsert);
                    result = {
                        insertedCount: insertResult.insertedCount,
                        insertedIds: insertResult.insertedIds
                    };
                }
                res.status(201).json(responseHandler_1.ResponseHandler.success(result, totalInsert === 1 ? 'Movie added successfully' : `${result.insertedCount} movies added successfully`));
            }
            catch (error) {
                console.error('Error adding movie(s):', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to add movie(s)', error.message));
            }
        });
    }
    getMovieById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const movieId = new mongodb_1.Int32(parseInt(req.params.id));
                const movie = yield this.movieService.findById(movieId);
                if (!movie) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'Movie not found'));
                }
                let averageScore = 0;
                if (movie.reviews && movie.reviews.length > 0) {
                    const totalRating = movie.reviews.reduce((sum, review) => sum + review.rating, 0);
                    averageScore = totalRating / movie.reviews.length;
                }
                const response = {
                    _id: movie._id,
                    title: movie.title,
                    genres: movie.genres,
                    year: movie.year,
                    averageScore: Math.round(averageScore * 100) / 100
                };
                res.json(responseHandler_1.ResponseHandler.success(response, 'Movie retrieved successfully'));
            }
            catch (error) {
                console.error('Error fetching movie:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movie', error.message));
            }
        });
    }
    updateMovie(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const movieId = new mongodb_1.Int32(parseInt(req.params.id));
                const updateMovie = req.body;
                const { title, genres, year } = updateMovie;
                if (!title && !genres && !year) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'You must provide at least one field to update: title, genres or year'));
                }
                const updateData = {};
                if (title)
                    updateData.title = title;
                if (genres)
                    updateData.genres = Array.isArray(genres) ? genres : [genres];
                if (year)
                    updateData.year = year;
                const result = yield this.movieService.findOneAndUpdate({ _id: movieId }, { $set: updateData }, { returnDocument: 'after' });
                if (!result) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'Movie not found'));
                }
                res.json(responseHandler_1.ResponseHandler.success(result, 'Movie updated successfully'));
            }
            catch (error) {
                console.error('Error updating movie:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to update movie', error.message));
            }
        });
    }
    deleteMovie(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const movieId = new mongodb_1.Int32(parseInt(req.params.id));
                const result = yield this.movieService.delete(movieId);
                if (!result || !result.value) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'Movie not found'));
                }
                res.status(204).send();
            }
            catch (error) {
                console.error(`Error deleting movie with ID ${req.params.id}:`, error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to delete movie', error.message));
            }
        });
    }
    getTopMovies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = parseInt(req.params.limit);
                if (isNaN(limit) || limit <= 0) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Invalid limit parameter'));
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
                const results = yield this.movieService.aggregate(pipeline);
                res.json(responseHandler_1.ResponseHandler.success(results, 'Top movies retrieved successfully'));
            }
            catch (error) {
                console.error('Error fetching top movies:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch top movies', error.message));
            }
        });
    }
    getMoviesByRatingsCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = req.params.order;
                if (order !== 'asc' && order !== 'desc') {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Order must be "asc" or "desc"'));
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
                const results = yield this.movieService.aggregate(pipeline);
                res.json(responseHandler_1.ResponseHandler.success(results, 'Movies retrieved successfully'));
            }
            catch (error) {
                console.error('Error fetching movies by ratings count:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies by ratings count', error.message));
            }
        });
    }
    getStarMovies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const results = yield this.movieService.aggregate(pipeline);
                res.json(responseHandler_1.ResponseHandler.success(results, 'Star movies retrieved successfully'));
            }
            catch (error) {
                console.error('Error fetching star movies:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch star movies', error.message));
            }
        });
    }
    getMoviesByYear(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { year } = req.params;
                const targetYear = parseInt(year, 10);
                if (isNaN(targetYear)) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Invalid year format'));
                }
                const paginationQuery = responseHandler_1.Pagination.parseQuery(req);
                const { data, total } = yield this.movieService.findWithPagination({ year: targetYear }, paginationQuery);
                const pagination = responseHandler_1.Pagination.calculatePagination(paginationQuery.page, paginationQuery.limit, total);
                res.json(responseHandler_1.ResponseHandler.success(data, `Movies from ${targetYear} retrieved successfully`, pagination));
            }
            catch (error) {
                console.error(`Error fetching movies for year ${req.params.year}:`, error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies', error.message));
            }
        });
    }
    getMoviesByGenre(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { genre } = req.params;
                if (!genre) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Genre parameter is required'));
                }
                const paginationQuery = responseHandler_1.Pagination.parseQuery(req);
                const { data, total } = yield this.movieService.findWithPagination({ genres: { $in: [new RegExp(genre, 'i')] } }, paginationQuery);
                const pagination = responseHandler_1.Pagination.calculatePagination(paginationQuery.page, paginationQuery.limit, total);
                res.json(responseHandler_1.ResponseHandler.success(data, `Movies in genre '${genre}' retrieved successfully`, pagination));
            }
            catch (error) {
                console.error(`Error fetching movies for genre ${req.params.genre}:`, error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch movies by genre', error.message));
            }
        });
    }
    searchMovies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { query } = req.params;
                if (!query || query.length < 2) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Search query must be at least 2 characters long'));
                }
                const paginationQuery = responseHandler_1.Pagination.parseQuery(req);
                const { data, total } = yield this.movieService.findWithPagination({ title: { $regex: query, $options: 'i' } }, paginationQuery);
                const pagination = responseHandler_1.Pagination.calculatePagination(paginationQuery.page, paginationQuery.limit, total);
                res.json(responseHandler_1.ResponseHandler.success(data, `Search results for '${query}'`, pagination));
            }
            catch (error) {
                console.error(`Error searching movies with query ${req.params.query}:`, error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to search movies', error.message));
            }
        });
    }
    getUserReviews(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = parseInt(req.params.userId);
                if (isNaN(userId)) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Invalid User ID format - must be a number'));
                }
                const paginationQuery = responseHandler_1.Pagination.parseQuery(req);
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
                const [reviews, countResult] = yield Promise.all([
                    this.movieService.aggregate(pipeline),
                    this.movieService.aggregate(countPipeline)
                ]);
                const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
                const pagination = responseHandler_1.Pagination.calculatePagination(paginationQuery.page, paginationQuery.limit, total);
                res.json(responseHandler_1.ResponseHandler.success(reviews, 'User reviews retrieved successfully', pagination));
            }
            catch (error) {
                console.error(`Error fetching reviews for user ${req.params.userId}:`, error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch user reviews', error.message));
            }
        });
    }
    getStatsSummary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
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
                const results = yield this.movieService.aggregate(pipeline);
                const stats = results[0];
                const summary = {
                    totalMovies: ((_a = stats.totalMovies[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
                    totalReviews: ((_b = stats.totalReviews[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                    averageRating: ((_c = stats.averageRating[0]) === null || _c === void 0 ? void 0 : _c.average) ? Math.round(stats.averageRating[0].average * 100) / 100 : 0,
                    moviesByYear: stats.moviesByYear,
                    topRatedMovies: stats.topRatedMovies
                };
                res.json(responseHandler_1.ResponseHandler.success(summary, 'Statistics summary retrieved successfully'));
            }
            catch (error) {
                console.error('Error fetching statistics summary:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch statistics', error.message));
            }
        });
    }
}
exports.MovieController = MovieController;
