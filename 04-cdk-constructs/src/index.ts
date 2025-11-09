/**
 * AWS CDK Constructs Library
 *
 * Production-ready CDK constructs with security best practices,
 * cost optimization, and 100% test coverage.
 *
 * @packageDocumentation
 */

// ============================================================================
// PRIMITIVES - Security
// ============================================================================

export { IamRoleLambdaBasic } from './primitives/security/iam-role-lambda-basic';
export type { IamRoleLambdaBasicProps } from './primitives/security/iam-role-lambda-basic';

export { KmsKeyManaged } from './primitives/security/kms-key-managed';
export type { KmsKeyManagedProps } from './primitives/security/kms-key-managed';

// ============================================================================
// PRIMITIVES - Observability
// ============================================================================

export { LogGroupShortRetention } from './primitives/observability/log-group-short-retention';
export type { LogGroupShortRetentionProps } from './primitives/observability/log-group-short-retention';

// ============================================================================
// PRIMITIVES - Messaging
// ============================================================================

export { SqsQueueEncrypted } from './primitives/messaging/sqs-queue-encrypted';
export type { SqsQueueEncryptedProps } from './primitives/messaging/sqs-queue-encrypted';

export { SnsTopicEncrypted } from './primitives/messaging/sns-topic-encrypted';
export type { SnsTopicEncryptedProps } from './primitives/messaging/sns-topic-encrypted';
