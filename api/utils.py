import os
from typing import Tuple


def get_adalflow_default_root_path() -> str:
    """
    Get the default root path for adalflow data storage.
    
    Returns:
        str: The default root path
    """
    return os.path.expanduser("~/.adalflow")


def extract_repo_name_from_url(repo_url: str, repo_type: str) -> str:
    """
    Extract repository name from URL to create a unique identifier.
    This function provides consistent repo name generation across the application.
    
    Args:
        repo_url (str): The repository URL
        repo_type (str): The type of repository (github, gitlab, bitbucket, cnb, web, local)
        
    Returns:
        str: The repository name identifier
        
    Examples:
        For GitHub: https://github.com/owner/repo -> "owner_repo"
        For CNB: https://cnb.cool/opencamp/learning-docker/project-1-jupyter -> "project-1-jupyter"
        For GitLab: https://gitlab.com/group/subgroup/repo -> "subgroup_repo"
    """
    # Extract parts from URL
    url_parts = repo_url.rstrip('/').split('/')
    
    if repo_type in ["github", "gitlab", "bitbucket"] and len(url_parts) >= 5:
        # Traditional git hosting services: use owner_repo format
        # GitHub URL format: https://github.com/owner/repo
        # GitLab URL format: https://gitlab.com/owner/repo or https://gitlab.com/group/subgroup/repo
        # Bitbucket URL format: https://bitbucket.org/owner/repo
        owner = url_parts[-2]
        repo = url_parts[-1].replace(".git", "")
        repo_name = f"{owner}_{repo}"
    else:
        # For CNB and other web-based repositories: use only the repo name
        # This handles cases like https://cnb.cool/opencamp/learning-docker/project-1-jupyter
        # where the directory structure is complex but we only want the final repo name
        repo_name = url_parts[-1].replace(".git", "")
    
    return repo_name


def get_repo_local_path(repo_url: str, repo_type: str) -> str:
    """
    Get the local path for a repository based on its URL and type.
    
    Args:
        repo_url (str): The repository URL
        repo_type (str): The type of repository (github, gitlab, bitbucket, cnb, web, local)
        
    Returns:
        str: The local path where the repository should be stored
    """
    root_path = get_adalflow_default_root_path()
    repo_name = extract_repo_name_from_url(repo_url, repo_type)
    return os.path.join(root_path, "repos", repo_name)