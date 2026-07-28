# DeepWiki Tests

This directory contains the main DeepWiki test suite, organized by type and scope. The repository also has a legacy `test/` directory with focused regression tests.

## Directory Structure

```
tests/
|-- unit/                 # Unit tests - test individual components in isolation
|   |-- test_google_embedder.py
|   `-- test_all_embedders.py
|-- integration/          # Integration tests - test component interactions
|   `-- test_full_integration.py
|-- api/                  # API tests - test HTTP endpoints
|   `-- test_api.py
`-- run_tests.py          # Category-based test runner script

test/
`-- test_extract_repo_name.py  # Legacy focused regression tests
```

## Running Tests

### Pytest Discovery

`pytest.ini` is configured to discover tests from both `tests/` and the legacy `test/` directory.

```bash
python -m pytest
```

If you are using the Poetry environment from `api/pyproject.toml` without activating it, run pytest from the repository root with explicit paths:

```bash
poetry -C api run python -m pytest ../tests ../test
```

### Main Test Suite

```bash
python -m pytest tests
```

### Legacy Focused Tests

```bash
python -m pytest test
```

### Category-Based Test Runner

```bash
python tests/run_tests.py
```

#### Unit Tests Only

```bash
python tests/run_tests.py --unit
```

#### Integration Tests Only

```bash
python tests/run_tests.py --integration
```

#### API Tests Only

```bash
python tests/run_tests.py --api
```

### Individual Test Files

```bash
# Unit tests
python -m pytest tests/unit/test_google_embedder.py
python -m pytest tests/unit/test_all_embedders.py

# Integration tests
python -m pytest tests/integration/test_full_integration.py

# API tests
python -m pytest tests/api/test_api.py

# Legacy focused tests
python -m pytest test/test_extract_repo_name.py
```

## Test Requirements

### Environment Variables

- `GOOGLE_API_KEY`: Required for Google AI embedder tests
- `OPENAI_API_KEY`: Required for some integration tests
- `DEEPWIKI_EMBEDDER_TYPE`: Set to `google` for Google embedder tests

### Dependencies

Install the Python dependencies from the project root:

```bash
python -m pip install poetry==2.0.1
poetry install -C api
```

The test dependencies are declared in `api/pyproject.toml`.

## Test Categories

### Unit Tests

- Purpose: Test individual components in isolation
- Speed: Fast
- Dependencies: Minimal external dependencies
- Examples: Embedder response parsing and configuration loading

### Integration Tests

- Purpose: Test how components work together
- Speed: Medium
- Dependencies: May require API keys and external services
- Examples: End-to-end embedding pipeline and RAG workflow

### API Tests

- Purpose: Test HTTP endpoints and WebSocket connections
- Speed: Medium-slow
- Dependencies: Requires a running API server
- Examples: Chat completion endpoints and streaming responses

## Adding New Tests

1. Choose the right category: unit, integration, API, or focused regression.
2. Place main suite tests under `tests/` and legacy focused regression tests under `test/` only when matching existing coverage.
3. Follow the naming convention: `test_<component_name>.py`.
4. Add the project root to `sys.path` when needed.
5. Add docstrings or clear test names explaining what the test covers.
6. Update this README when adding new test files or commands.

## Troubleshooting

### Import Errors

If you get import errors, ensure the test file includes the project root path setup:

```python
from pathlib import Path
import sys

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
```

For tests directly under `test/`, adjust the parent traversal accordingly.

### API Key Issues

Make sure you have a `.env` file in the project root with the required API keys:

```bash
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DEEPWIKI_EMBEDDER_TYPE=google
```

### Server Dependencies

For API tests, ensure the FastAPI server is running on the expected port:

```bash
python -m api.main
```
