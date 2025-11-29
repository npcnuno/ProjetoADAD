import { Router } from 'express';
export declare class MovieController {
    router: Router;
    private movieService;
    constructor(collection: any);
    private initializeRoutes;
    private getAllMovies;
    private createMovies;
    private getMovieById;
    private updateMovie;
    private deleteMovie;
    private getTopMovies;
    private getMoviesByRatingsCount;
    private getStarMovies;
    private getMoviesByYear;
    private getMoviesByGenre;
    private searchMovies;
    private getUserReviews;
    private getStatsSummary;
}
