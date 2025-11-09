#!/usr/bin/env python3

"""
Visualize benchmark results with charts and graphs.
Requires: matplotlib, numpy
Install: pip install matplotlib numpy
"""

import json
import sys
import csv
from pathlib import Path
from typing import Dict, List
from collections import defaultdict

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import numpy as np
except ImportError:
    print("Error: matplotlib is required")
    print("Install with: pip install matplotlib numpy")
    sys.exit(1)


# Color scheme for each runtime
RUNTIME_COLORS = {
    'python': '#3776ab',      # Python blue
    'typescript': '#3178c6',  # TypeScript blue
    'go': '#00add8',          # Go cyan
    'kotlin': '#7f52ff'       # Kotlin purple
}


def load_cold_start_data(results_dir: Path) -> Dict[str, List[Dict]]:
    """Load cold start measurements from CSV."""
    cold_start_file = results_dir / "cold-starts.csv"

    if not cold_start_file.exists():
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
                'memory_used_mb': float(row['memory_used_mb'])
            })

    return dict(data)


def load_load_test_data(results_dir: Path) -> Dict[str, Dict]:
    """Load k6 load test results from JSON."""
    data = {}

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        load_test_file = results_dir / f"load-test-{runtime}.json"

        if not load_test_file.exists():
            continue

        with open(load_test_file, 'r') as f:
            data[runtime] = json.load(f)

    return data


def plot_cold_start_comparison(cold_starts: Dict, output_file: Path):
    """Create bar chart comparing cold start times."""
    runtimes = []
    avg_durations = []
    p95_durations = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime not in cold_starts:
            continue

        cold_start_data = [d for d in cold_starts[runtime] if d['cold_start']]

        if not cold_start_data:
            continue

        durations = [cs['duration_ms'] for cs in cold_start_data]
        runtimes.append(runtime.capitalize())
        avg_durations.append(np.mean(durations))
        p95_durations.append(np.percentile(durations, 95))
        colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if not runtimes:
        print("No cold start data to plot")
        return

    fig, ax = plt.subplots(figsize=(10, 6))

    x = np.arange(len(runtimes))
    width = 0.35

    bars1 = ax.bar(x - width/2, avg_durations, width, label='Average', color=colors, alpha=0.8)
    bars2 = ax.bar(x + width/2, p95_durations, width, label='P95', color=colors, alpha=0.5)

    ax.set_xlabel('Runtime', fontsize=12, fontweight='bold')
    ax.set_ylabel('Duration (ms)', fontsize=12, fontweight='bold')
    ax.set_title('Cold Start Performance Comparison', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(runtimes)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)

    # Add value labels on bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.0f}',
                   ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"✓ Cold start comparison saved to: {output_file}")


def plot_latency_percentiles(load_tests: Dict, output_file: Path):
    """Create line chart showing latency percentiles."""
    fig, ax = plt.subplots(figsize=(12, 6))

    percentiles = ['p(50)', 'p(90)', 'p(95)', 'p(99)']
    percentile_labels = ['P50', 'P90', 'P95', 'P99']

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime not in load_tests:
            continue

        metrics = load_tests[runtime].get('metrics', {})
        if 'http_req_duration' not in metrics:
            continue

        values = metrics['http_req_duration']['values']
        latencies = [values.get(p, 0) for p in percentiles]

        ax.plot(percentile_labels, latencies,
               marker='o', linewidth=2, markersize=8,
               label=runtime.capitalize(),
               color=RUNTIME_COLORS.get(runtime, '#888888'))

    ax.set_xlabel('Percentile', fontsize=12, fontweight='bold')
    ax.set_ylabel('Latency (ms)', fontsize=12, fontweight='bold')
    ax.set_title('Request Latency Percentiles', fontsize=14, fontweight='bold')
    ax.legend(loc='upper left')
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"✓ Latency percentiles saved to: {output_file}")


def plot_throughput_comparison(load_tests: Dict, output_file: Path):
    """Create bar chart comparing throughput."""
    runtimes = []
    requests_per_sec = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime not in load_tests:
            continue

        metrics = load_tests[runtime].get('metrics', {})
        if 'http_reqs' not in metrics:
            continue

        rps = metrics['http_reqs']['values'].get('rate', 0)
        runtimes.append(runtime.capitalize())
        requests_per_sec.append(rps)
        colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if not runtimes:
        print("No throughput data to plot")
        return

    fig, ax = plt.subplots(figsize=(10, 6))

    bars = ax.bar(runtimes, requests_per_sec, color=colors, alpha=0.8)

    ax.set_xlabel('Runtime', fontsize=12, fontweight='bold')
    ax.set_ylabel('Requests per Second', fontsize=12, fontweight='bold')
    ax.set_title('Throughput Comparison', fontsize=14, fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
               f'{height:.1f}',
               ha='center', va='bottom', fontsize=10)

    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"✓ Throughput comparison saved to: {output_file}")


def plot_error_rates(load_tests: Dict, output_file: Path):
    """Create bar chart comparing error rates."""
    runtimes = []
    error_rates = []
    failed_rates = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime not in load_tests:
            continue

        metrics = load_tests[runtime].get('metrics', {})

        error_rate = 0
        failed_rate = 0

        if 'errors' in metrics:
            error_rate = metrics['errors']['values'].get('rate', 0) * 100

        if 'http_req_failed' in metrics:
            failed_rate = metrics['http_req_failed']['values'].get('rate', 0) * 100

        runtimes.append(runtime.capitalize())
        error_rates.append(error_rate)
        failed_rates.append(failed_rate)
        colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if not runtimes:
        print("No error rate data to plot")
        return

    fig, ax = plt.subplots(figsize=(10, 6))

    x = np.arange(len(runtimes))
    width = 0.35

    ax.bar(x - width/2, error_rates, width, label='Error Rate', color=colors, alpha=0.8)
    ax.bar(x + width/2, failed_rates, width, label='Failed Requests', color=colors, alpha=0.5)

    ax.set_xlabel('Runtime', fontsize=12, fontweight='bold')
    ax.set_ylabel('Rate (%)', fontsize=12, fontweight='bold')
    ax.set_title('Error Rates Comparison', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(runtimes)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"✓ Error rates saved to: {output_file}")


def plot_memory_usage(cold_starts: Dict, output_file: Path):
    """Create bar chart comparing memory usage during cold starts."""
    runtimes = []
    avg_memory = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime not in cold_starts:
            continue

        cold_start_data = [d for d in cold_starts[runtime] if d['cold_start'] and d['memory_used_mb'] > 0]

        if not cold_start_data:
            continue

        memories = [cs['memory_used_mb'] for cs in cold_start_data]
        runtimes.append(runtime.capitalize())
        avg_memory.append(np.mean(memories))
        colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if not runtimes:
        print("No memory usage data to plot")
        return

    fig, ax = plt.subplots(figsize=(10, 6))

    bars = ax.bar(runtimes, avg_memory, color=colors, alpha=0.8)

    ax.set_xlabel('Runtime', fontsize=12, fontweight='bold')
    ax.set_ylabel('Memory (MB)', fontsize=12, fontweight='bold')
    ax.set_title('Average Memory Usage (Cold Start)', fontsize=14, fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
               f'{height:.1f}',
               ha='center', va='bottom', fontsize=10)

    plt.tight_layout()
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"✓ Memory usage saved to: {output_file}")


def create_summary_dashboard(cold_starts: Dict, load_tests: Dict, output_file: Path):
    """Create a comprehensive dashboard with multiple charts."""
    fig = plt.figure(figsize=(16, 10))
    gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)

    # 1. Cold Start Comparison
    ax1 = fig.add_subplot(gs[0, 0])
    runtimes = []
    avg_durations = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime in cold_starts:
            cold_start_data = [d for d in cold_starts[runtime] if d['cold_start']]
            if cold_start_data:
                durations = [cs['duration_ms'] for cs in cold_start_data]
                runtimes.append(runtime.capitalize())
                avg_durations.append(np.mean(durations))
                colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if runtimes:
        ax1.bar(runtimes, avg_durations, color=colors, alpha=0.8)
        ax1.set_title('Cold Start (Avg)', fontweight='bold')
        ax1.set_ylabel('Duration (ms)')
        ax1.grid(axis='y', alpha=0.3)

    # 2. Latency P95
    ax2 = fig.add_subplot(gs[0, 1])
    runtimes = []
    p95_latencies = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime in load_tests:
            metrics = load_tests[runtime].get('metrics', {})
            if 'http_req_duration' in metrics:
                p95 = metrics['http_req_duration']['values'].get('p(95)', 0)
                runtimes.append(runtime.capitalize())
                p95_latencies.append(p95)
                colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if runtimes:
        ax2.bar(runtimes, p95_latencies, color=colors, alpha=0.8)
        ax2.set_title('P95 Latency', fontweight='bold')
        ax2.set_ylabel('Latency (ms)')
        ax2.grid(axis='y', alpha=0.3)

    # 3. Throughput
    ax3 = fig.add_subplot(gs[1, 0])
    runtimes = []
    requests_per_sec = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime in load_tests:
            metrics = load_tests[runtime].get('metrics', {})
            if 'http_reqs' in metrics:
                rps = metrics['http_reqs']['values'].get('rate', 0)
                runtimes.append(runtime.capitalize())
                requests_per_sec.append(rps)
                colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if runtimes:
        ax3.bar(runtimes, requests_per_sec, color=colors, alpha=0.8)
        ax3.set_title('Throughput', fontweight='bold')
        ax3.set_ylabel('Requests/sec')
        ax3.grid(axis='y', alpha=0.3)

    # 4. Error Rates
    ax4 = fig.add_subplot(gs[1, 1])
    runtimes = []
    error_rates = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime in load_tests:
            metrics = load_tests[runtime].get('metrics', {})
            if 'errors' in metrics:
                error_rate = metrics['errors']['values'].get('rate', 0) * 100
                runtimes.append(runtime.capitalize())
                error_rates.append(error_rate)
                colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if runtimes:
        ax4.bar(runtimes, error_rates, color=colors, alpha=0.8)
        ax4.set_title('Error Rate', fontweight='bold')
        ax4.set_ylabel('Rate (%)')
        ax4.grid(axis='y', alpha=0.3)

    # 5. Memory Usage
    ax5 = fig.add_subplot(gs[2, 0])
    runtimes = []
    avg_memory = []
    colors = []

    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime in cold_starts:
            cold_start_data = [d for d in cold_starts[runtime] if d['cold_start'] and d['memory_used_mb'] > 0]
            if cold_start_data:
                memories = [cs['memory_used_mb'] for cs in cold_start_data]
                runtimes.append(runtime.capitalize())
                avg_memory.append(np.mean(memories))
                colors.append(RUNTIME_COLORS.get(runtime, '#888888'))

    if runtimes:
        ax5.bar(runtimes, avg_memory, color=colors, alpha=0.8)
        ax5.set_title('Memory Usage (Cold Start)', fontweight='bold')
        ax5.set_ylabel('Memory (MB)')
        ax5.grid(axis='y', alpha=0.3)

    # 6. Latency Distribution
    ax6 = fig.add_subplot(gs[2, 1])
    for runtime in ['python', 'typescript', 'go', 'kotlin']:
        if runtime in load_tests:
            metrics = load_tests[runtime].get('metrics', {})
            if 'http_req_duration' in metrics:
                values = metrics['http_req_duration']['values']
                percentiles = ['p(50)', 'p(95)', 'p(99)']
                latencies = [values.get(p, 0) for p in percentiles]
                ax6.plot(['P50', 'P95', 'P99'], latencies,
                        marker='o', label=runtime.capitalize(),
                        color=RUNTIME_COLORS.get(runtime, '#888888'))

    ax6.set_title('Latency Percentiles', fontweight='bold')
    ax6.set_ylabel('Latency (ms)')
    ax6.legend(loc='upper left', fontsize=8)
    ax6.grid(True, alpha=0.3)

    fig.suptitle('Multi-Runtime API Benchmark - Summary Dashboard',
                fontsize=16, fontweight='bold')

    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"✓ Summary dashboard saved to: {output_file}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python visualize-results.py <results_directory>")
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

    print("\nGenerating visualizations...")

    # Create individual charts
    if cold_starts:
        plot_cold_start_comparison(cold_starts, results_dir / "chart-cold-start.png")
        plot_memory_usage(cold_starts, results_dir / "chart-memory.png")

    if load_tests:
        plot_latency_percentiles(load_tests, results_dir / "chart-latency.png")
        plot_throughput_comparison(load_tests, results_dir / "chart-throughput.png")
        plot_error_rates(load_tests, results_dir / "chart-errors.png")

    # Create summary dashboard
    if cold_starts or load_tests:
        create_summary_dashboard(cold_starts, load_tests, results_dir / "dashboard.png")

    print("\n✓ All visualizations generated successfully!")


if __name__ == "__main__":
    main()
