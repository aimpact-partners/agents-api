# AGENTS API Introduction

Integrating generative AI into applications often faces the challenge of rigidity when prompts and instructions are
hardcoded into the source code. Any business-driven or optimization-related change requires modifying, rebuilding, and
redeploying the application. Better Agents solves this by introducing a **Prompt Management System (PMS)** that
decouples prompt templates from the application source code, treating them as centralized and versionable business
assets.

By simply invoking a Prompt ID with the required variables, developers eliminate the complexity of prompt engineering on
the client side. Better Agents also provides key benefits such as model-specific optimization, multilingual support,
schema enforcement for reliable structured output, and flexible integration flows. It features two main execution
models: the **Direct Flow** for isolated generative actions and the **Iterative Flow** for persistent, goal-oriented
agent interactions. The platform is supported by a Dashboard for management, optimization, and testing, and an API for
seamless application integration. Security is ensured through project-based authorization and bearer tokens.
