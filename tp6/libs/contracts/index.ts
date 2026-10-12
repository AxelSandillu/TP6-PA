export interface EventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  correlationId: string;
  customerId: string;
  source: string;
  payload: T;
}

export interface ActivationRequestedPayload {
  planId: string;
  channel: string;
  simulateFailure: 'none' | 'billing' | 'provisioning';
}

export interface BillingAccountCreatedPayload {
  accountId: string;
  status: string;
}

export interface BillingFailedPayload {
  reason: string;
}

export interface BillingAccountCancelledPayload {
  accountId: string;
}

export interface ProvisioningCompletedPayload {
  provisioningId: string;
}

export interface ProvisioningFailedPayload {
  reason: string;
}

export interface ActivationCompletedPayload {
  status: 'ACTIVE';
}

export interface ActivationFailedPayload {
  reason: string;
}

// Nombres de los Tópicos oficiales definidos en el documento
export const TOPICS = {
  ACTIVATION_REQUESTED: 'activation.requested',
  BILLING_EVENTS: 'billing.events',
  PROVISIONING_EVENTS: 'provisioning.events',
  ACTIVATION_EVENTS: 'activation.events',
} as const;
