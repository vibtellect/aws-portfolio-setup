import { Stack, StackProps, Duration, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Dashboard, GraphWidget, Metric, Statistic, Unit, Row, SingleValueWidget, LogQueryWidget, LogQueryVisualizationType, TextWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Alarm, ComparisonOperator, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { getConfig, COMMON_TAGS } from './config';

export interface MonitoringStackProps extends StackProps {
  environment?: 'dev' | 'staging' | 'prod';
  lambdaFunctions: {
    python: IFunction;
    typescript: IFunction;
    go: IFunction;
    kotlin: IFunction;
  };
  table: ITable;
  alertEmail?: string;
}

/**
 * Monitoring stack for Multi-Runtime API Benchmark
 *
 * Creates:
 * - CloudWatch Dashboard with performance comparison widgets
 * - CloudWatch Alarms for error rates and performance issues
 * - SNS topic for alerts
 */
export class MonitoringStack extends Stack {
  public readonly dashboard: Dashboard;
  public readonly alarmTopic?: Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const config = getConfig(props.environment || 'dev');

    // Apply common tags
    Object.entries(COMMON_TAGS).forEach(([key, value]) => {
      Tags.of(this).add(key, value);
    });
    Tags.of(this).add('Environment', config.environment);

    // Create SNS topic for alarms if email provided
    if (props.alertEmail) {
      this.alarmTopic = new Topic(this, 'AlarmTopic', {
        displayName: `${config.projectName} Alerts - ${config.environment}`,
        topicName: `${config.projectName}-alerts-${config.environment}`,
      });

      this.alarmTopic.addSubscription(new EmailSubscription(props.alertEmail));
    }

    // Create CloudWatch Dashboard
    this.dashboard = new Dashboard(this, 'BenchmarkDashboard', {
      dashboardName: `${config.projectName}-${config.environment}`,
    });

    // Add title widget
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `# Multi-Runtime API Benchmark Dashboard
Environment: **${config.environment.toUpperCase()}**

Comparing performance metrics across Python, TypeScript, Go, and Kotlin Lambda runtimes.`,
        width: 24,
        height: 3,
      })
    );

    // Cold Start Duration Comparison
    this.addColdStartMetrics(props.lambdaFunctions);

    // Request Duration Comparison
    this.addDurationMetrics(props.lambdaFunctions);

    // Memory Utilization Comparison
    this.addMemoryMetrics(props.lambdaFunctions);

    // Error Rate and Throttling
    this.addErrorMetrics(props.lambdaFunctions);

    // Invocation Count and Concurrent Executions
    this.addInvocationMetrics(props.lambdaFunctions);

    // DynamoDB Metrics
    this.addDynamoDbMetrics(props.table);

    // Cost Projection (using invocations and duration)
    this.addCostProjection(props.lambdaFunctions);

    // Create alarms
    if (this.alarmTopic) {
      this.createAlarms(props.lambdaFunctions);
    }
  }

  private addColdStartMetrics(functions: MonitoringStackProps['lambdaFunctions']) {
    const coldStartWidget = new GraphWidget({
      title: 'Cold Start Duration Comparison (ms)',
      width: 12,
      height: 6,
      left: [
        this.createInitDurationMetric(functions.python, 'Python'),
        this.createInitDurationMetric(functions.typescript, 'TypeScript'),
        this.createInitDurationMetric(functions.go, 'Go'),
        this.createInitDurationMetric(functions.kotlin, 'Kotlin'),
      ],
      statistic: Statistic.AVERAGE,
    });

    const coldStartP99Widget = new GraphWidget({
      title: 'Cold Start Duration P99 (ms)',
      width: 12,
      height: 6,
      left: [
        this.createInitDurationMetric(functions.python, 'Python', 'p99'),
        this.createInitDurationMetric(functions.typescript, 'TypeScript', 'p99'),
        this.createInitDurationMetric(functions.go, 'Go', 'p99'),
        this.createInitDurationMetric(functions.kotlin, 'Kotlin', 'p99'),
      ],
    });

    this.dashboard.addWidgets(coldStartWidget, coldStartP99Widget);
  }

  private addDurationMetrics(functions: MonitoringStackProps['lambdaFunctions']) {
    this.dashboard.addWidgets(
      new Row(
        new GraphWidget({
          title: 'Request Duration - Average (ms)',
          width: 8,
          height: 6,
          left: [
            functions.python.metricDuration({ statistic: Statistic.AVERAGE, label: 'Python' }),
            functions.typescript.metricDuration({ statistic: Statistic.AVERAGE, label: 'TypeScript' }),
            functions.go.metricDuration({ statistic: Statistic.AVERAGE, label: 'Go' }),
            functions.kotlin.metricDuration({ statistic: Statistic.AVERAGE, label: 'Kotlin' }),
          ],
        }),
        new GraphWidget({
          title: 'Request Duration - P95 (ms)',
          width: 8,
          height: 6,
          left: [
            functions.python.metricDuration({ statistic: 'p95', label: 'Python' }),
            functions.typescript.metricDuration({ statistic: 'p95', label: 'TypeScript' }),
            functions.go.metricDuration({ statistic: 'p95', label: 'Go' }),
            functions.kotlin.metricDuration({ statistic: 'p95', label: 'Kotlin' }),
          ],
        }),
        new GraphWidget({
          title: 'Request Duration - P99 (ms)',
          width: 8,
          height: 6,
          left: [
            functions.python.metricDuration({ statistic: 'p99', label: 'Python' }),
            functions.typescript.metricDuration({ statistic: 'p99', label: 'TypeScript' }),
            functions.go.metricDuration({ statistic: 'p99', label: 'Go' }),
            functions.kotlin.metricDuration({ statistic: 'p99', label: 'Kotlin' }),
          ],
        })
      )
    );
  }

  private addMemoryMetrics(functions: MonitoringStackProps['lambdaFunctions']) {
    // Memory utilization requires custom metrics or CloudWatch Insights queries
    const memoryWidget = new LogQueryWidget({
      title: 'Memory Utilization Comparison',
      width: 12,
      height: 6,
      logGroupNames: [
        functions.python.logGroup.logGroupName,
        functions.typescript.logGroup.logGroupName,
        functions.go.logGroup.logGroupName,
        functions.kotlin.logGroup.logGroupName,
      ],
      queryLines: [
        'fields @memorySize / 1000000 as memorySize, @maxMemoryUsed / 1000000 as maxMemoryUsed',
        'stats avg(maxMemoryUsed) by bin(5m)',
      ],
      view: LogQueryVisualizationType.LINE,
    });

    const memoryStatsWidget = new SingleValueWidget({
      title: 'Current Memory Usage (MB)',
      width: 12,
      height: 6,
      metrics: [
        // These would need to be custom metrics published from Lambda
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'MemoryUtilization',
          dimensionsMap: { FunctionName: functions.python.functionName },
          statistic: Statistic.AVERAGE,
          label: 'Python',
        }),
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'MemoryUtilization',
          dimensionsMap: { FunctionName: functions.typescript.functionName },
          statistic: Statistic.AVERAGE,
          label: 'TypeScript',
        }),
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'MemoryUtilization',
          dimensionsMap: { FunctionName: functions.go.functionName },
          statistic: Statistic.AVERAGE,
          label: 'Go',
        }),
        new Metric({
          namespace: 'AWS/Lambda',
          metricName: 'MemoryUtilization',
          dimensionsMap: { FunctionName: functions.kotlin.functionName },
          statistic: Statistic.AVERAGE,
          label: 'Kotlin',
        }),
      ],
    });

    this.dashboard.addWidgets(memoryWidget, memoryStatsWidget);
  }

  private addErrorMetrics(functions: MonitoringStackProps['lambdaFunctions']) {
    this.dashboard.addWidgets(
      new Row(
        new GraphWidget({
          title: 'Error Rate (%)',
          width: 12,
          height: 6,
          left: [
            functions.python.metricErrors({ statistic: Statistic.SUM, label: 'Python Errors' }),
            functions.typescript.metricErrors({ statistic: Statistic.SUM, label: 'TypeScript Errors' }),
            functions.go.metricErrors({ statistic: Statistic.SUM, label: 'Go Errors' }),
            functions.kotlin.metricErrors({ statistic: Statistic.SUM, label: 'Kotlin Errors' }),
          ],
        }),
        new GraphWidget({
          title: 'Throttles',
          width: 12,
          height: 6,
          left: [
            functions.python.metricThrottles({ statistic: Statistic.SUM, label: 'Python' }),
            functions.typescript.metricThrottles({ statistic: Statistic.SUM, label: 'TypeScript' }),
            functions.go.metricThrottles({ statistic: Statistic.SUM, label: 'Go' }),
            functions.kotlin.metricThrottles({ statistic: Statistic.SUM, label: 'Kotlin' }),
          ],
        })
      )
    );
  }

  private addInvocationMetrics(functions: MonitoringStackProps['lambdaFunctions']) {
    this.dashboard.addWidgets(
      new Row(
        new GraphWidget({
          title: 'Invocations per Runtime',
          width: 12,
          height: 6,
          left: [
            functions.python.metricInvocations({ statistic: Statistic.SUM, label: 'Python' }),
            functions.typescript.metricInvocations({ statistic: Statistic.SUM, label: 'TypeScript' }),
            functions.go.metricInvocations({ statistic: Statistic.SUM, label: 'Go' }),
            functions.kotlin.metricInvocations({ statistic: Statistic.SUM, label: 'Kotlin' }),
          ],
        }),
        new GraphWidget({
          title: 'Concurrent Executions',
          width: 12,
          height: 6,
          left: [
            new Metric({
              namespace: 'AWS/Lambda',
              metricName: 'ConcurrentExecutions',
              dimensionsMap: { FunctionName: functions.python.functionName },
              statistic: Statistic.MAXIMUM,
              label: 'Python',
            }),
            new Metric({
              namespace: 'AWS/Lambda',
              metricName: 'ConcurrentExecutions',
              dimensionsMap: { FunctionName: functions.typescript.functionName },
              statistic: Statistic.MAXIMUM,
              label: 'TypeScript',
            }),
            new Metric({
              namespace: 'AWS/Lambda',
              metricName: 'ConcurrentExecutions',
              dimensionsMap: { FunctionName: functions.go.functionName },
              statistic: Statistic.MAXIMUM,
              label: 'Go',
            }),
            new Metric({
              namespace: 'AWS/Lambda',
              metricName: 'ConcurrentExecutions',
              dimensionsMap: { FunctionName: functions.kotlin.functionName },
              statistic: Statistic.MAXIMUM,
              label: 'Kotlin',
            }),
          ],
        })
      )
    );
  }

  private addDynamoDbMetrics(table: ITable) {
    this.dashboard.addWidgets(
      new Row(
        new GraphWidget({
          title: 'DynamoDB Read/Write Operations',
          width: 12,
          height: 6,
          left: [
            table.metricConsumedReadCapacityUnits({ statistic: Statistic.SUM }),
            table.metricConsumedWriteCapacityUnits({ statistic: Statistic.SUM }),
          ],
        }),
        new GraphWidget({
          title: 'DynamoDB Latency',
          width: 12,
          height: 6,
          left: [
            table.metricSuccessfulRequestLatency({ statistic: Statistic.AVERAGE }),
          ],
        })
      )
    );
  }

  private addCostProjection(functions: MonitoringStackProps['lambdaFunctions']) {
    // Cost calculation widget (simplified)
    this.dashboard.addWidgets(
      new TextWidget({
        markdown: `## Cost Projection

Cost per 1M requests (estimated):
- **Python**: Based on invocations × duration × memory
- **TypeScript**: Based on invocations × duration × memory
- **Go**: Based on invocations × duration × memory
- **Kotlin**: Based on invocations × duration × memory

Formula: \`(Invocations × Duration × Memory / 1024) × $0.0000166667\`

*Note: View actual billing in Cost Explorer for precise costs*`,
        width: 24,
        height: 4,
      })
    );
  }

  private createInitDurationMetric(func: IFunction, label: string, statistic: string = 'avg'): Metric {
    return new Metric({
      namespace: 'AWS/Lambda',
      metricName: 'InitDuration',
      dimensionsMap: {
        FunctionName: func.functionName,
      },
      statistic,
      label,
      unit: Unit.MILLISECONDS,
    });
  }

  private createAlarms(functions: MonitoringStackProps['lambdaFunctions']) {
    if (!this.alarmTopic) return;

    const snsAction = new SnsAction(this.alarmTopic);

    // Error rate alarms for each runtime
    Object.entries(functions).forEach(([runtime, func]) => {
      const errorAlarm = new Alarm(this, `${runtime}ErrorAlarm`, {
        alarmName: `${func.functionName}-high-error-rate`,
        metric: func.metricErrors({
          statistic: Statistic.SUM,
          period: Duration.minutes(5),
        }),
        threshold: 10, // More than 10 errors in 5 minutes
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      });
      errorAlarm.addAlarmAction(snsAction);

      // P99 latency alarm
      const latencyAlarm = new Alarm(this, `${runtime}LatencyAlarm`, {
        alarmName: `${func.functionName}-high-latency`,
        metric: func.metricDuration({
          statistic: 'p99',
          period: Duration.minutes(5),
        }),
        threshold: 1000, // P99 > 1000ms
        evaluationPeriods: 2,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      });
      latencyAlarm.addAlarmAction(snsAction);

      // Throttle alarm
      const throttleAlarm = new Alarm(this, `${runtime}ThrottleAlarm`, {
        alarmName: `${func.functionName}-throttles`,
        metric: func.metricThrottles({
          statistic: Statistic.SUM,
          period: Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      });
      throttleAlarm.addAlarmAction(snsAction);
    });
  }
}
