import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog } from './apps/analytics.schema';

@Controller()
export class AnalyticsController {
  constructor(
    @InjectModel(EventLog.name) private eventLogModel: Model<EventLog>,
  ) {}

  @EventPattern(['activation.requested', 'billing.events', 'provisioning.events', 'activation.events'])
  async handleAllEvents(@Payload() message: any) {
    const event = message.value || message;
    const { eventId, eventType, correlationId, customerId, occurredAt, source } = event;

    try {
      const logEntry = new this.eventLogModel({
        eventId,
        eventType,
        correlationId,
        customerId,
        source,
        occurredAt,
        rawEvent: event,
      });
      await logEntry.save();
    } catch {
      // Ignorar duplicados por idempotencia básica si llegasen a reintentarse
    }
  }
}