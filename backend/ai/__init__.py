# backend/ai/__init__.py
from .services import OllamaService, ollama_service, generate_meeting_summary

__all__ = ['OllamaService', 'ollama_service', 'generate_meeting_summary']