import os
import time
import json
from typing import Dict, Any
from aws_lambda_powertools import Logger

logger = Logger()


class MetricsCollector:
    """Collect and report runtime metrics"""

    def __init__(self):
        self.runtime_name = os.environ.get('RUNTIME_NAME', 'python')
        self.start_time = time.time()
        self.cold_start = self._detect_cold_start()

    @staticmethod
    def _detect_cold_start() -> bool:
        """Detect if this is a cold start"""
        # Simple detection: check if global variable exists
        # In production, use Lambda Powertools or custom logic
        global _warm_start
        try:
            _warm_start
            return False
        except NameError:
            _warm_start = True
            return True

    def get_metrics(self) -> Dict[str, Any]:
        """Get current runtime metrics"""
        import psutil
        import sys

        process = psutil.Process()
        memory_info = process.memory_info()

        metrics = {
            'runtime': self.runtime_name,
            'cold_start': self.cold_start,
            'uptime_seconds': time.time() - self.start_time,
            'memory': {
                'rss_mb': memory_info.rss / 1024 / 1024,  # Resident Set Size
                'vms_mb': memory_info.vms / 1024 / 1024,  # Virtual Memory Size
            },
            'python_version': sys.version,
            'environment': os.environ.get('ENVIRONMENT', 'dev'),
        }

        # Add Lambda-specific context if available
        if 'AWS_LAMBDA_FUNCTION_NAME' in os.environ:
            metrics['lambda'] = {
                'function_name': os.environ.get('AWS_LAMBDA_FUNCTION_NAME'),
                'function_version': os.environ.get('AWS_LAMBDA_FUNCTION_VERSION'),
                'memory_limit_mb': os.environ.get('AWS_LAMBDA_FUNCTION_MEMORY_SIZE'),
                'log_group': os.environ.get('AWS_LAMBDA_LOG_GROUP_NAME'),
                'log_stream': os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME'),
            }

        logger.info(f"Collected metrics: {json.dumps(metrics, default=str)}")
        return metrics
