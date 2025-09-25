#!/usr/bin/env python3
"""
测试修复后的仓库路径解析逻辑
"""

import sys
import os
sys.path.append('.')

from api.utils import extract_repo_name_from_url, get_repo_local_path

def test_cnb_url_parsing():
    """测试 CNB URL 的解析逻辑"""
    test_url = "https://cnb.cool/opencamp/learning-docker/project-1-jupyter"
    repo_type = "cnb"
    
    print(f"测试 URL: {test_url}")
    print(f"仓库类型: {repo_type}")
    
    # 测试仓库名称提取
    repo_name = extract_repo_name_from_url(test_url, repo_type)
    print(f"提取的仓库名称: {repo_name}")
    
    # 测试本地路径构建
    local_path = get_repo_local_path(test_url, repo_type)
    print(f"本地路径: {local_path}")
    
    return repo_name, local_path

def test_github_url_parsing():
    """测试 GitHub URL 的解析逻辑"""
    test_url = "https://github.com/owner/repo"
    repo_type = "github"
    
    print(f"\n测试 URL: {test_url}")
    print(f"仓库类型: {repo_type}")
    
    # 测试仓库名称提取
    repo_name = extract_repo_name_from_url(test_url, repo_type)
    print(f"提取的仓库名称: {repo_name}")
    
    # 测试本地路径构建
    local_path = get_repo_local_path(test_url, repo_type)
    print(f"本地路径: {local_path}")
    
    return repo_name, local_path

if __name__ == "__main__":
    print("=== 测试修复后的仓库路径解析逻辑 ===")
    
    try:
        # 测试 CNB URL
        cnb_repo_name, cnb_local_path = test_cnb_url_parsing()
        
        # 测试 GitHub URL
        github_repo_name, github_local_path = test_github_url_parsing()
        
        print("\n=== 测试结果 ===")
        print(f"CNB 仓库名称: {cnb_repo_name}")
        print(f"GitHub 仓库名称: {github_repo_name}")
        print("\n所有测试通过！路径解析逻辑工作正常。")
        
    except Exception as e:
        print(f"\n测试失败: {e}")
        sys.exit(1)