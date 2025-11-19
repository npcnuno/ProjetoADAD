import { Collection, Int32 } from 'mongodb';
import { PaginationQuery } from '../middleware/responseHandler';

export class DatabaseService {
  constructor(public collection: Collection) { }

  async findWithPagination(
    filter: any = {},
    pagination: PaginationQuery
  ): Promise<{ data: any[]; total: number }> {
    const { page, limit, sort, order } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collection
        .find(filter)
        .sort(sort ? { [sort]: order === 'asc' ? 1 : -1 } : {})
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(filter),
    ]);

    return { data, total };
  }

  async findById(id: Int32) {
    // Convert number to MongoDB Int32 equivalent
    return this.collection.findOne({ _id: id });
  }

  async findOne(filter: any) {
    return this.collection.findOne(filter);
  }

  async getNextId(): Promise<number> {
    // Find the highest _id in the collection
    const result = await this.collection
      .find({}, { projection: { _id: 1 } })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (result.length === 0) {
      return 1; // First document
    }

    return parseInt(result[0]._id.toString()) + 1;
  }


  async findOneAndUpdate(
    filter: any,
    update: any,
    options: {
      returnDocument?: 'before' | 'after';
      upsert?: boolean;
    } = {}
  ) {
    const {
      returnDocument = 'after',
      upsert = false,
    } = options;
    try {
      let updateDoc = { ...update };
      const isUsingOperators = Object.keys(update).some(key => key.startsWith('$'));
      if (isUsingOperators) {
        if (!updateDoc.$set) {
          updateDoc.$set = {};
        }
        updateDoc.$set.updatedAt = new Date();
      } else {
        updateDoc = {
          $set: {
            ...updateDoc,
            updatedAt: new Date()
          }
        };
      }
      console.log('Executing update with:', {
        filter,
        update: updateDoc,
        options: { returnDocument, upsert }
      });
      const result = await this.collection.findOneAndUpdate(
        filter,
        updateDoc,
        {
          returnDocument,
          upsert
        }
      );
      if (!result.value && !upsert) {
        console.log('No document found matching filter:', filter);
      }
      return result.value;
    } catch (error) {
      console.error('Error in findOneAndUpdate:', error);
      throw error;
    }
  }
  async create(document: any) {
    const result = await this.collection.insertOne({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const insertedDoc = await this.collection.findOne({ _id: result.insertedId });
    return insertedDoc;
  }

  async insertMany(documents: any[]): Promise<{ insertedCount: number; insertedIds: number[] }> {
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for bulk insert');
    }

    const documentsWithTimestamps = documents.map(doc => ({
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await this.collection.insertMany(documentsWithTimestamps);

    // Convert ObjectId to numbers for our API response
    const insertedIds = Object.values(result.insertedIds).map(id => id.toString());

    return {
      insertedCount: result.insertedCount,
      insertedIds: insertedIds as any // We'll handle the conversion properly in controller
    };
  }

  async update(id: Int32, updates: any) {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
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

  async delete(id: Int32) {
    return this.collection.findOneAndDelete({ _id: id });
  }

  async count(filter: any = {}) {
    return this.collection.countDocuments(filter);
  }

  async aggregate(pipeline: any[]) {
    return this.collection.aggregate(pipeline).toArray();
  }
}
