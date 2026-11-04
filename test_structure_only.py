#!/usr/bin/env python3
"""
Test just the structural analysis part of ASCII Research Agent
"""

import tempfile
import shutil
import os
from test_ascii_agent import create_sample_repository
from ascii_research_agent import EnhancedRepositoryAnalyzer

def test_structural_analysis():
    """Test only the structural analysis without API calls"""
    print("🔍 Testing ASCII Research Agent - Structural Analysis Only")
    
    # Create sample repository
    print("📁 Creating sample repository...")
    repo_path = create_sample_repository()
    print(f"✅ Sample repository created at: {repo_path}")
    
    try:
        # Create analyzer
        analyzer = EnhancedRepositoryAnalyzer(
            api_key="fake-key",
            provider="google",
            max_parallel_agents=2
        )
        
        # Test structural analysis only (no API calls)
        print("🔍 Running structural analysis...")
        structural_info = analyzer._phase_1a_structural_analysis(repo_path, "")
        
        print(f"📊 Structural analysis results:")
        print(f"  - Framework detected: {structural_info['framework_detected']}")
        print(f"  - Total files: {structural_info['total_files']}")
        print(f"  - All files: {len(structural_info['all_files'])}")
        print(f"  - Architectural files: {len(structural_info['architectural_files'])}")
        
        print("\n📁 Architectural files found:")
        for arch_file in structural_info['architectural_files']:
            print(f"  - {arch_file['relative_path']} ({arch_file['extension']})")
        
        print("\n📄 All files found:")
        for file_info in structural_info['all_files']:
            is_arch = file_info in structural_info['architectural_files']
            marker = "🏗️" if is_arch else "📄"
            print(f"  {marker} {file_info['relative_path']} ({file_info['extension']})")
        
        print("\n🌳 File tree:")
        print(structural_info['file_tree'])
        
        # Test architectural file detection
        print("\n🔍 Testing architectural file detection logic:")
        for file_info in structural_info['all_files']:
            is_arch = analyzer._is_architectural_file(file_info, structural_info['framework_detected'])
            print(f"  - {file_info['relative_path']}: {'✅ Architectural' if is_arch else '❌ Not architectural'}")
        
        print("\n✅ Structural analysis test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Cleanup
        print("\n🧹 Cleaning up...")
        shutil.rmtree(repo_path)
        print("✅ Cleanup completed!")

if __name__ == "__main__":
    test_structural_analysis()
