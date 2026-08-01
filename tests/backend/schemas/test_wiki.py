import pytest

from api.schemas import (
    WikiCacheData,
    WikiPage,
    WikiStructureModel,
    aload,
    asave,
)


@pytest.mark.asyncio
async def test_wiki_cache_async_save(tmp_path) -> None:
    cache = WikiCacheData(
        wiki_structure=WikiStructureModel(
            id="test", title="test", description="test", pages=[]
        ),
        generated_pages={
            "test": WikiPage(
                id="test",
                title="test",
                content="test",
                filePaths=[],
                importance="high",
                relatedPages=[],
            )
        },
    )

    path = tmp_path / "test.wiki"
    await asave(cache, path.as_posix(), encoding="utf-8")
    assert path.exists()


@pytest.mark.asyncio
async def test_wiki_cache_async_load(tmp_path) -> None:
    cache = WikiCacheData(
        wiki_structure=WikiStructureModel(
            id="test", title="test", description="test", pages=[]
        ),
        generated_pages={
            "test": WikiPage(
                id="test",
                title="test",
                content="test",
                filePaths=[],
                importance="high",
                relatedPages=[],
            )
        },
    )

    path = tmp_path / "test.wiki"
    await asave(cache, path.as_posix(), encoding="utf-8")
    ret = await aload(WikiCacheData, path.as_posix(), encoding="utf-8")

    assert ret == cache
