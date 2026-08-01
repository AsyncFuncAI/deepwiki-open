from api.logger import get_logger

logger = get_logger("chat")


def prompt_builder(
    system_prompt: str,
    query: str,
    conversation_history: str | None = None,
    file_path: str | None = None,
    file_content: str | None = None,
    context: str = "",
    simplify: bool = False,
) -> str:
    prompt = f"/no_think {system_prompt}\n\n"
    if conversation_history:
        prompt += (
            f"<conversation_history>\n{conversation_history}</conversation_history>\n\n"
        )

    if file_path and file_content:
        prompt += f'<currentFileContent path="{file_path}">\n{file_content}\n</currentFileContent>\n\n'

    if not simplify:
        if context.strip():
            context_prompt = f"<START_OF_CONTEXT>\n{context}\n<END_OF_CONTEXT>\n\n"
        else:
            # Add a note that we're skipping RAG due to size constraints or because it's the isolated API
            logger.info("No context available from RAG")
            context_prompt = (
                "<note>Answering without retrieval augmentation.</note>\n\n"
            )
    else:
        context_prompt = "<note>Answering without retrieval augmentation due to input size constraints.</note>\n\n"

    return prompt + context_prompt + f"<query>\n{query}\n</query>\n\nAssistant: "
