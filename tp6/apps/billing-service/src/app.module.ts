import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingController } from './billing.controller';
import { BillingAccount, BillingAccountSchema } from './billing.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/billing_db',
    ),
    MongooseModule.forFeature([
      { name: BillingAccount.name, schema: BillingAccountSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'billing-producer',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [BillingController],
})
export class AppModule {}
