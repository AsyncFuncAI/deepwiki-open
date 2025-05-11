"""
Model configuration management module.
Provides the ModelConfig class for handling different types of model configurations.
"""
import os
import json
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
from pathlib import Path

from adalflow import GoogleGenAIClient, OllamaClient, OpenAIClient, ModelClient
from api.openrouter_client import OpenRouterClient

# Configure logging
logger = logging.getLogger(__name__)

class ModelConfig:
    """Model configuration class, used to manage and load configuration information for different models."""
    
    def __init__(self, config_dict: Dict[str, Any], model_class: Any, role: str):
        """
        Initialize model configuration.
        
        Args:
            config_dict: Dictionary containing model configuration
            model_class: Model client class reference
            role: Role of the model
        """
        self.model_type = config_dict.get("model_type")
        self.model_kwargs = config_dict.get("model_kwargs", {})
        self.batch_size = config_dict.get("batch_size", 500)
        self.model_class = model_class
        self.role = role
        self.model = None

    def is_local(self) -> bool:
        return self.model_type == "ollama"
    
    def get_client(self) -> ModelClient:
        # TODO: some params in kwargs can be passed to the model class
        return self.model_class()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert configuration to dictionary form.
        
        Returns:
            Dict[str, Any]: Configuration dictionary
        """
        result = {}
        if self.model_type:
            result["model_type"] = self.model_type
        if self.model_kwargs:
            result["model_kwargs"] = self.model_kwargs
        if self.batch_size:
            result["batch_size"] = self.batch_size
        return result
    
    @staticmethod
    def _get_client_class(client_name: str) -> Any:
        """
        Get the actual class reference based on the client name.
        
        Args:
            client_name: Client class name
        
        Returns:
            Client class reference
        """
        
        client_map = {
            "openai": OpenAIClient,
            "google": GoogleGenAIClient,
            "ollama": OllamaClient,
            "openrouter": OpenRouterClient
        }
        
        return client_map.get(client_name)
    
    @classmethod
    def load_from_config_dict(cls, config_dict: Dict[str, Any], role: str) -> 'ModelConfig':
        """
        Load model configuration from a configuration dictionary.
        
        Args:
            config_dict: Configuration dictionary
            role: embedder or generator
            
        Returns:
            ModelConfig: Model configuration object
        """
        config_copy = config_dict.copy()
        
        # Process model client class reference
        model_type = config_copy.get("model_type")
        model_class = cls._get_client_class(model_type)
            
        return cls(config_copy, model_class, role)

def load_model_configs(config_dir: Union[str, Path]) -> Tuple[Dict[str, Dict[str, ModelConfig]], Dict[str, Dict[str, ModelConfig]]]:
    """
    Load embedders.json and generators.json configuration files, create model configuration objects.
    
    Args:
        config_dir: Configuration file directory path
        
    Returns:
        Tuple[Dict[str, Dict[str, ModelConfig]], Dict[str, Dict[str, ModelConfig]]]: 
        Tuple of (embedder configuration, generator configuration)
    """
    config_dir = Path(config_dir)
    embedders = {}
    generators = {}
    
    embedders_path = config_dir / "embedders.json"
    generators_path = config_dir / "generators.json"
    
    # Load embedders configuration
    if embedders_path.exists():
        try:
            with open(embedders_path, 'r') as f:
                embedder_data = json.load(f)
                
            for name, config in embedder_data.items():
                if name not in embedders:
                    embedders[name] = {}
                embedders[name] = ModelConfig.load_from_config_dict(config, "embedder")
        except Exception as e:
            logger.error(f"Error loading embedders config: {e}")
    
    # Load generators configuration
    if generators_path.exists():
        try:
            with open(generators_path, 'r') as f:
                generator_data = json.load(f)
                
            for name, config in generator_data.items():
                if name not in generators:
                    generators[name] = {}
                generators[name] = ModelConfig.load_from_config_dict(config, "generator")
        except Exception as e:
            logger.error(f"Error loading generators config: {e}")
    
    return embedders, generators