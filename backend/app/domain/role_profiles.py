"""Curated target-role profiles.

These are the deterministic reference data the Hiring Score engine grades a user
against, and the list the user can pick their target role from. The AI may
*suggest* a role (free text); `match_role` maps that suggestion to one of these
keys. No AI is involved in the profiles themselves.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class RoleProfile:
    key: str
    label: str
    aliases: tuple[str, ...] = ()
    # canonical lowercase skill keywords considered "core" for this role
    core_skills: tuple[str, ...] = ()
    # keywords that make a certification relevant to this role
    relevant_certs: tuple[str, ...] = ()
    # project keywords that make a project relevant to this role
    project_keywords: tuple[str, ...] = ()
    # recommended portfolio projects (used by Milestone 3: Project Gap Detector)
    recommended_projects: tuple[str, ...] = ()


ROLE_PROFILES: dict[str, RoleProfile] = {
    "data_analyst": RoleProfile(
        key="data_analyst",
        label="Data Analyst",
        aliases=("data analyst", "business analyst", "bi analyst", "analytics"),
        core_skills=(
            "sql", "excel", "python", "power bi", "tableau", "statistics",
            "data visualization", "pandas",
        ),
        relevant_certs=(
            "power bi", "tableau", "google data analytics", "azure data",
            "aws", "sql",
        ),
        project_keywords=(
            "dashboard", "report", "analysis", "visualization", "sql", "etl",
        ),
        recommended_projects=(
            "Sales Dashboard", "Churn Prediction Report", "KPI Analytics Platform",
        ),
    ),
    "data_scientist": RoleProfile(
        key="data_scientist",
        label="Data Scientist",
        aliases=("data scientist", "ml scientist", "machine learning scientist"),
        core_skills=(
            "python", "machine learning", "statistics", "pandas", "numpy",
            "scikit-learn", "sql", "deep learning", "data visualization",
        ),
        relevant_certs=("tensorflow", "aws", "azure", "google", "deep learning"),
        project_keywords=(
            "model", "prediction", "classification", "regression", "nlp",
            "machine learning", "notebook",
        ),
        recommended_projects=(
            "Churn Prediction Model", "Recommendation System",
            "NLP Sentiment Classifier",
        ),
    ),
    "ml_engineer": RoleProfile(
        key="ml_engineer",
        label="Machine Learning Engineer",
        aliases=("ml engineer", "machine learning engineer", "ai engineer"),
        core_skills=(
            "python", "machine learning", "deep learning", "tensorflow",
            "pytorch", "docker", "mlops", "sql", "apis",
        ),
        relevant_certs=("tensorflow", "aws", "azure", "kubernetes", "deep learning"),
        project_keywords=(
            "model", "pipeline", "deployment", "inference", "training", "mlops",
        ),
        recommended_projects=(
            "End-to-end ML Pipeline", "Model Serving API", "Feature Store",
        ),
    ),
    "frontend_developer": RoleProfile(
        key="frontend_developer",
        label="Frontend Developer",
        aliases=("frontend", "front end", "ui developer", "web developer"),
        core_skills=(
            "javascript", "typescript", "react", "html", "css", "next.js",
            "tailwind", "redux", "vue",
        ),
        relevant_certs=("meta front-end", "javascript", "react"),
        project_keywords=(
            "website", "ui", "frontend", "react", "portfolio", "spa", "dashboard",
        ),
        recommended_projects=(
            "Responsive Dashboard UI", "Component Library", "E-commerce Storefront",
        ),
    ),
    "backend_developer": RoleProfile(
        key="backend_developer",
        label="Backend Developer",
        aliases=("backend", "back end", "api developer", "server developer"),
        core_skills=(
            "python", "node.js", "java", "sql", "rest", "apis", "docker",
            "postgresql", "redis", "fastapi",
        ),
        relevant_certs=("aws", "azure", "kubernetes", "oracle java"),
        project_keywords=(
            "api", "backend", "service", "microservice", "database", "auth",
        ),
        recommended_projects=(
            "REST API with Auth", "Microservice + Queue", "Rate-limited API Gateway",
        ),
    ),
    "fullstack_developer": RoleProfile(
        key="fullstack_developer",
        label="Full Stack Developer",
        aliases=("full stack", "fullstack", "full-stack", "software engineer", "sde"),
        core_skills=(
            "javascript", "typescript", "react", "node.js", "sql", "rest",
            "apis", "docker", "next.js", "python",
        ),
        relevant_certs=("aws", "azure", "meta", "full stack"),
        project_keywords=(
            "app", "full stack", "web", "api", "dashboard", "saas", "crud",
        ),
        recommended_projects=(
            "Full-stack SaaS App", "Realtime Chat App", "Project Management Tool",
        ),
    ),
    "devops_engineer": RoleProfile(
        key="devops_engineer",
        label="DevOps Engineer",
        aliases=("devops", "site reliability", "sre", "platform engineer"),
        core_skills=(
            "docker", "kubernetes", "aws", "ci/cd", "terraform", "linux",
            "python", "monitoring", "bash",
        ),
        relevant_certs=("aws", "kubernetes", "cka", "terraform", "azure"),
        project_keywords=(
            "pipeline", "infrastructure", "deployment", "ci", "automation",
            "docker", "kubernetes",
        ),
        recommended_projects=(
            "CI/CD Pipeline", "Infra-as-Code Stack", "Observability Dashboard",
        ),
    ),
    "mobile_developer": RoleProfile(
        key="mobile_developer",
        label="Mobile Developer",
        aliases=("mobile", "android developer", "ios developer", "app developer"),
        core_skills=(
            "kotlin", "swift", "react native", "flutter", "java", "dart",
            "rest", "apis",
        ),
        relevant_certs=("android", "google associate", "flutter"),
        project_keywords=("app", "mobile", "android", "ios", "flutter"),
        recommended_projects=(
            "Cross-platform App", "Offline-first Notes App", "Fitness Tracker",
        ),
    ),
    "cloud_engineer": RoleProfile(
        key="cloud_engineer",
        label="Cloud Engineer",
        aliases=("cloud engineer", "cloud architect", "aws engineer"),
        core_skills=(
            "aws", "azure", "gcp", "terraform", "docker", "kubernetes",
            "networking", "linux", "python",
        ),
        relevant_certs=("aws", "azure", "gcp", "terraform", "ccp", "solutions architect"),
        project_keywords=(
            "cloud", "serverless", "infrastructure", "lambda", "deployment",
        ),
        recommended_projects=(
            "Serverless App", "Multi-tier Cloud Architecture", "Cost Optimizer",
        ),
    ),
    "software_engineer": RoleProfile(
        key="software_engineer",
        label="Software Engineer",
        aliases=("software engineer", "developer", "programmer", "engineer"),
        core_skills=(
            "python", "java", "javascript", "sql", "data structures",
            "algorithms", "git", "rest", "apis",
        ),
        relevant_certs=("aws", "azure", "oracle", "meta"),
        project_keywords=("app", "system", "api", "tool", "project"),
        recommended_projects=(
            "Full-stack CRUD App", "CLI Productivity Tool", "REST API Service",
        ),
    ),

    # ── Trending roles (2024–2026) ───────────────────────────────────────────

    "ai_engineer": RoleProfile(
        key="ai_engineer",
        label="AI Engineer",
        aliases=(
            "ai engineer", "generative ai engineer", "gen ai engineer",
            "llm engineer", "applied ai engineer",
        ),
        core_skills=(
            "python", "llm", "prompt engineering", "langchain", "openai api",
            "vector databases", "embeddings", "rag", "fine-tuning", "fastapi",
            "pytorch", "machine learning",
        ),
        relevant_certs=(
            "aws", "azure ai", "google cloud ai", "deep learning", "openai",
        ),
        project_keywords=(
            "llm", "chatbot", "agent", "rag", "prompt", "embedding",
            "generative", "fine-tune", "ai",
        ),
        recommended_projects=(
            "RAG-based Document Q&A", "LLM-powered Agent", "AI-assisted Code Review Tool",
        ),
    ),

    "platform_engineer": RoleProfile(
        key="platform_engineer",
        label="Platform Engineer",
        aliases=(
            "platform engineer", "internal platform engineer", "developer platform",
            "infrastructure platform",
        ),
        core_skills=(
            "kubernetes", "terraform", "golang", "python", "ci/cd", "docker",
            "aws", "observability", "linux", "helm", "argocd", "backstage",
        ),
        relevant_certs=(
            "cka", "ckad", "aws", "terraform", "kubernetes", "azure",
        ),
        project_keywords=(
            "platform", "internal tooling", "developer experience", "dx",
            "infrastructure", "golden path", "service catalog",
        ),
        recommended_projects=(
            "Internal Developer Portal", "Self-service Infra CLI",
            "Kubernetes Operator",
        ),
    ),

    "security_engineer": RoleProfile(
        key="security_engineer",
        label="Security Engineer",
        aliases=(
            "security engineer", "application security", "appsec",
            "cybersecurity engineer", "cloud security engineer",
        ),
        core_skills=(
            "python", "penetration testing", "siem", "network security",
            "iam", "zero trust", "vulnerability assessment", "docker",
            "linux", "aws", "owasp", "cryptography",
        ),
        relevant_certs=(
            "cissp", "ceh", "comptia security+", "aws security",
            "certified ethical hacker", "oscp", "azure security",
        ),
        project_keywords=(
            "security", "vulnerability", "pentest", "siem", "firewall",
            "threat", "devsecops", "authentication",
        ),
        recommended_projects=(
            "Automated Vulnerability Scanner", "SIEM Log Analyzer",
            "Zero-Trust Auth Gateway",
        ),
    ),

    "data_engineer": RoleProfile(
        key="data_engineer",
        label="Data Engineer",
        aliases=(
            "data engineer", "big data engineer", "etl developer",
            "data platform engineer",
        ),
        core_skills=(
            "python", "sql", "spark", "airflow", "kafka", "dbt",
            "data warehousing", "aws", "snowflake", "bigquery",
            "postgresql", "etl",
        ),
        relevant_certs=(
            "aws data analytics", "databricks", "google data engineer",
            "azure data engineer", "dbt",
        ),
        project_keywords=(
            "pipeline", "etl", "data lake", "warehouse", "streaming",
            "batch", "orchestration", "dbt", "spark",
        ),
        recommended_projects=(
            "ELT Pipeline with dbt + Airflow", "Real-time Streaming Dashboard",
            "Data Lake on AWS S3",
        ),
    ),

    "blockchain_developer": RoleProfile(
        key="blockchain_developer",
        label="Blockchain Developer",
        aliases=(
            "blockchain developer", "web3 developer", "smart contract developer",
            "solidity developer", "defi engineer",
        ),
        core_skills=(
            "solidity", "ethereum", "web3.js", "ethers.js", "smart contracts",
            "hardhat", "javascript", "typescript", "rust", "defi",
        ),
        relevant_certs=(
            "certified blockchain developer", "ethereum", "hyperledger",
        ),
        project_keywords=(
            "blockchain", "smart contract", "defi", "nft", "web3", "dao",
            "solidity", "dapp", "token",
        ),
        recommended_projects=(
            "DeFi Lending Protocol", "NFT Marketplace", "DAO Governance Contracts",
        ),
    ),

    "product_engineer": RoleProfile(
        key="product_engineer",
        label="Product Engineer",
        aliases=(
            "product engineer", "growth engineer", "founding engineer",
            "product-minded engineer",
        ),
        core_skills=(
            "typescript", "react", "node.js", "python", "sql",
            "product analytics", "a/b testing", "feature flags",
            "rest", "apis", "next.js",
        ),
        relevant_certs=("aws", "google analytics", "meta", "product management"),
        project_keywords=(
            "saas", "product", "growth", "experiment", "analytics",
            "feature", "conversion", "funnel",
        ),
        recommended_projects=(
            "A/B Testing Framework", "SaaS Onboarding Flow", "Analytics Event Tracker",
        ),
    ),

    "ar_vr_developer": RoleProfile(
        key="ar_vr_developer",
        label="AR/VR Developer",
        aliases=(
            "ar developer", "vr developer", "xr developer", "spatial computing",
            "ar/vr engineer", "mixed reality developer",
        ),
        core_skills=(
            "unity", "unreal engine", "c#", "arcore", "arkit", "openxr",
            "3d modeling", "blender", "webxr", "javascript",
        ),
        relevant_certs=(
            "unity certified", "unreal certified", "meta spark",
        ),
        project_keywords=(
            "ar", "vr", "xr", "spatial", "3d", "immersive",
            "unity", "unreal", "mixed reality",
        ),
        recommended_projects=(
            "AR Product Visualizer", "VR Training Simulator",
            "WebXR Interactive Experience",
        ),
    ),

    "ml_ops_engineer": RoleProfile(
        key="ml_ops_engineer",
        label="MLOps Engineer",
        aliases=(
            "mlops engineer", "ml platform engineer", "ml infrastructure engineer",
            "ai ops engineer",
        ),
        core_skills=(
            "python", "mlflow", "kubeflow", "docker", "kubernetes", "airflow",
            "feature stores", "model monitoring", "ci/cd", "terraform",
            "aws sagemaker", "pytorch",
        ),
        relevant_certs=(
            "aws machine learning", "databricks mlops", "google professional ml",
            "azure ai", "kubernetes",
        ),
        project_keywords=(
            "mlops", "model registry", "feature store", "model serving",
            "drift detection", "retraining", "pipeline", "monitoring",
        ),
        recommended_projects=(
            "Automated Retraining Pipeline", "Model Drift Monitor",
            "Self-healing Feature Store",
        ),
    ),
}

DEFAULT_ROLE_KEY = "software_engineer"


def list_roles() -> list[dict[str, str]]:
    return [{"key": p.key, "label": p.label} for p in ROLE_PROFILES.values()]


def get_profile(role_key: str | None) -> RoleProfile:
    if role_key and role_key in ROLE_PROFILES:
        return ROLE_PROFILES[role_key]
    return ROLE_PROFILES[DEFAULT_ROLE_KEY]


def label_for(role_key: str | None) -> str:
    return get_profile(role_key).label


def match_role(free_text: str | None) -> str:
    """Map a free-text role (AI suggestion / user input) to a curated key."""
    if not free_text:
        return DEFAULT_ROLE_KEY
    text = free_text.strip().lower()
    if text in ROLE_PROFILES:
        return text
    # exact alias / label hit first
    for profile in ROLE_PROFILES.values():
        if text == profile.label.lower() or text in profile.aliases:
            return profile.key
    # substring overlap against aliases + label
    best_key, best_score = DEFAULT_ROLE_KEY, 0
    for profile in ROLE_PROFILES.values():
        candidates = (profile.label.lower(), *profile.aliases)
        score = sum(1 for c in candidates if c in text or text in c)
        if score > best_score:
            best_key, best_score = profile.key, score
    return best_key
