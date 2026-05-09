import os
from dotenv import load_dotenv
load_dotenv()
from portfolio_agent import get_relevant_repos

reqs = "I need a full stack developer for a RAG application using Python and React."
repos = get_relevant_repos(reqs)
print(f"REPOS: {repos}")
