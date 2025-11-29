import { Collection, Int32 } from 'mongodb';
import { PaginationQuery } from '../middleware/responseHandler';
export declare class DatabaseService {
    collection: Collection;
    constructor(collection: Collection);
    findWithPagination(filter: any | undefined, pagination: PaginationQuery): Promise<{
        data: any[];
        total: number;
    }>;
    findById(id: Int32): Promise<import("mongodb").WithId<import("bson").Document> | null>;
    findOne(filter: any): Promise<import("mongodb").WithId<import("bson").Document> | null>;
    getNextId(): Promise<number>;
    findOneAndUpdate(filter: any, update: any, options?: {
        returnDocument?: 'before' | 'after';
        upsert?: boolean;
    }): Promise<import("mongodb").WithId<import("bson").Document> | null>;
    create(document: any): Promise<import("mongodb").WithId<import("bson").Document> | null>;
    insertMany(documents: any[]): Promise<{
        insertedCount: number;
        insertedIds: number[];
    }>;
    update(id: Int32, updates: any): Promise<import("mongodb").ModifyResult<import("bson").Document>>;
    delete(id: Int32): Promise<import("mongodb").ModifyResult<import("bson").Document>>;
    count(filter?: any): Promise<number>;
    aggregate(pipeline: any[]): Promise<import("bson").Document[]>;
}
