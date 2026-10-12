import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'provisioning_orders' })
export class ProvisioningOrder {
  @Prop({ type: String, required: true })
  _id: string; // activationId

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  status: string; // COMPLETED o FAILED
}

export const ProvisioningOrderSchema: MongooseSchema =
  SchemaFactory.createForClass(ProvisioningOrder);