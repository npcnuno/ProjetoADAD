import { WithId, Document, Int32 } from 'mongodb';
export interface Review {
    userId: Int32;
    rating: number;
    createdAt: Date;
}
export interface Movie {
    _id?: Int32;
    title: string;
    genres: string[];
    year: number;
    reviews?: Review[];
}
export type MovieDocument = WithId<Document> & Movie;
export interface MovieResponse {
    _id?: Int32;
    title: string;
    genres: string[];
    year: number;
    averageScore?: number;
}
