import { Model, Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';

export interface ICounterDocument {
  _id: string;
  // Counter name, e.g. "supplierCode".
  name: string;
  seq: number;
}

export const counterSchema = new Schema<ICounterDocument>({
  _id: mongooseStringRandomId,
  name: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, default: 0 },
});

export interface ICounterModel extends Model<ICounterDocument> {
  next(name: string): Promise<number>;
}

export const loadCounterClass = (models: IModels) => {
  class Counter {
    // Atomically increment and return the next value for `name`.
    public static async next(name: string): Promise<number> {
      const counter = await models.Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return counter.seq;
    }
  }

  counterSchema.loadClass(Counter);

  return counterSchema;
};
