import { Router } from 'express';
export declare class UserController {
    router: Router;
    private userService;
    constructor(collection: any);
    private initializeRoutes;
    private getAllUsers;
    private createUsers;
    private getUserById;
    private updateUser;
    private deleteUser;
    private addReview;
}
