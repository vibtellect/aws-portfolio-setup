// k6 load testing script for Multi-Runtime API Benchmark
// Install k6: https://k6.io/docs/getting-started/installation/
// Run: k6 run scripts/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const itemCreationDuration = new Trend('item_creation_duration');
const itemRetrievalDuration = new Trend('item_retrieval_duration');
const healthCheckDuration = new Trend('health_check_duration');
const requestCount = new Counter('request_count');

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    errors: ['rate<0.1'], // Error rate < 10%
    http_req_failed: ['rate<0.05'], // Failed requests < 5%
  },
};

// Get runtime from environment or use 'python' as default
const RUNTIME = __ENV.RUNTIME || 'python';
const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

// Test data
const testItems = [
  { name: 'Laptop', description: 'High-performance laptop', price: 1299.99 },
  { name: 'Mouse', description: 'Wireless mouse', price: 29.99 },
  { name: 'Keyboard', description: 'Mechanical keyboard', price: 89.99 },
  { name: 'Monitor', description: '27-inch 4K monitor', price: 449.99 },
  { name: 'Headphones', description: 'Noise-cancelling headphones', price: 199.99 },
];

export default function () {
  const runtime = RUNTIME;
  const baseUrl = BASE_URL;

  // Test 1: Health Check
  const healthRes = http.get(`${baseUrl}/${runtime}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check has runtime': (r) => r.json('runtime') === runtime,
  }) || errorRate.add(1);
  healthCheckDuration.add(healthRes.timings.duration);
  requestCount.add(1);

  sleep(0.5);

  // Test 2: Create Item
  const item = testItems[Math.floor(Math.random() * testItems.length)];
  const createRes = http.post(
    `${baseUrl}/${runtime}/items`,
    JSON.stringify(item),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const createSuccess = check(createRes, {
    'create item status is 201': (r) => r.status === 201,
    'create item returns success': (r) => r.json('success') === true,
    'create item has ID': (r) => r.json('data.id') !== undefined,
  });

  if (!createSuccess) errorRate.add(1);
  itemCreationDuration.add(createRes.timings.duration);
  requestCount.add(1);

  let itemId;
  if (createRes.status === 201) {
    itemId = createRes.json('data.id');
  }

  sleep(0.5);

  // Test 3: Get Item (if created successfully)
  if (itemId) {
    const getRes = http.get(`${baseUrl}/${runtime}/items/${itemId}`);
    check(getRes, {
      'get item status is 200': (r) => r.status === 200,
      'get item returns correct ID': (r) => r.json('data.id') === itemId,
    }) || errorRate.add(1);
    itemRetrievalDuration.add(getRes.timings.duration);
    requestCount.add(1);

    sleep(0.5);

    // Test 4: Update Item
    const updateData = { price: item.price * 1.1 };
    const updateRes = http.put(
      `${baseUrl}/${runtime}/items/${itemId}`,
      JSON.stringify(updateData),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    check(updateRes, {
      'update item status is 200': (r) => r.status === 200,
      'update item returns success': (r) => r.json('success') === true,
    }) || errorRate.add(1);
    requestCount.add(1);

    sleep(0.5);

    // Test 5: List Items
    const listRes = http.get(`${baseUrl}/${runtime}/items?limit=10`);
    check(listRes, {
      'list items status is 200': (r) => r.status === 200,
      'list items returns array': (r) => Array.isArray(r.json('data')),
    }) || errorRate.add(1);
    requestCount.add(1);

    sleep(0.5);

    // Test 6: Delete Item
    const deleteRes = http.del(`${baseUrl}/${runtime}/items/${itemId}`);
    check(deleteRes, {
      'delete item status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    requestCount.add(1);
  }

  // Test 7: Metrics Endpoint
  const metricsRes = http.get(`${baseUrl}/${runtime}/metrics`);
  check(metricsRes, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics has data': (r) => r.json('data') !== undefined,
  }) || errorRate.add(1);
  requestCount.add(1);

  sleep(1);
}

export function handleSummary(data) {
  const runtime = __ENV.RUNTIME || 'python';
  const timestamp = new Date().toISOString();

  return {
    [`results/load-test-${runtime}-${timestamp}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors || false;

  let summary = `\n${indent}Load Test Summary for ${__ENV.RUNTIME || 'python'}\n`;
  summary += `${indent}${'='.repeat(60)}\n\n`;

  const metrics = data.metrics;

  // Request metrics
  if (metrics.http_req_duration) {
    summary += `${indent}HTTP Request Duration:\n`;
    summary += `${indent}  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  min: ${metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
    summary += `${indent}  max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
    summary += `${indent}  p(50): ${metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
    summary += `${indent}  p(95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  p(99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  }

  // Custom metrics
  if (metrics.item_creation_duration) {
    summary += `${indent}Item Creation Duration:\n`;
    summary += `${indent}  avg: ${metrics.item_creation_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  p(95): ${metrics.item_creation_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.item_retrieval_duration) {
    summary += `${indent}Item Retrieval Duration:\n`;
    summary += `${indent}  avg: ${metrics.item_retrieval_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  p(95): ${metrics.item_retrieval_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  // Error rates
  if (metrics.errors) {
    summary += `${indent}Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  }

  if (metrics.http_req_failed) {
    summary += `${indent}Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }

  // Request count
  if (metrics.request_count) {
    summary += `${indent}Total Requests: ${metrics.request_count.values.count}\n\n`;
  }

  return summary;
}
