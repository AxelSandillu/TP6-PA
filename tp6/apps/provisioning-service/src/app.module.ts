import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProvisioningController } from './provisioning.controller';
import {
  ProvisioningOrder,
  ProvisioningOrderSchema,
} from './provisioning.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/provisioning_db',
    ),
    MongooseModule.forFeature([
      { name: ProvisioningOrder.name, schema: ProvisioningOrderSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'provisioning-producer',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [ProvisioningController],
})
export class AppModule {}
