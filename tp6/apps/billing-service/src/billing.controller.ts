import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BillingAccount } from './billing.schema';
import { TOPICS } from './topics';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class BillingController {
  constructor(
    @InjectModel(BillingAccount.name) private billingModel: Model<BillingAccount>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async handleActivationRequested(@Payload() message: any) {
    const event = message.value || message;
    const { correlationId, customerId, payload } = event;

    // Verificar si debe simular fallo en billing (para escenarios de prueba)
    if (payload.simulateFailure === 'billing') {
      const failEvent = {
        eventId: uuidv4(),
        eventType: 'BillingFailed',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId,
        customerId,
        source: 'billing-service',
        payload: { reason: 'Fallo simulado en facturación' },
      };
      this.kafkaClient.emit(TOPICS.BILLING_EVENTS, failEvent);
      return;
    }

    // Simular la creación de la cuenta de facturación
    const account = new this.billingModel({
      _id: correlationId,
      customerId,
      status: 'CREATED',
    });
    await account.save();

    // Publicar evento de éxito en billing.events
    const successEvent = {
      eventId: uuidv4(),
      eventType: 'BillingAccountCreated',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      customerId,
      source: 'billing-service',
      payload: { accountId: correlationId, status: 'CREATED' },
    };

    this.kafkaClient.emit(TOPICS.BILLING_EVENTS, successEvent);
  }

  @EventPattern(TOPICS.ACTIVATION_FAILED) // Escucha si la activación general falló para hacer compensación
  async handleActivationFailed(@Payload() message: any) {
    const event = message.value || message;
    const { correlationId } = event;

    // Compensación: anular la cuenta si había sido creada
    const account = await this.billingModel.findById(correlationId);
    if (account && account.status === 'CREATED') {
      account.status = 'CANCELLED';
      await account.save();

      const cancelEvent = {
        eventId: uuidv4(),
        eventType: 'BillingAccountCancelled',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId,
        customerId: account.customerId,
        source: 'billing-service',
        payload: { accountId: correlationId },
      };

      this.kafkaClient.emit(TOPICS.BILLING_EVENTS, cancelEvent);
    }
  }
}