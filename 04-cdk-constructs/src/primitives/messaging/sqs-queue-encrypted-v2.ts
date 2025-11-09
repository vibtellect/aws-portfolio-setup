import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface SqsQueueEncryptedProps {
  readonly encryptionMasterKey: kms.IKey;
  readonly queueName?: string;
  readonly retentionPeriod?: cdk.Duration;
  readonly visibilityTimeout?: cdk.Duration;
  readonly fifo?: boolean;
  readonly contentBasedDeduplication?: boolean;
  readonly enableDeadLetterQueue?: boolean;
  readonly maxReceiveCount?: number;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class SqsQueueEncrypted extends Construct implements sqs.IQueue {
  private readonly _queue: sqs.Queue;
  private readonly _fifo: boolean;

  public readonly queueArn: string;
  public readonly queueUrl: string;
  public readonly queueName: string;
  public readonly encryptionMasterKey?: kms.IKey;
  public readonly encryptionType?: sqs.QueueEncryption;
  public readonly env: cdk.ResourceEnvironment;
  public readonly stack: cdk.Stack;
  public readonly deadLetterQueue?: sqs.DeadLetterQueue;

  public get fifo(): boolean {
    return this._fifo;
  }

  constructor(scope: Construct, id: string, props: SqsQueueEncryptedProps) {
    super(scope, id);
    
    this.validateProps(props);
    
    const retentionPeriod = props.retentionPeriod ?? cdk.Duration.days(14);
    const visibilityTimeout = props.visibilityTimeout ?? cdk.Duration.seconds(30);
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();
    this._fifo = props.fifo ?? false;
    const contentBasedDeduplication = props.contentBasedDeduplication ?? false;
    
    let deadLetterQueue: sqs.DeadLetterQueue | undefined;
    
    if (props.enableDeadLetterQueue) {
      const dlqQueueName = props.queueName
        ? `${props.queueName}-dlq${this._fifo ? '.fifo' : ''}`
        : undefined;
        
      const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
        queueName: dlqQueueName,
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: props.encryptionMasterKey,
        retentionPeriod: cdk.Duration.days(14),
        fifo: this._fifo,
        removalPolicy,
      });
      
      deadLetterQueue = {
        queue: dlq,
        maxReceiveCount: props.maxReceiveCount ?? 3,
      };
      
      this.deadLetterQueue = deadLetterQueue;
      cdk.Tags.of(dlq).add('ManagedBy', 'CDK');
      cdk.Tags.of(dlq).add('Construct', 'SqsQueueEncrypted');
      cdk.Tags.of(dlq).add('Purpose', 'DeadLetterQueue');
    }
    
    const finalQueueName = props.queueName
      ? this._fifo && !props.queueName.endsWith('.fifo')
        ? `${props.queueName}.fifo`
        : props.queueName
      : undefined;
      
    this._queue = new sqs.Queue(this, 'Queue', {
      queueName: finalQueueName,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: props.encryptionMasterKey,
      retentionPeriod,
      visibilityTimeout,
      fifo: this._fifo,
      contentBasedDeduplication: this._fifo ? contentBasedDeduplication : undefined,
      deadLetterQueue,
      removalPolicy,
    });
    
    cdk.Tags.of(this._queue).add('ManagedBy', 'CDK');
    cdk.Tags.of(this._queue).add('Construct', 'SqsQueueEncrypted');
    cdk.Tags.of(this._queue).add('Encrypted', 'true');
    cdk.Tags.of(this._queue).add('EncryptionType', 'KMS');
    
    this.queueArn = this._queue.queueArn;
    this.queueUrl = this._queue.queueUrl;
    this.queueName = this._queue.queueName;
    this.encryptionMasterKey = this._queue.encryptionMasterKey;
    this.encryptionType = this._queue.encryptionType;
    this.env = this._queue.env;
    this.stack = this._queue.stack;
  }
  
  public addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    return this._queue.addToResourcePolicy(statement);
  }
  
  public grantConsumeMessages(grantee: iam.IGrantable): iam.Grant {
    return this._queue.grantConsumeMessages(grantee);
  }
  
  public grantSendMessages(grantee: iam.IGrantable): iam.Grant {
    return this._queue.grantSendMessages(grantee);
  }
  
  public grantPurge(grantee: iam.IGrantable): iam.Grant {
    return this._queue.grantPurge(grantee);
  }
  
  public grant(grantee: iam.IGrantable, ...queueActions: string[]): iam.Grant {
    return this._queue.grant(grantee, ...queueActions);
  }
  
  public metric(metricName: string, props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metric(metricName, props);
  }
  
  public metricApproximateAgeOfOldestMessage(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricApproximateAgeOfOldestMessage(props);
  }
  
  public metricApproximateNumberOfMessagesDelayed(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricApproximateNumberOfMessagesDelayed(props);
  }
  
  public metricApproximateNumberOfMessagesNotVisible(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricApproximateNumberOfMessagesNotVisible(props);
  }
  
  public metricApproximateNumberOfMessagesVisible(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricApproximateNumberOfMessagesVisible(props);
  }
  
  public metricNumberOfEmptyReceives(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricNumberOfEmptyReceives(props);
  }
  
  public metricNumberOfMessagesDeleted(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricNumberOfMessagesDeleted(props);
  }
  
  public metricNumberOfMessagesReceived(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricNumberOfMessagesReceived(props);
  }
  
  public metricNumberOfMessagesSent(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricNumberOfMessagesSent(props);
  }
  
  public metricSentMessageSize(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._queue.metricSentMessageSize(props);
  }
  
  public applyRemovalPolicy(policy: cdk.RemovalPolicy): void {
    this._queue.applyRemovalPolicy(policy);
  }
  
  private validateProps(props: SqsQueueEncryptedProps): void {
    if (!props.encryptionMasterKey) {
      throw new Error('Encryption master key is required for encrypted SQS queue');
    }
    if (props.maxReceiveCount !== undefined && !props.enableDeadLetterQueue) {
      throw new Error('maxReceiveCount can only be set when enableDeadLetterQueue is true');
    }
    if (props.contentBasedDeduplication && !props.fifo) {
      throw new Error('contentBasedDeduplication can only be enabled for FIFO queues');
    }
  }
  
  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stackName = cdk.Stack.of(this).stackName.toLowerCase();
    const devPatterns = ['dev', 'test', 'sandbox', 'local', 'demo'];
    const isDev = devPatterns.some((pattern) => stackName.includes(pattern));
    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }
}
