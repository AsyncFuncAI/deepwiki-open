from typing import TypeVar

import anyio
from pydantic import BaseModel

_M = TypeVar("_M", bound=BaseModel)


async def asave(model: BaseModel, path: str, *, encoding: str = "utf-8"):
    """Asynchronous serialize and save a model"""

    async with await anyio.open_file(path, mode="w", encoding=encoding) as file:
        await file.write(model.model_dump_json())


async def aload(model: type[_M], path: str, *, encoding: str = "utf-8") -> _M:
    """Asynchronous deserialize and load a model"""

    async with await anyio.open_file(path, mode="r", encoding=encoding) as file:
        return model.model_validate_json(await file.read())
