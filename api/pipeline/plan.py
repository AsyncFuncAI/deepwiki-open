"""Wiki structure planning for DeepWiki Single Provider."""

import logging
import json
from typing import List, Dict
from pathlib import Path

logger = logging.getLogger(__name__)


class WikiPlanner:
    """Lightweight wiki structure planner.

    CONSTRAINTS:
    - Does NOT generate documentation content
    - Does NOT summarize code
    - Does NOT explore autonomously
    - ONLY analyzes repo structure and creates page layout
    """

    def __init__(self, llm_client):
        """Initialize planner.

        Args:
            llm_client: GPTOSSClient instance
        """
        self.llm = llm_client

    def plan_wiki_structure(
        self,
        files: List[Dict[str, str]],
        repo_name: str,
    ) -> List[Dict[str, any]]:
        """Plan wiki page structure based on repository contents.

        Args:
            files: List of {path, content} from ingestion
            repo_name: Repository name

        Returns:
            List of page plans with {page, files, description}
        """
        logger.info(f"Planning wiki structure for {repo_name}")

        # Analyze repository structure
        file_paths = [f['path'] for f in files]
        structure = self._analyze_structure(file_paths)

        # Generate plan using LLM
        plan = self._generate_plan(structure, repo_name)

        logger.info(f"Generated plan with {len(plan)} pages")
        return plan

    def _analyze_structure(self, file_paths: List[str]) -> Dict[str, any]:
        """Analyze repository structure from file paths.

        Args:
            file_paths: List of relative file paths

        Returns:
            Structure dictionary
        """
        structure = {
            'directories': set(),
            'by_extension': {},
            'readme_files': [],
            'config_files': [],
            'source_dirs': set(),
        }

        for path in file_paths:
            p = Path(path)

            # Track directories
            if p.parent != Path('.'):
                structure['directories'].add(str(p.parent))

            # Track by extension
            ext = p.suffix or 'no_extension'
            if ext not in structure['by_extension']:
                structure['by_extension'][ext] = []
            structure['by_extension'][ext].append(path)

            # Identify special files
            name_lower = p.name.lower()
            if 'readme' in name_lower:
                structure['readme_files'].append(path)
            elif name_lower in ('config.py', 'settings.py', 'setup.py', 'package.json'):
                structure['config_files'].append(path)

            # Identify source directories
            parts = str(p).split('/')
            if any(part in ('src', 'lib', 'api', 'core') for part in parts):
                structure['source_dirs'].add(parts[0] if parts else '')

        # Convert sets to lists for JSON serialization
        structure['directories'] = sorted(list(structure['directories']))
        structure['source_dirs'] = sorted(list(structure['source_dirs']))

        return structure

    def _generate_plan(
        self,
        structure: Dict[str, any],
        repo_name: str,
    ) -> List[Dict[str, any]]:
        """Use LLM to generate wiki page structure.

        Args:
            structure: Repository structure analysis
            repo_name: Repository name

        Returns:
            List of page plans
        """
        system_prompt = """You are a documentation planner for GitHub wikis.

Your task is to analyze a repository structure and create a wiki page layout.

CRITICAL CONSTRAINTS:
- DO NOT write documentation content
- DO NOT summarize code
- ONLY decide wiki structure and page organization

Output format: JSON list of pages
[
  {
    "page": "Home",
    "files": ["README.md", "docs/*.md"],
    "description": "Overview and getting started"
  },
  {
    "page": "Architecture",
    "files": ["src/core/*.py", "src/api/*.py"],
    "description": "System architecture and design"
  },
  {
    "page": "API Reference",
    "files": ["src/api/**/*.py"],
    "description": "API endpoints and interfaces"
  }
]

Guidelines:
- Create 3-7 pages typically
- Prioritize: README, Architecture, API, Configuration
- Group related files together
- Use glob patterns (*, **) for file matching
"""

        user_prompt = f"""Repository: {repo_name}

Structure analysis:
- Directories: {', '.join(structure['directories'][:20])}
- File types: {', '.join(structure['by_extension'].keys())}
- README files: {', '.join(structure['readme_files'])}
- Source dirs: {', '.join(structure['source_dirs'])}

Create a wiki page structure. Return ONLY valid JSON, no markdown formatting."""

        try:
            response = self.llm.chat_with_system(
                system=system_prompt,
                user=user_prompt,
                temperature=0.3,
                max_tokens=2000,
            )

            # Parse JSON response
            # Remove markdown code blocks if present
            response = response.strip()
            if response.startswith('```'):
                lines = response.split('\n')
                response = '\n'.join(lines[1:-1])

            plan = json.loads(response)

            # Validate plan structure
            if not isinstance(plan, list):
                raise ValueError("Plan must be a list")

            for page in plan:
                if not all(k in page for k in ('page', 'files', 'description')):
                    raise ValueError(f"Invalid page structure: {page}")

            return plan

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Response was: {response[:500]}")
            # Return fallback plan
            return self._fallback_plan(structure, repo_name)

        except Exception as e:
            logger.error(f"Plan generation failed: {e}")
            return self._fallback_plan(structure, repo_name)

    def _fallback_plan(
        self,
        structure: Dict[str, any],
        repo_name: str,
    ) -> List[Dict[str, any]]:
        """Generate fallback plan without LLM.

        Args:
            structure: Repository structure
            repo_name: Repository name

        Returns:
            Basic page plan
        """
        logger.warning("Using fallback plan")

        plan = [
            {
                'page': 'Home',
                'files': structure['readme_files'] if structure['readme_files'] else ['README.md'],
                'description': 'Project overview and getting started',
            },
            {
                'page': 'Architecture',
                'files': ['**/*.py', '**/*.js', '**/*.java'],
                'description': 'System architecture and design',
            },
            {
                'page': 'API Reference',
                'files': ['**/api/**/*', '**/routes/**/*'],
                'description': 'API endpoints and interfaces',
            },
        ]

        return plan
