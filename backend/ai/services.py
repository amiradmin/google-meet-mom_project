import requests
import json
from django.conf import settings


class OllamaService:
    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_HOST', 'http://ollama:11434')
        self.model = getattr(settings, 'OLLAMA_MODEL', 'llama3.1')

    def generate_summary(self, transcript_text):
        """Generate meeting minutes using Ollama"""

        prompt = f"""You are an expert business analyst creating professional Minutes of Meeting (MoM).

Based on the following meeting transcript, create a comprehensive MoM with these sections:

# 📋 MINUTES OF MEETING

## 📌 Executive Summary
[Brief 2-3 sentence overview]

## 🎯 Key Discussion Points
- [Main topic 1]
- [Main topic 2]
- [Main topic 3]

## ✅ Decisions Made
- [Decision 1]
- [Decision 2]

## 📋 Action Items
- [Task 1]
- [Task 2]

## 🔄 Next Steps
- [Step 1]
- [Step 2]

---
**Transcript:**
{transcript_text}

Generate the MoM in clear, professional language:"""

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.6,
                        "num_predict": 2048
                    }
                },
                timeout=180
            )

            if response.status_code == 200:
                result = response.json()
                return result.get('response', 'Error generating summary')
            else:
                return f"Error: Ollama returned status {response.status_code}"
        except Exception as e:
            return f"Error generating summary: {str(e)}"

    def check_health(self):
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                return True, f"Ollama ready with {self.model}"
            return False, "Ollama not responding"
        except Exception as e:
            return False, f"Connection error: {str(e)}"


ollama_service = OllamaService()


def generate_meeting_summary(transcript_text):
    return ollama_service.generate_summary(transcript_text)