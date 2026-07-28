from pydantic import BaseModel, Field


class Model(BaseModel):
    """
    Model for LLM model configuration
    """
    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Display name for the model")


class Provider(BaseModel):
    """
    Model for LLM provider configuration
    """
    id: str = Field(..., description="Provider identifier")
    name: str = Field(..., description="Display name for the provider")
    models: list[Model] = Field(..., description="List of available models for this provider")
    supportsCustomModel: bool = Field(False, description="Whether this provider supports custom models")


class ModelConfig(BaseModel):
    """
    Model for the entire model configuration
    """
    providers: list[Provider] = Field(..., description="List of available model providers")
    defaultProvider: str = Field(..., description="ID of the default provider")


class AuthorizationConfig(BaseModel):
    code: str = Field(..., description="Authorization code")
