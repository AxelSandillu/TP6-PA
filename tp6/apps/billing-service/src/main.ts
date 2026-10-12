import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
        clientId: 'billing-service',
      },
      consumer: {
        groupId: 'billing-service-group',
      },
    },
  });

  await app.listen();
  console.log('billing-service escuchando eventos de Kafka...');
}
bootstrap();