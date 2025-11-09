import pytest
import os
from unittest.mock import patch, Mock

from src.utils.metrics import MetricsCollector


@pytest.fixture
def metrics_collector():
    """Create a metrics collector instance"""
    with patch.dict(os.environ, {"RUNTIME_NAME": "python", "ENVIRONMENT": "test"}):
        collector = MetricsCollector()
        return collector


class TestMetricsCollector:
    """Test MetricsCollector"""

    def test_init(self, metrics_collector):
        """Test metrics collector initialization"""
        assert metrics_collector.runtime_name == "python"
        assert metrics_collector.start_time > 0
        assert isinstance(metrics_collector.cold_start, bool)

    def test_cold_start_detection_first_invocation(self):
        """Test cold start detection on first invocation"""
        # Reset global variable if it exists
        import src.utils.metrics as metrics_module

        if hasattr(metrics_module, "_warm_start"):
            delattr(metrics_module, "_warm_start")

        with patch.dict(os.environ, {"RUNTIME_NAME": "python"}):
            collector = MetricsCollector()
            assert collector.cold_start is True

    def test_warm_start_detection_second_invocation(self):
        """Test warm start detection on subsequent invocations"""
        with patch.dict(os.environ, {"RUNTIME_NAME": "python"}):
            # First collector - cold start
            collector1 = MetricsCollector()
            assert collector1.cold_start is True

            # Second collector - warm start
            collector2 = MetricsCollector()
            assert collector2.cold_start is False

    def test_get_metrics_structure(self, metrics_collector):
        """Test that get_metrics returns correct structure"""
        metrics = metrics_collector.get_metrics()

        assert isinstance(metrics, dict)
        assert "runtime" in metrics
        assert "cold_start" in metrics
        assert "uptime_seconds" in metrics
        assert "memory" in metrics
        assert "python_version" in metrics
        assert "environment" in metrics

    def test_get_metrics_runtime(self, metrics_collector):
        """Test runtime name in metrics"""
        metrics = metrics_collector.get_metrics()

        assert metrics["runtime"] == "python"

    def test_get_metrics_memory_structure(self, metrics_collector):
        """Test memory metrics structure"""
        metrics = metrics_collector.get_metrics()

        assert "memory" in metrics
        memory = metrics["memory"]
        assert "rss_mb" in memory
        assert "vms_mb" in memory
        assert isinstance(memory["rss_mb"], float)
        assert isinstance(memory["vms_mb"], float)
        assert memory["rss_mb"] > 0
        assert memory["vms_mb"] > 0

    def test_get_metrics_uptime(self, metrics_collector):
        """Test uptime calculation"""
        import time

        time.sleep(0.1)  # Wait 100ms
        metrics = metrics_collector.get_metrics()

        assert "uptime_seconds" in metrics
        assert metrics["uptime_seconds"] > 0
        assert metrics["uptime_seconds"] < 1  # Should be less than 1 second

    def test_get_metrics_python_version(self, metrics_collector):
        """Test Python version is included"""
        metrics = metrics_collector.get_metrics()

        assert "python_version" in metrics
        assert isinstance(metrics["python_version"], str)
        assert "python" in metrics["python_version"].lower() or "3." in metrics[
            "python_version"
        ]

    def test_get_metrics_environment(self, metrics_collector):
        """Test environment is included"""
        metrics = metrics_collector.get_metrics()

        assert "environment" in metrics
        assert metrics["environment"] == "test"

    @patch.dict(
        os.environ,
        {
            "AWS_LAMBDA_FUNCTION_NAME": "test-function",
            "AWS_LAMBDA_FUNCTION_VERSION": "$LATEST",
            "AWS_LAMBDA_FUNCTION_MEMORY_SIZE": "512",
            "AWS_LAMBDA_LOG_GROUP_NAME": "/aws/lambda/test-function",
            "AWS_LAMBDA_LOG_STREAM_NAME": "2024/01/01/[$LATEST]abc123",
        },
    )
    def test_get_metrics_lambda_context(self):
        """Test Lambda-specific context is included when available"""
        with patch.dict(
            os.environ, {"RUNTIME_NAME": "python", "ENVIRONMENT": "test"}
        ):
            collector = MetricsCollector()
            metrics = collector.get_metrics()

            assert "lambda" in metrics
            lambda_info = metrics["lambda"]
            assert lambda_info["function_name"] == "test-function"
            assert lambda_info["function_version"] == "$LATEST"
            assert lambda_info["memory_limit_mb"] == "512"
            assert lambda_info["log_group"] == "/aws/lambda/test-function"
            assert "abc123" in lambda_info["log_stream"]

    def test_get_metrics_no_lambda_context(self, metrics_collector):
        """Test metrics work without Lambda context"""
        metrics = metrics_collector.get_metrics()

        # Lambda context should not be present when not in Lambda
        assert "lambda" not in metrics or metrics["lambda"]["function_name"] is None

    def test_multiple_metrics_calls(self, metrics_collector):
        """Test that multiple metrics calls work correctly"""
        import time

        metrics1 = metrics_collector.get_metrics()
        time.sleep(0.1)
        metrics2 = metrics_collector.get_metrics()

        # Uptime should increase
        assert metrics2["uptime_seconds"] > metrics1["uptime_seconds"]

        # Runtime should stay the same
        assert metrics1["runtime"] == metrics2["runtime"]

        # Cold start should stay the same
        assert metrics1["cold_start"] == metrics2["cold_start"]

    def test_metrics_json_serializable(self, metrics_collector):
        """Test that metrics can be serialized to JSON"""
        import json

        metrics = metrics_collector.get_metrics()

        # Should not raise an exception
        json_str = json.dumps(metrics, default=str)
        assert isinstance(json_str, str)
        assert len(json_str) > 0

        # Should be able to parse back
        parsed = json.loads(json_str)
        assert "runtime" in parsed
        assert "memory" in parsed
