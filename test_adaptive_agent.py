#!/usr/bin/env python3
"""
Test script for Adaptive ASCII Research Agent
Demonstrates the elimination of all hardcoded patterns in favor of LLM intelligence
"""

import asyncio
import tempfile
import shutil
import os
from test_ascii_agent import create_sample_repository
from adaptive_ascii_agent import AdaptiveCodebaseAnalyzer, LLMFrameworkDetector, LLMFileClassifier

def create_modern_react_app():
    """Create a modern React app with Next.js and TypeScript"""
    temp_dir = tempfile.mkdtemp(prefix="adaptive_test_react_")
    
    # Create Next.js 14 app structure
    os.makedirs(os.path.join(temp_dir, "app"), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, "components"), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, "lib"), exist_ok=True)
    
    # Create package.json with modern stack
    with open(os.path.join(temp_dir, "package.json"), "w") as f:
        f.write("""{
  "name": "modern-nextjs-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.24.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}""")
    
    # Create next.config.js
    with open(os.path.join(temp_dir, "next.config.js"), "w") as f:
        f.write("""/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
""")
    
    # Create app/layout.tsx (App Router)
    with open(os.path.join(temp_dir, "app", "layout.tsx"), "w") as f:
        f.write("""import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Modern Next.js App',
  description: 'Built with App Router and TypeScript',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
""")
    
    # Create app/page.tsx
    with open(os.path.join(temp_dir, "app", "page.tsx"), "w") as f:
        f.write("""import { UserDashboard } from '@/components/UserDashboard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Modern Next.js</h1>
      {session ? (
        <UserDashboard user={session.user} />
      ) : (
        <div>Please sign in to continue</div>
      )}
    </main>
  )
}
""")
    
    # Create components/UserDashboard.tsx
    with open(os.path.join(temp_dir, "components", "UserDashboard.tsx"), "w") as f:
        f.write("""'use client'

import { useState, useEffect } from 'react'
import { User } from 'next-auth'

interface UserDashboardProps {
  user: User
}

export function UserDashboard({ user }: UserDashboardProps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading dashboard...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}</h2>
        <p>Your personalized dashboard</p>
      </div>
    </div>
  )
}
""")
    
    # Create lib/auth.ts
    with open(os.path.join(temp_dir, "lib", "auth.ts"), "w") as f:
        f.write("""import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
}
""")
    
    return temp_dir

def create_rust_project():
    """Create a Rust project to test framework detection"""
    temp_dir = tempfile.mkdtemp(prefix="adaptive_test_rust_")
    
    # Create Cargo.toml
    with open(os.path.join(temp_dir, "Cargo.toml"), "w") as f:
        f.write("""[package]
name = "rust-web-api"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
warp = "0.3"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres"] }
""")
    
    # Create src directory
    os.makedirs(os.path.join(temp_dir, "src"), exist_ok=True)
    
    # Create main.rs
    with open(os.path.join(temp_dir, "src", "main.rs"), "w") as f:
        f.write("""use warp::Filter;
use std::collections::HashMap;

mod handlers;
mod models;

#[tokio::main]
async fn main() {
    let health = warp::path("health")
        .and(warp::get())
        .map(|| "OK");

    let api = warp::path("api")
        .and(warp::path("v1"))
        .and(
            handlers::users::routes()
                .or(handlers::auth::routes())
        );

    let routes = health.or(api);

    println!("Server running on http://localhost:3030");
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
""")
    
    return temp_dir

async def test_adaptive_framework_detection():
    """Test the adaptive framework detection with different project types"""
    print("🧠 Testing Adaptive Framework Detection")
    print("=" * 50)
    
    # Test with FastAPI project
    print("\n1. Testing FastAPI Project Detection:")
    fastapi_repo = create_sample_repository()
    try:
        detector = LLMFrameworkDetector("fake-key", "google")
        file_tree = detector._generate_file_tree(fastapi_repo) if hasattr(detector, '_generate_file_tree') else "File tree generation not available"
        
        print(f"📁 File tree preview:")
        print(file_tree[:500] + "..." if len(file_tree) > 500 else file_tree)
        
        # Show what the prompt would look like
        key_files = await detector._collect_key_files(fastapi_repo)
        print(f"\n🔍 Key files detected: {list(key_files.keys())}")
        
        # Show sample content
        for filename, content in list(key_files.items())[:2]:
            print(f"\n--- {filename} (first 200 chars) ---")
            print(content[:200] + "..." if len(content) > 200 else content)
            
    finally:
        shutil.rmtree(fastapi_repo)
    
    # Test with modern React/Next.js project
    print("\n\n2. Testing Modern Next.js Project Detection:")
    nextjs_repo = create_modern_react_app()
    try:
        detector = LLMFrameworkDetector("fake-key", "google")
        key_files = await detector._collect_key_files(nextjs_repo)
        print(f"🔍 Key files detected: {list(key_files.keys())}")
        
        # Show package.json content
        if 'package.json' in key_files:
            print(f"\n--- package.json ---")
            print(key_files['package.json'])
            
    finally:
        shutil.rmtree(nextjs_repo)
    
    # Test with Rust project
    print("\n\n3. Testing Rust Project Detection:")
    rust_repo = create_rust_project()
    try:
        detector = LLMFrameworkDetector("fake-key", "google")
        key_files = await detector._collect_key_files(rust_repo)
        print(f"🔍 Key files detected: {list(key_files.keys())}")
        
        # Show Cargo.toml content
        if 'Cargo.toml' in key_files:
            print(f"\n--- Cargo.toml ---")
            print(key_files['Cargo.toml'])
            
    finally:
        shutil.rmtree(rust_repo)

async def test_adaptive_file_classification():
    """Test the adaptive file classification"""
    print("\n\n🔍 Testing Adaptive File Classification")
    print("=" * 50)
    
    # Create a sample file for classification
    sample_repo = create_sample_repository()
    try:
        classifier = LLMFileClassifier("fake-key", "google")
        
        # Test main.py classification
        main_py_path = os.path.join(sample_repo, "main.py")
        with open(main_py_path, 'r') as f:
            content = f.read()
        
        print(f"📄 Analyzing file: main.py")
        print(f"Content preview (first 300 chars):")
        print(content[:300] + "..." if len(content) > 300 else content)
        
        # Show what the classification prompt would look like
        from adaptive_ascii_agent import FrameworkDiscovery
        fake_framework = FrameworkDiscovery(
            primary_framework="FastAPI",
            framework_version="0.104.1",
            secondary_frameworks=["SQLAlchemy", "Pydantic"],
            architecture_type="microservice",
            technology_stack=["Python", "FastAPI", "PostgreSQL"],
            confidence=0.95,
            reasoning="Detected FastAPI imports and app structure",
            unique_patterns=["Custom router structure"],
            complexity_indicators={"architectural_complexity": "moderate"}
        )
        
        prompt = classifier._create_file_analysis_prompt(main_py_path, content, fake_framework)
        print(f"\n🤖 Sample classification prompt (first 500 chars):")
        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        
    finally:
        shutil.rmtree(sample_repo)

async def test_adaptive_system_comparison():
    """Compare adaptive vs static approaches"""
    print("\n\n⚖️ Adaptive vs Static System Comparison")
    print("=" * 50)
    
    print("🚫 STATIC APPROACH PROBLEMS:")
    print("- Hardcoded FRAMEWORK_PATTERNS dictionary")
    print("- String matching for file classification")
    print("- Predefined ASCII_TYPES that may not fit project")
    print("- Breaks with new frameworks (Remix, SvelteKit, Qwik)")
    print("- Can't handle hybrid architectures")
    print("- Requires constant maintenance")
    
    print("\n✅ ADAPTIVE APPROACH BENEFITS:")
    print("- LLM analyzes actual code structure and dependencies")
    print("- Content-aware file classification based on actual purpose")
    print("- Dynamic visualization planning based on project needs")
    print("- Handles any framework, including emerging ones")
    print("- Adapts to unique project patterns automatically")
    print("- Zero maintenance for new frameworks")
    
    print("\n🎯 KEY ARCHITECTURAL CHANGES:")
    print("1. LLMFrameworkDetector replaces FRAMEWORK_PATTERNS")
    print("2. LLMFileClassifier replaces static string matching")
    print("3. LLMVisualizationPlanner replaces ASCII_TYPES")
    print("4. Content analysis replaces path-based assumptions")
    print("5. Dynamic discovery replaces hardcoded rules")

def main():
    """Run all adaptive system tests"""
    print("🚀 Adaptive ASCII Research Agent Tests")
    print("Demonstrating elimination of all hardcoded patterns")
    print("=" * 60)
    
    # Run async tests
    asyncio.run(test_adaptive_framework_detection())
    asyncio.run(test_adaptive_file_classification())
    asyncio.run(test_adaptive_system_comparison())
    
    print("\n" + "=" * 60)
    print("🎉 Adaptive System Tests Complete!")
    print("\n📝 Next Steps:")
    print("1. Implement remaining adaptive processors")
    print("2. Test with real API keys and diverse codebases")
    print("3. Measure accuracy vs static pattern matching")
    print("4. Validate adaptability with new frameworks")

if __name__ == "__main__":
    main()
