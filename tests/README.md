# DeepWiki Tests

This directory contains all tests for the DeepWiki project, organized by type and scope.

## Directory Structure

```
tests/
├── unit/                 # Unit tests - test individual components in isolation
│   ├── test_google_embedder.py          # Tests for Google AI embedder client
│   └── test_google_embedder_fix.py      # Tests for embedding response parsing fix
├── integration/          # Integration tests - test component interactions
│   └── test_full_integration.py         # Full pipeline integration test
├── api/                  # API tests - test HTTP endpoints
│   └── test_api.py                      # API endpoint tests
└── run_tests.py         # Test runner script
```

## Running Tests

### All Tests
```bash
python tests/run_tests.py
```

### Unit Tests Only
```bash
python tests/run_tests.py --unit
```

### Integration Tests Only
```bash
python tests/run_tests.py --integration
```

### API Tests Only
```bash
python tests/run_tests.py --api
```

### Individual Test Files
```bash
# Unit tests
python tests/unit/test_google_embedder.py
python tests/unit/test_google_embedder_fix.py

# Integration tests
python tests/integration/test_full_integration.py

# API tests
python tests/api/test_api.py
```

## Test Requirements

### Environment Variables
- `GOOGLE_API_KEY`: Required for Google AI embedder tests
- `OPENAI_API_KEY`: Required for some integration tests
- `DEEPWIKI_EMBEDDER_TYPE`: Set to 'google' for Google embedder tests

### Dependencies
All test dependencies are included in the main project requirements:
- `python-dotenv`: For loading environment variables
- `adalflow`: Core framework for embeddings
- `google-generativeai`: Google AI API client
- `requests`: For API testing

## Test Categories

### Unit Tests
- **Purpose**: Test individual components in isolation
- **Speed**: Fast (< 1 second per test)
- **Dependencies**: Minimal external dependencies
- **Examples**: Testing embedder response parsing, configuration loading

### Integration Tests  
- **Purpose**: Test how components work together
- **Speed**: Medium (1-10 seconds per test)
- **Dependencies**: May require API keys and external services
- **Examples**: End-to-end embedding pipeline, RAG workflow

### API Tests
- **Purpose**: Test HTTP endpoints and WebSocket connections
- **Speed**: Medium-slow (5-30 seconds per test)
- **Dependencies**: Requires running API server
- **Examples**: Chat completion endpoints, streaming responses

## Adding New Tests

1. **Choose the right category**: Determine if your test is unit, integration, or API
2. **Create the test file**: Place it in the appropriate subdirectory
3. **Follow naming convention**: `test_<component_name>.py`
4. **Add proper imports**: Use the project root path setup pattern
5. **Document the test**: Add docstrings explaining what the test does
6. **Update this README**: Add your test to the appropriate section

## Troubleshooting

### Import Errors
If you get import errors, ensure the test file includes the project root path setup:

```python
from pathlib import Path
import sys

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
```

### API Key Issues
Make sure you have a `.env` file in the project root with the required API keys:

```
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DEEPWIKI_EMBEDDER_TYPE=google
```

### Server Dependencies
For API tests, ensure the FastAPI server is running on the expected port:

```bash
cd api
python main.py
```