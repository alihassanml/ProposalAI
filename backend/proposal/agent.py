import os
import requests
from typing import List, Dict
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class PortfolioRepo(BaseModel):
    name: str = Field(description="The name of the GitHub repository")
    summary: str = Field(description="A 1-2 sentence summary of why this repo is relevant to the project and what it does.")

class PortfolioSelection(BaseModel):
    repos: List[PortfolioRepo] = Field(description="List of the 2 most relevant repositories")

def get_relevant_repos(requirements: str) -> List[Dict]:
    username = "alihassanml"
    url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"

    try:
        response = requests.get(url)
        all_repos = response.json()

        repo_data = []
        for r in all_repos:
            if not r.get('fork'):
                repo_data.append({
                    "name": r.get('name'),
                    "description": r.get('description', 'No description'),
                    "topics": r.get('topics', []),
                    "language": r.get('language', 'Unknown')
                })

        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        structured_llm = llm.with_structured_output(PortfolioSelection)

        system = (
            "You are a technical portfolio expert. Your goal is to select the 2 most relevant "
            "GitHub repositories from a list based on a job's requirements. "
            "For each selected repo, provide a concise, high-impact summary of its relevance."
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system),
            ("human", "JOB REQUIREMENTS:\n{requirements}\n\nMY REPOSITORIES:\n{repos}\n\nSelect the 2 best matches and explain why.")
        ])

        chain = prompt | structured_llm

        result = chain.invoke({
            "requirements": requirements,
            "repos": str(repo_data[:50])
        })

        return [repo.model_dump() for repo in result.repos]

    except Exception:
        return []
