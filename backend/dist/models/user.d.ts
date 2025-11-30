import { WithId, Document, Int32 } from 'mongodb';
export interface UserMovie {
    movieid: Int32;
    rating: number;
    timestamp: number;
    date: Date;
}
export interface User {
    _id?: Int32;
    name?: string;
    gender?: string;
    age?: number;
    occupation?: string[];
    movies?: UserMovie[];
}
export type UserDocument = WithId<Document> & User;
export interface UserResponse {
    _id?: Int32;
    name?: string;
    gender?: string;
    age?: number;
    occupation?: string[];
    movies?: UserMovie[];
    topMovies?: UserMovie[];
}
