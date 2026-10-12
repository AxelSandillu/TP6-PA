import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import * as nodemailer from 'nodemailer';

@Controller()
export class NotificationController {
  private transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025, // Puerto SMTP de Mailhog
    secure: false,
  });

  @EventPattern('activation.events')
  async handleActivationEvents(@Payload() message: any) {
    const event = message.value || message;
    const { eventType, customerId, correlationId, payload } = event;

    let subject = '';
    let text = '';

    if (eventType === 'ActivationCompleted') {
      subject = `¡Bienvenido! Activación exitosa para el cliente ${customerId}`;
      text = `Hola, tu plan ha sido activado correctamente. ID de activación: ${correlationId}`;
    } else if (eventType === 'ActivationFailed') {
      subject = `Error en la activación para el cliente ${customerId}`;
      text = `Lo sentimos, ocurrió un error en tu proceso de activación. Motivo: ${payload?.reason || 'Desconocido'}`;
    } else {
      return;
    }

    // Enviar correo simulado a Mailhog (accesible en http://localhost:8025)
    await this.transporter.sendMail({
      from: 'system@activation-poc.local',
      to: `${customerId}@client.local`,
      subject,
      text,
    });
  }
}
