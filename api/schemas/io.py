import anyio
from pydantic import BaseModel


async def asave(model: BaseModel, path: str, *, encoding: str = "utf-8"):

    async with await anyio.open_file(path, mode="w", encoding=encoding) as file:
        await file.write(model.model_dump_json())


async def aload(model: type[BaseModel], path: str, *, encoding: str = "utf-8"):
    import json
    async with await anyio.open_file(path, mode="r", encoding=encoding) as file:
        return model(**json.loads(await file.read()))
