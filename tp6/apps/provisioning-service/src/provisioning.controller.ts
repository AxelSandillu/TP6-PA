import { Controller } from '@nestjs/common';
import { EventPattern, Payload, ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProvisioningOrder } from './provisioning.schema';
import { TOPICS } from './topics';
import { v4 as uuidv4 } from 'uuid';
import { Inject } from '@nestjs/common';

@Controller()
export class ProvisioningController {
  constructor(
    @InjectModel(ProvisioningOrder.name) private provisioningModel: Model<ProvisioningOrder>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async handleActivationRequested(@Payload() message: any) {
    const event = message.value || message;
    const { correlationId, customerId, payload } = event;

    // Simular retardo de 1 a 3 segundos como indica el documento de arquitectura
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Verificar si debe simular fallo en provisioning
    if (payload.simulateFailure === 'provisioning') {
      const failEvent = {
        eventId: uuidv4(),
        eventType: 'ProvisioningFailed',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId,
        customerId,
        source: 'provisioning-service',
        payload: { reason: 'Fallo simulado en aprovisionamiento' },
      };
      this.kafkaClient.emit(TOPICS.PROVISIONING_EVENTS, failEvent);
      return;
    }

    // Guardar orden de aprovisionamiento exitosa
    const order = new this.provisioningModel({
      _id: correlationId,
      customerId,
      status: 'COMPLETED',
    });
    await order.save();

    // Publicar evento de éxito
    const successEvent = {
      eventId: uuidv4(),
      eventType: 'ProvisioningCompleted',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      customerId,
      source: 'provisioning-service',
      payload: { provisioningId: correlationId },
    };

    this.kafkaClient.emit(TOPICS.PROVISIONING_EVENTS, successEvent);
  }
}