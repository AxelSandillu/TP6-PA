import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'activations' })
export class Activation {
  @Prop({ type: String, required: true })
  _id: string; // activationId

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true, default: 'PENDING' })
  status: string; // PENDING, IN_PROGRESS, ACTIVE, FAILED

  @Prop({ default: 'none' })
  simulateFailure: string;

  @Prop({ type: Object, default: {} })
  billing: { status?: string; at?: string };

  @Prop({ type: Object, default: {} })
  provisioning: { status?: string; at?: string };

  @Prop({ type: Array, default: [] })
  history: Array<{ eventType: string; at: string }>;
}

export const ActivationSchema: MongooseSchema =
  SchemaFactory.createForClass(Activation);