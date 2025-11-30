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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const movieController_1 = require("./controllers/movieController");
const userController_1 = require("./controllers/userController");
const responseHandler_1 = require("./middleware/responseHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'movieDB';
if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}
// Create MongoDB client
const client = new mongodb_1.MongoClient(MONGODB_URI, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db = null;
// Connect to MongoDB
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            db = client.db(DB_NAME);
            console.log('Connected to MongoDB Atlas');
            yield db.command({ ping: 1 });
            console.log('Ping successful!');
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    });
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Response middleware for consistent response handling
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object' && 'success' in data) {
            return originalJson.call(this, data);
        }
        if (data && data.error) {
            const errorResponse = responseHandler_1.ResponseHandler.error(data.code || 'INTERNAL_ERROR', data.message || 'An error occurred', data.details);
            return originalJson.call(this, errorResponse);
        }
        const successResponse = responseHandler_1.ResponseHandler.success(data);
        return originalJson.call(this, successResponse);
    };
    next();
});
// Initialize controllers
let movieController;
let userController;
function initializeControllers() {
    return __awaiter(this, void 0, void 0, function* () {
        movieController = new movieController_1.MovieController(db.collection('movies'));
        userController = new userController_1.UserController(db.collection('users'), db.collection("movies"));
        // Mount routes
        app.use('/api/v1/movies', movieController.router);
        app.use('/api/v1/users', userController.router);
    });
}
// Health check
app.get('/api/v1/health', (req, res) => {
    res.json(responseHandler_1.ResponseHandler.success({ status: 'OK' }, 'API is running'));
});
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDB();
    yield initializeControllers();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints:`);
        console.log(`   Movies: http://localhost:${PORT}/api/v1/movies`);
        console.log(`   Users:  http://localhost:${PORT}/api/v1/users`);
        console.log(`   Health: http://localhost:${PORT}/api/v1/health`);
        console.log(`\n📚 Available User Endpoints:`);
        console.log(`   GET    /api/v1/users - Get all users (with pagination)`);
        console.log(`   POST   /api/v1/users - Create user(s)`);
        console.log(`   GET    /api/v1/users/:id - Get user by ID (includes top 3 movies)`);
        console.log(`   PUT    /api/v1/users/:id - Update user`);
        console.log(`   DELETE /api/v1/users/:id - Delete user`);
        console.log(`   POST   /api/v1/users/:id/review/:event_id - Add review to movie`);
        console.log(`\n📚 Available Movie Endpoints:`);
        console.log(`   GET    /api/v1/movies - Get all movies (with pagination)`);
        console.log(`   POST   /api/v1/movies - Create movie(s)`);
        console.log(`   GET    /api/v1/movies/top/:limit - Get top rated movies`);
        console.log(`   GET    /api/v1/movies/ratings/:order - Get movies by ratings count`);
        console.log(`   GET    /api/v1/movies/star - Get star movies (5+ five-star reviews)`);
        console.log(`   GET    /api/v1/movies/year/:year - Get movies by year`);
        console.log(`   GET    /api/v1/movies/genre/:genre - Get movies by genre`);
        console.log(`   GET    /api/v1/movies/search/:query - Search movies by title`);
        console.log(`   GET    /api/v1/movies/user/:userId/reviews - Get user reviews`);
        console.log(`   GET    /api/v1/movies/stats/summary - Get statistics summary`);
        console.log(`   GET    /api/v1/movies/:id - Get movie by ID`);
        console.log(`   PUT    /api/v1/movies/:id - Update movie`);
        console.log(`   DELETE /api/v1/movies/:id - Delete movie`);
    });
});
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n📦 Closing MongoDB connection...');
    yield client.close();
    process.exit(0);
}));
startServer().catch((err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});
