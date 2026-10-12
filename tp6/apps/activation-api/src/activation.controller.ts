import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activation } from './activation.schema';
import { TOPICS } from './topics';
import { v4 as uuidv4 } from 'uuid';

@Controller('activations')
export class ActivationController {
  constructor(
    @InjectModel(Activation.name) private activationModel: Model<Activation>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @Post()
  async createActivation(
    @Body()
    body: {
      customerId: string;
      planId: string;
      simulateFailure?: string;
    },
  ) {
    const activationId = `act-${Date.now()}`;
    const correlationId = activationId;
    const eventId = uuidv4();
    const occurredAt = new Date().toISOString();

    if (!body.customerId || !body.planId) {
      throw new HttpException(
        'customerId y planId son obligatorios',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1. Guardar en MongoDB con estado PENDING (RF-02)
    const newActivation = new this.activationModel({
      _id: activationId,
      customerId: body.customerId,
      planId: body.planId,
      status: 'PENDING',
      simulateFailure: body.simulateFailure || 'none',
      history: [{ eventType: 'ActivationRequested', at: occurredAt }],
    });
    await newActivation.save();

    // 2. Construir el evento de contrato (Sobre común)
    const eventPayload = {
      eventId,
      eventType: 'ActivationRequested',
      version: 1,
      occurredAt,
      correlationId,
      customerId: body.customerId,
      source: 'activation-api',
      payload: {
        planId: body.planId,
        channel: 'web',
        simulateFailure: body.simulateFailure || 'none',
      },
    };

    // 3. Publicar el evento en el topic de Kafka correspondiente
    this.kafkaClient.emit(TOPICS.ACTIVATION_REQUESTED, eventPayload);

    // 4. Responder 202 Accepted sin esperar a los demás servicios (RF-02)
    return {
      activationId,
      status: 'PENDING',
      message: 'Activación solicitada correctamente',
    };
  }

  @Get(':id')
  async getActivation(@Param('id') id: string) {
    const activation = await this.activationModel.findById(id);
    if (!activation) {
      throw new HttpException('Activación no encontrada', HttpStatus.NOT_FOUND);
    }
    return activation;
  }

  @EventPattern(TOPICS.BILLING_EVENTS)
  async handleBillingEvents(@Payload() message: any) {
    await this.processStep(message, 'billing');
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  async handleProvisioningEvents(@Payload() message: any) {
    await this.processStep(message, 'provisioning');
  }

  private async processStep(message: any, step: 'billing' | 'provisioning') {
    const event = message.value || message;
    const { eventType, correlationId, customerId, payload, occurredAt } = event;

    const activation = await this.activationModel.findById(correlationId);
    if (!activation || activation.status === 'ACTIVE' || activation.status === 'FAILED') {
      return;
    }

    const isSuccess =
      step === 'billing'
        ? eventType === 'BillingAccountCreated'
        : eventType === 'ProvisioningCompleted';

    activation[step] = {
      status: isSuccess ? (step === 'billing' ? 'CREATED' : 'COMPLETED') : 'FAILED',
      at: occurredAt || new Date().toISOString(),
    };
    activation.history.push({ eventType, at: new Date().toISOString() });

    if (!isSuccess) {
      activation.status = 'FAILED';
      activation.history.push({
        eventType: 'ActivationFailed',
        at: new Date().toISOString(),
      });
      await activation.save();
      await this.publishResult('FAILED', correlationId, customerId, payload?.reason);
      return;
    }

    const billingDone = activation.billing?.status === 'CREATED';
    const provisioningDone = activation.provisioning?.status === 'COMPLETED';

    if (billingDone && provisioningDone) {
      activation.status = 'ACTIVE';
      activation.history.push({
        eventType: 'ActivationCompleted',
        at: new Date().toISOString(),
      });
      await activation.save();
      await this.publishResult('ACTIVE', correlationId, customerId);
    } else {
      activation.status = 'IN_PROGRESS';
      await activation.save();
    }
  }

  private async publishResult(
    result: 'ACTIVE' | 'FAILED',
    correlationId: string,
    customerId: string,
    reason?: string,
  ) {
    const event = {
      eventId: uuidv4(),
      eventType: result === 'ACTIVE' ? 'ActivationCompleted' : 'ActivationFailed',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      customerId,
      source: 'activation-api',
      payload: result === 'ACTIVE' ? { status: 'ACTIVE' } : { reason },
    };

    // Los consumidores de notificación/analytics escuchan activation.events
    this.kafkaClient.emit(TOPICS.ACTIVATION_EVENTS, event);

    // Topic de compensación para billing-service ante un fallo
    if (result === 'FAILED') {
      this.kafkaClient.emit(TOPICS.ACTIVATION_FAILED, event);
    }
  }
}