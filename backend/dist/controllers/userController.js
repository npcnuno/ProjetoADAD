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
exports.UserController = void 0;
const express_1 = require("express");
const databaseService_1 = require("../services/databaseService");
const responseHandler_1 = require("../middleware/responseHandler");
const mongodb_1 = require("mongodb");
class UserController {
    constructor(collection) {
        this.router = (0, express_1.Router)();
        this.userService = new databaseService_1.DatabaseService(collection);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAllUsers.bind(this));
        this.router.post('/', this.createUsers.bind(this));
        this.router.get('/:id', this.getUserById.bind(this));
        this.router.put('/:id', this.updateUser.bind(this));
        this.router.delete('/:id', this.deleteUser.bind(this));
        this.router.post('/:id/review/:event_id', this.addReview.bind(this));
    }
    getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paginationQuery = responseHandler_1.Pagination.parseQuery(req);
                const { data, total } = yield this.userService.findWithPagination({}, paginationQuery);
                const pagination = responseHandler_1.Pagination.calculatePagination(paginationQuery.page, paginationQuery.limit, total);
                res.json(responseHandler_1.ResponseHandler.success(data, 'Users retrieved successfully', pagination));
            }
            catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch users', error.message));
            }
        });
    }
    createUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = req.body;
                let usersArray;
                if (Array.isArray(input)) {
                    usersArray = input;
                }
                else if (typeof input === 'object' && input !== null) {
                    usersArray = [input];
                }
                else {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields: please insert one or more users'));
                }
                if (usersArray.length === 0) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'No users were provided'));
                }
                let baseId = yield this.userService.getNextId();
                const usersToInsert = [];
                for (const user of usersArray) {
                    const { name, age, occupation, movies } = user;
                    if (movies && Array.isArray(movies)) {
                        for (const movie of movies) {
                            const { movieid, rating } = movie;
                            if (movieid === undefined) {
                                return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields in user movie: movieid is required'));
                            }
                        }
                    }
                    usersToInsert.push({
                        _id: new mongodb_1.Int32(baseId++),
                        name,
                        age,
                        occupation: occupation ? (Array.isArray(occupation) ? occupation : [occupation]) : undefined,
                        movies: movies || []
                    });
                }
                const totalInsert = usersToInsert.length;
                let result;
                if (totalInsert === 1) {
                    const insertedUser = yield this.userService.create(usersToInsert[0]);
                    if (!insertedUser) {
                        throw new Error('Failed to create user');
                    }
                    result = {
                        insertedCount: 1,
                        insertedId: insertedUser._id
                    };
                }
                else {
                    const insertResult = yield this.userService.insertMany(usersToInsert);
                    result = {
                        insertedCount: insertResult.insertedCount,
                        insertedIds: insertResult.insertedIds
                    };
                }
                res.status(201).json(responseHandler_1.ResponseHandler.success(result, totalInsert === 1 ? 'User added successfully' : `${result.insertedCount} users added successfully`));
            }
            catch (error) {
                console.error('Error adding user(s):', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to add user(s)', error.message));
            }
        });
    }
    getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = new mongodb_1.Int32(parseInt(req.params.id));
                const user = yield this.userService.findById(userId);
                if (!user) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'User not found'));
                }
                // Get top 3 movies by rating (highest first)
                let topMovies = [];
                if (user.movies && user.movies.length > 0) {
                    topMovies = user.movies
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 3);
                }
                const response = {
                    _id: user._id,
                    name: user.name,
                    age: user.age,
                    occupation: user.occupation,
                    movies: user.movies,
                    topMovies
                };
                res.json(responseHandler_1.ResponseHandler.success(response, 'User retrieved successfully'));
            }
            catch (error) {
                console.error('Error fetching user:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to fetch user', error.message));
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = new mongodb_1.Int32(parseInt(req.params.id));
                const updateUser = req.body;
                const { name, age, occupation, movies } = updateUser;
                if (age === undefined && !occupation && !movies && name === undefined) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'You must provide at least one field to update: age, occupation or movies'));
                }
                if (movies && Array.isArray(movies)) {
                    for (const movie of movies) {
                        const { movieid, rating } = movie;
                        if (movieid === undefined || rating === undefined) {
                            return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Missing required fields in movie: movieid and rating are required'));
                        }
                    }
                }
                const updateData = {};
                if (name !== undefined)
                    updateData.name = name;
                if (age !== undefined)
                    updateData.age = age;
                if (occupation) {
                    updateData.occupation = Array.isArray(occupation) ? occupation : [occupation];
                }
                if (movies)
                    updateData.movies = movies;
                const result = yield this.userService.findOneAndUpdate({ _id: userId }, { $set: updateData }, { returnDocument: 'after' });
                if (!result) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'User not found'));
                }
                res.json(responseHandler_1.ResponseHandler.success(result, 'User updated successfully'));
            }
            catch (error) {
                console.error('Error updating user:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to update user', error.message));
            }
        });
    }
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = new mongodb_1.Int32(parseInt(req.params.id));
                const result = yield this.userService.delete(userId);
                if (!result || !result.value) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'User not found'));
                }
                res.status(204).send();
            }
            catch (error) {
                console.error(`Error deleting user with ID ${req.params.id}:`, error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to delete user', error.message));
            }
        });
    }
    addReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.params.id);
                const eventId = parseInt(req.params.event_id);
                const { rating } = req.body;
                if (rating === undefined || rating === null) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Missing rating'));
                }
                if (!Number.isInteger(rating) || rating < 0) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Invalid rating. The rating must be an integer over 0'));
                }
                if (isNaN(userId) || isNaN(eventId)) {
                    return res.status(400).json(responseHandler_1.ResponseHandler.error('VALIDATION_ERROR', 'Invalid User ID or Event ID format - must be numbers'));
                }
                // Check if user exists
                const user = yield this.userService.findById(new mongodb_1.Int32(userId));
                if (!user) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'User not found'));
                }
                // Add the review to the user's movies array
                const newUserMovie = {
                    movieid: new mongodb_1.Int32(eventId),
                    rating,
                    timestamp: Math.floor(Date.now() / 1000),
                    date: new Date()
                };
                // Update user with the new movie review
                const result = yield this.userService.findOneAndUpdate({ _id: new mongodb_1.Int32(userId) }, {
                    $push: { movies: newUserMovie }
                }, { returnDocument: 'after' });
                if (!result) {
                    return res.status(404).json(responseHandler_1.ResponseHandler.error('NOT_FOUND', 'User not found during update'));
                }
                res.status(201).json(responseHandler_1.ResponseHandler.success({
                    userId,
                    eventId,
                    rating,
                    timestamp: newUserMovie.timestamp,
                    date: newUserMovie.date
                }, 'Review added successfully to user'));
            }
            catch (error) {
                console.error('Error adding review:', error);
                res.status(500).json(responseHandler_1.ResponseHandler.error('DATABASE_ERROR', 'Failed to add review', error.message));
            }
        });
    }
}
exports.UserController = UserController;
