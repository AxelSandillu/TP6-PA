import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'event_log' })
export class EventLog {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  correlationId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  occurredAt: string;

  @Prop({ type: Object })
  rawEvent: any;
}

export const EventLogSchema: MongooseSchema =
  SchemaFactory.createForClass(EventLog);