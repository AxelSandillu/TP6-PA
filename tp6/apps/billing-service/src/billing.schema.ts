import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'billing_accounts' })
export class BillingAccount {
  @Prop({ type: String, required: true })
  _id: string; // activationId

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  status: string; // CREATED o CANCELLED
}

export const BillingAccountSchema: MongooseSchema =
  SchemaFactory.createForClass(BillingAccount);