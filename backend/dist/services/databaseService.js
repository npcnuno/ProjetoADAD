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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
class DatabaseService {
    constructor(collection) {
        this.collection = collection;
    }
    findWithPagination() {
        return __awaiter(this, arguments, void 0, function* (filter = {}, pagination) {
            const { page, limit, sort, order } = pagination;
            const skip = (page - 1) * limit;
            const [data, total] = yield Promise.all([
                this.collection
                    .find(filter)
                    .sort(sort ? { [sort]: order === 'asc' ? 1 : -1 } : {})
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                this.collection.countDocuments(filter),
            ]);
            return { data, total };
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Convert number to MongoDB Int32 equivalent
            return this.collection.findOne({ _id: id });
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.findOne(filter);
        });
    }
    getNextId() {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the highest _id in the collection
            const result = yield this.collection
                .find({}, { projection: { _id: 1 } })
                .sort({ _id: -1 })
                .limit(1)
                .toArray();
            if (result.length === 0) {
                return 1; // First document
            }
            return parseInt(result[0]._id.toString()) + 1;
        });
    }
    findOneAndUpdate(filter_1, update_1) {
        return __awaiter(this, arguments, void 0, function* (filter, update, options = {}) {
            const { returnDocument = 'after', upsert = false, } = options;
            try {
                let updateDoc = Object.assign({}, update);
                const isUsingOperators = Object.keys(update).some(key => key.startsWith('$'));
                if (isUsingOperators) {
                    if (!updateDoc.$set) {
                        updateDoc.$set = {};
                    }
                    updateDoc.$set.updatedAt = new Date();
                }
                else {
                    updateDoc = {
                        $set: Object.assign(Object.assign({}, updateDoc), { updatedAt: new Date() })
                    };
                }
                console.log('Executing update with:', {
                    filter,
                    update: updateDoc,
                    options: { returnDocument, upsert }
                });
                const result = yield this.collection.findOneAndUpdate(filter, updateDoc, {
                    returnDocument,
                    upsert
                });
                if (!result.value && !upsert) {
                    console.log('No document found matching filter:', filter);
                }
                return result.value;
            }
            catch (error) {
                console.error('Error in findOneAndUpdate:', error);
                throw error;
            }
        });
    }
    create(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.collection.insertOne(Object.assign(Object.assign({}, document), { createdAt: new Date(), updatedAt: new Date() }));
            const insertedDoc = yield this.collection.findOne({ _id: result.insertedId });
            return insertedDoc;
        });
    }
    insertMany(documents) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!documents || documents.length === 0) {
                throw new Error('No documents provided for bulk insert');
            }
            const documentsWithTimestamps = documents.map(doc => (Object.assign(Object.assign({}, doc), { createdAt: new Date(), updatedAt: new Date() })));
            const result = yield this.collection.insertMany(documentsWithTimestamps);
            // Convert ObjectId to numbers for our API response
            const insertedIds = Object.values(result.insertedIds).map(id => id.toString());
            return {
                insertedCount: result.insertedCount,
                insertedIds: insertedIds // We'll handle the conversion properly in controller
            };
        });
    }
    update(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.collection.findOneAndUpdate({ _id: id }, {
                $set: Object.assign(Object.assign({}, updates), { updatedAt: new Date() })
            }, { returnDocument: 'after' });
            return result;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.findOneAndDelete({ _id: id });
        });
    }
    count() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return this.collection.countDocuments(filter);
        });
    }
    aggregate(pipeline) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.aggregate(pipeline).toArray();
        });
    }
}
exports.DatabaseService = DatabaseService;
