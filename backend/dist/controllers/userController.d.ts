import { Router } from 'express';
import { Collection } from 'mongodb';
export declare class UserController {
    router: Router;
    private userService;
    private movieColletion;
    constructor(collection: any, movieColletion: Collection);
    private initializeRoutes;
    private getAllUsers;
    private createUsers;
    private getUserById;
    private updateUser;
    private deleteUser;
    private addReview;
}
