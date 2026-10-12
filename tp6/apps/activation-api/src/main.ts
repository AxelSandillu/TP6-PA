import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Conectamos el cliente de microservicios Kafka para escuchar eventos de billing y provisioning
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
        clientId: 'activation-api',
      },
      consumer: {
        groupId: 'activation-api-group',
      },
    },
  });

  await app.startAllMicroservices();

  // Puerto HTTP especificado en la arquitectura para la activation-api
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`activation-api corriendo en el puerto ${port}`);
}
bootstrap();
