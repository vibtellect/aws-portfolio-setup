#!/usr/bin/env python3

"""
Compare benchmark results across all runtimes and generate a comparison report.
"""

import json
import sys
import csv
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


def load_cold_start_data(results_dir: Path) -> Dict[str, List[Dict]]:
    """Load cold start measurements from CSV."""
    cold_start_file = results_dir / "cold-starts.csv"

    if not cold_start_file.exists():
        print(f"Warning: Cold start file not found: {cold_start_file}")
        return {}

    data = defaultdict(list)

    with open(cold_start_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            runtime = row['runtime']
            data[runtime].append({
                'iteration': int(row['iteration']),
                'cold_start': row['cold_start'].lower() == 'true',
                'duration_ms': float(row['duration_ms']),
                'memory_used_mb': float(row['memory_used_mb']),
                'timestamp': row['timestamp']
            })

    return dict(data)


def load_load_test_data(results_dir: Path) -> Dict[str, Dict]:
    """Load k6 load test results from JSON."""
    data = {}

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        load_test_file = results_dir / f"load-test-{runtime}.json"

        if not load_test_file.exists():
            print(f"Warning: Load test file not found: {load_test_file}")
            continue

        with open(load_test_file, 'r') as f:
            data[runtime] = json.load(f)

    return data


def calculate_cold_start_stats(cold_start_data: List[Dict]) -> Dict:
    """Calculate statistics for cold starts."""
    if not cold_start_data:
        return {}

    cold_starts = [d for d in cold_start_data if d['cold_start']]

    if not cold_starts:
        return {
            'count': 0,
            'avg_duration': 0,
            'min_duration': 0,
            'max_duration': 0,
            'avg_memory': 0
        }

    durations = [cs['duration_ms'] for cs in cold_starts]
    memories = [cs['memory_used_mb'] for cs in cold_starts if cs['memory_used_mb'] > 0]

    return {
        'count': len(cold_starts),
        'avg_duration': sum(durations) / len(durations),
        'min_duration': min(durations),
        'max_duration': max(durations),
        'p50_duration': sorted(durations)[len(durations) // 2],
        'p95_duration': sorted(durations)[int(len(durations) * 0.95)],
        'p99_duration': sorted(durations)[int(len(durations) * 0.99)] if len(durations) > 1 else max(durations),
        'avg_memory': sum(memories) / len(memories) if memories else 0
    }


def extract_load_test_metrics(load_test_data: Dict) -> Dict:
    """Extract key metrics from k6 load test results."""
    if not load_test_data:
        return {}

    metrics = load_test_data.get('metrics', {})

    result = {}

    # HTTP request duration
    if 'http_req_duration' in metrics:
        http_duration = metrics['http_req_duration']['values']
        result['request_duration'] = {
            'avg': http_duration.get('avg', 0),
            'min': http_duration.get('min', 0),
            'max': http_duration.get('max', 0),
            'p50': http_duration.get('p(50)', 0),
            'p95': http_duration.get('p(95)', 0),
            'p99': http_duration.get('p(99)', 0)
        }

    # Request rate
    if 'http_reqs' in metrics:
        http_reqs = metrics['http_reqs']['values']
        result['requests_per_second'] = http_reqs.get('rate', 0)

    # Error rate
    if 'errors' in metrics:
        result['error_rate'] = metrics['errors']['values'].get('rate', 0) * 100

    # Failed requests
    if 'http_req_failed' in metrics:
        result['failed_request_rate'] = metrics['http_req_failed']['values'].get('rate', 0) * 100

    # Total requests
    if 'request_count' in metrics:
        result['total_requests'] = metrics['request_count']['values'].get('count', 0)

    # Item creation duration
    if 'item_creation_duration' in metrics:
        item_creation = metrics['item_creation_duration']['values']
        result['item_creation_duration'] = {
            'avg': item_creation.get('avg', 0),
            'p95': item_creation.get('p(95)', 0)
        }

    # Item retrieval duration
    if 'item_retrieval_duration' in metrics:
        item_retrieval = metrics['item_retrieval_duration']['values']
        result['item_retrieval_duration'] = {
            'avg': item_retrieval.get('avg', 0),
            'p95': item_retrieval.get('p(95)', 0)
        }

    return result


def generate_markdown_report(results_dir: Path, cold_starts: Dict, load_tests: Dict) -> str:
    """Generate a markdown comparison report."""
    report = []

    report.append("# Multi-Runtime API Benchmark - Comparison Report")
    report.append("")
    report.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    report.append("")
    report.append("---")
    report.append("")

    # Cold Start Comparison
    report.append("## Cold Start Performance")
    report.append("")

    if cold_starts:
        report.append("| Runtime | Count | Avg (ms) | Min (ms) | Max (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Avg Memory (MB) |")
        report.append("|---------|-------|----------|----------|----------|----------|----------|----------|-----------------|")

        for runtime in ['python', 'typescript', 'go', 'kotlin']:
            if runtime in cold_starts:
                stats = calculate_cold_start_stats(cold_starts[runtime])
                if stats.get('count', 0) > 0:
                    report.append(
                        f"| {runtime.capitalize():11} | "
                        f"{stats['count']:5} | "
                        f"{stats['avg_duration']:8.2f} | "
                        f"{stats['min_duration']:8.2f} | "
                        f"{stats['max_duration']:8.2f} | "
                        f"{stats['p50_duration']:8.2f} | "
                        f"{stats['p95_duration']:8.2f} | "
                        f"{stats['p99_duration']:8.2f} | "
                        f"{stats['avg_memory']:15.2f} |"
                    )

        report.append("")
        report.append("### Key Findings (Cold Start)")
        report.append("")

        # Find fastest and slowest
        runtime_stats = {}
        for runtime in cold_starts:
            stats = calculate_cold_start_stats(cold_starts[runtime])
            if stats.get('count', 0) > 0:
                runtime_stats[runtime] = stats

        if runtime_stats:
            fastest = min(runtime_stats.items(), key=lambda x: x[1]['avg_duration'])
            slowest = max(runtime_stats.items(), key=lambda x: x[1]['avg_duration'])

            report.append(f"- **Fastest:** {fastest[0].capitalize()} ({fastest[1]['avg_duration']:.2f}ms avg)")
            report.append(f"- **Slowest:** {slowest[0].capitalize()} ({slowest[1]['avg_duration']:.2f}ms avg)")
            report.append(f"- **Difference:** {slowest[1]['avg_duration'] - fastest[1]['avg_duration']:.2f}ms "
                         f"({(slowest[1]['avg_duration'] / fastest[1]['avg_duration'] - 1) * 100:.1f}% slower)")

    else:
        report.append("*No cold start data available*")

    report.append("")
    report.append("---")
    report.append("")

    # Load Test Comparison
    report.append("## Load Test Performance")
    report.append("")

    if load_tests:
        report.append("### Request Duration")
        report.append("")
        report.append("| Runtime | Avg (ms) | Min (ms) | Max (ms) | P50 (ms) | P95 (ms) | P99 (ms) |")
        report.append("|---------|----------|----------|----------|----------|----------|----------|")

        for runtime in ['python', 'typescript', 'go', 'kotlin']:
            if runtime in load_tests:
                metrics = extract_load_test_metrics(load_tests[runtime])
                if 'request_duration' in metrics:
                    rd = metrics['request_duration']
                    report.append(
                        f"| {runtime.capitalize():11} | "
                        f"{rd['avg']:8.2f} | "
                        f"{rd['min']:8.2f} | "
                        f"{rd['max']:8.2f} | "
                        f"{rd['p50']:8.2f} | "
                        f"{rd['p95']:8.2f} | "
                        f"{rd['p99']:8.2f} |"
                    )

        report.append("")
        report.append("### Throughput & Error Rates")
        report.append("")
        report.append("| Runtime | Req/sec | Total Requests | Error Rate (%) | Failed Req (%) |")
        report.append("|---------|---------|----------------|----------------|----------------|")

        for runtime in ['python', 'typescript', 'go', 'kotlin']:
            if runtime in load_tests:
                metrics = extract_load_test_metrics(load_tests[runtime])
                report.append(
                    f"| {runtime.capitalize():11} | "
                    f"{metrics.get('requests_per_second', 0):7.2f} | "
                    f"{metrics.get('total_requests', 0):14.0f} | "
                    f"{metrics.get('error_rate', 0):14.2f} | "
                    f"{metrics.get('failed_request_rate', 0):14.2f} |"
                )

        report.append("")
        report.append("### Key Findings (Load Test)")
        report.append("")

        # Find best performers
        runtime_metrics = {}
        for runtime in load_tests:
            runtime_metrics[runtime] = extract_load_test_metrics(load_tests[runtime])

        if runtime_metrics:
            # Lowest average latency
            if all('request_duration' in m for m in runtime_metrics.values()):
                fastest = min(runtime_metrics.items(), key=lambda x: x[1]['request_duration']['avg'])
                slowest = max(runtime_metrics.items(), key=lambda x: x[1]['request_duration']['avg'])

                report.append(f"- **Lowest Latency:** {fastest[0].capitalize()} "
                             f"({fastest[1]['request_duration']['avg']:.2f}ms avg)")
                report.append(f"- **Highest Latency:** {slowest[0].capitalize()} "
                             f"({slowest[1]['request_duration']['avg']:.2f}ms avg)")

            # Highest throughput
            if all('requests_per_second' in m for m in runtime_metrics.values()):
                highest_rps = max(runtime_metrics.items(), key=lambda x: x[1].get('requests_per_second', 0))
                report.append(f"- **Highest Throughput:** {highest_rps[0].capitalize()} "
                             f"({highest_rps[1]['requests_per_second']:.2f} req/sec)")

            # Lowest error rate
            if all('error_rate' in m for m in runtime_metrics.values()):
                lowest_errors = min(runtime_metrics.items(), key=lambda x: x[1].get('error_rate', 100))
                report.append(f"- **Lowest Error Rate:** {lowest_errors[0].capitalize()} "
                             f"({lowest_errors[1]['error_rate']:.2f}%)")

    else:
        report.append("*No load test data available*")

    report.append("")
    report.append("---")
    report.append("")

    # Recommendations
    report.append("## Recommendations")
    report.append("")
    report.append("### Best Use Cases")
    report.append("")
    report.append("- **Go:** Best for latency-sensitive applications and cold start performance")
    report.append("- **Python:** Good balance of performance and developer productivity")
    report.append("- **TypeScript:** Familiar for JavaScript developers, moderate performance")
    report.append("- **Kotlin:** JVM warmup overhead, better for long-running processes")
    report.append("")

    report.append("### Performance Optimization")
    report.append("")
    report.append("1. **Cold Starts:** Consider provisioned concurrency for critical endpoints")
    report.append("2. **Memory:** Adjust Lambda memory based on actual usage patterns")
    report.append("3. **Caching:** Implement response caching at API Gateway level")
    report.append("4. **Connection Pooling:** Reuse DynamoDB connections across invocations")
    report.append("")

    return "\n".join(report)


def main():
    if len(sys.argv) < 2:
        print("Usage: python compare-results.py <results_directory>")
        sys.exit(1)

    results_dir = Path(sys.argv[1])

    if not results_dir.exists():
        print(f"Error: Results directory not found: {results_dir}")
        sys.exit(1)

    print("Loading benchmark results...")

    # Load data
    cold_starts = load_cold_start_data(results_dir)
    load_tests = load_load_test_data(results_dir)

    print(f"  Cold start data: {len(cold_starts)} runtimes")
    print(f"  Load test data: {len(load_tests)} runtimes")

    # Generate report
    print("Generating comparison report...")
    report = generate_markdown_report(results_dir, cold_starts, load_tests)

    # Save report
    output_file = results_dir / "comparison-report.md"
    with open(output_file, 'w') as f:
        f.write(report)

    print(f"✓ Report saved to: {output_file}")

    # Also output to console
    print("\n" + "=" * 80)
    print(report)
    print("=" * 80)


if __name__ == "__main__":
    main()
