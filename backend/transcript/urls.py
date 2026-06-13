from django.urls import path
from .views import TranscriptView, SummaryView, OllamaStatusView

urlpatterns = [
    path("", TranscriptView.as_view(), name="transcript"),
    path("summary/", SummaryView.as_view(), name="summary"),
    path("ollama-status/", OllamaStatusView.as_view(), name="ollama-status"),
    # path("debug/", DebugView.as_view(), name="debug"),
]