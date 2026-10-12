import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ActivationController } from './activation.controller';
import { Activation, ActivationSchema } from './activation.schema';
import { AppService } from './app.service';

@Module({
  imports: [
    // Conexión a MongoDB (asumiendo base de datos 'activation_db')
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/activation_db',
    ),
    MongooseModule.forFeature([
      { name: Activation.name, schema: ActivationSchema },
    ]),

    // Configuración del cliente Kafka para publicar eventos
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'activation-producer',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [ActivationController],
  providers: [AppService],
})
export class AppModule {}
