import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          clientId: 'provisioning-service',
        },
        consumer: {
          groupId: 'provisioning-service-group',
        },
      },
    },
  );

  await app.listen();
  console.log('provisioning-service escuchando eventos de Kafka...');
}
bootstrap();
