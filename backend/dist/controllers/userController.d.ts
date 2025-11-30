import { Router } from 'express';
import { Db, MongoClient } from 'mongodb';
export declare class UserController {
    router: Router;
    private userService;
    private db;
    private mongo;
    constructor(collection: any, db: Db, mongo: MongoClient);
    private initializeRoutes;
    private getAllUsers;
    private createUsers;
    private getUserById;
    private updateUser;
    private deleteUser;
    private addReview;
}
