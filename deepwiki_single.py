#!/usr/bin/env python3
"""DeepWiki Single Provider - Simplified Wiki Generator.

This is the main entry point for the single-provider DeepWiki architecture.
Uses ONLY gpt-oss-130b + BGE-M3 for wiki generation.
"""

import argparse
import logging
import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from api.llm.gpt_oss_client import GPTOSSClient
from api.embedding.bge_m3_client import BGEM3Client
from api.pipeline.ingest import RepositoryIngester
from api.pipeline.chunk import TextChunker
from api.pipeline.plan import WikiPlanner
from api.pipeline.generate import PageGenerator
from api.wiki.writer import WikiWriter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
)
logger = logging.getLogger(__name__)


def main():
    """Main entry point for DeepWiki Single Provider."""
    parser = argparse.ArgumentParser(
        description='DeepWiki Single Provider - Generate GitHub Wiki from repository'
    )
    parser.add_argument(
        '--repo',
        required=True,
        help='GitHub repository URL'
    )
    parser.add_argument(
        '--output',
        default='./wiki_output',
        help='Output directory for wiki files'
    )
    parser.add_argument(
        '--token',
        help='GitHub access token for private repos'
    )
    parser.add_argument(
        '--workspace',
        default='./workspace',
        help='Workspace directory for cloning repos'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Dry run mode - don\'t write files'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging'
    )

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("=" * 60)
    logger.info("DeepWiki Single Provider")
    logger.info("=" * 60)
    logger.info(f"Repository: {args.repo}")
    logger.info(f"Output: {args.output}")
    logger.info(f"Dry Run: {args.dry_run}")

    try:
        # Initialize clients
        logger.info("\n[1/7] Initializing clients...")
        llm = GPTOSSClient()
        embedder = BGEM3Client()
        logger.info("✓ Clients initialized")

        # Ingest repository
        logger.info("\n[2/7] Ingesting repository...")
        ingester = RepositoryIngester(workspace_dir=args.workspace)
        repo_path = ingester.clone_repo(args.repo, access_token=args.token)
        files = ingester.load_files(repo_path)
        logger.info(f"✓ Loaded {len(files)} files")

        # Chunk files
        logger.info("\n[3/7] Chunking files...")
        chunker = TextChunker(chunk_size=500, overlap=100)
        chunks = chunker.chunk_files(files)
        logger.info(f"✓ Created {len(chunks)} chunks")

        # Plan wiki structure
        logger.info("\n[4/7] Planning wiki structure...")
        planner = WikiPlanner(llm_client=llm)
        repo_name = args.repo.rstrip('/').split('/')[-1].replace('.git', '')
        page_plans = planner.plan_wiki_structure(files=files, repo_name=repo_name)
        logger.info(f"✓ Planned {len(page_plans)} pages")
        for plan in page_plans:
            logger.info(f"  - {plan['page']}: {plan['description']}")

        # Prepare embeddings
        logger.info("\n[5/7] Computing embeddings...")
        generator = PageGenerator(
            llm_client=llm,
            embedder_client=embedder,
            max_context_tokens=6000,
        )
        generator.prepare_embeddings(chunks)
        logger.info("✓ Embeddings computed")

        # Generate pages
        logger.info("\n[6/7] Generating wiki pages...")
        pages = []
        for i, plan in enumerate(page_plans, 1):
            logger.info(f"  [{i}/{len(page_plans)}] Generating {plan['page']}...")
            content = generator.generate_page(plan, files)
            pages.append({
                'name': plan['page'],
                'content': content,
            })
        logger.info("✓ All pages generated")

        # Write wiki
        logger.info("\n[7/7] Writing wiki files...")
        writer = WikiWriter(output_dir=args.output, dry_run=args.dry_run)
        writer.write_wiki(pages)
        logger.info("✓ Wiki written")

        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("SUCCESS")
        logger.info("=" * 60)
        logger.info(writer.get_wiki_summary())

        return 0

    except KeyboardInterrupt:
        logger.info("\n\nInterrupted by user")
        return 130

    except Exception as e:
        logger.error(f"\n\nFAILED: {e}", exc_info=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
