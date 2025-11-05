import { MongoClient, ObjectId, Collection } from 'mongodb';
import { PaginationQuery } from './responseHandler';

export class DatabaseService {
  constructor(private collection: Collection) { }

  async findWithPagination(
    filter: any = {},
    pagination: PaginationQuery
  ): Promise<{ data: any[]; total: number }> {
    const { page, limit, sort, order } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collection
        .find(filter)
        .sort({ [sort as string]: order === 'asc' ? 1 : -1 }) //FIXME: CAN FUCK UP
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(filter),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findOne(filter: any) {
    return this.collection.findOne(filter);
  }

  async create(document: any) {
    const result = await this.collection.insertOne({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.collection.findOne({ _id: result.insertedId });
  }

  async update(id: string, updates: any) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  async delete(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return this.collection.findOneAndDelete({ _id: new ObjectId(id) });
  }

  async count(filter: any = {}) {
    return this.collection.countDocuments(filter);
  }
}
