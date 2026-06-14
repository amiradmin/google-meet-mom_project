import requests
import json
from django.conf import settings


class OllamaService:
    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_HOST', 'http://ollama:11434')
        self.model = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:1b')

    def generate_summary(self, transcript_text):
        """Generate meeting minutes using Ollama"""

        # Truncate very long transcripts (keep last 2000 chars for context)
        if len(transcript_text) > 3000:
            print(f"⚠️ Transcript too long ({len(transcript_text)} chars), truncating...")
            transcript_text = transcript_text[-3000:]  # Keep last 3000 chars

        prompt = f"""You are an expert business analyst creating professional Minutes of Meeting (MoM).

Based on the following meeting transcript, create a concise MoM with these sections:

# 📋 MINUTES OF MEETING

## 📌 Executive Summary
[Brief 2-3 sentence overview]

## 🎯 Key Discussion Points
- [Main topic 1]
- [Main topic 2]

## ✅ Decisions Made
- [Decision 1]
- [Decision 2]

## 📋 Action Items
- [Task 1]
- [Task 2]

---
**Transcript:**
{transcript_text}

Generate a CONCISE MoM in clear, professional language:"""

        try:
            print("=" * 60)
            print("🤖 SENDING REQUEST TO OLLAMA")
            print(f"📡 URL: {self.base_url}/api/generate")
            print(f"📦 Model: {self.model}")
            print(f"📝 Transcript length: {len(transcript_text)} characters")
            print("=" * 60)

            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.6,
                        "num_predict": 1024,  # Reduced from 2048 for faster response
                        "num_ctx": 2048  # Context window size
                    }
                },
                timeout=300  # Increased to 5 minutes (300 seconds)
            )

            if response.status_code == 200:
                result = response.json()
                generated_text = result.get('response', 'Error generating summary')
                print(f"✅ Ollama response received! Length: {len(generated_text)} characters")
                return generated_text
            else:
                error_msg = f"Error: Ollama returned status {response.status_code}"
                print(f"❌ {error_msg}")
                return error_msg
        except requests.exceptions.Timeout:
            error_msg = "Summary generation timed out. The transcript might be too long. Try clearing old captions and keeping the meeting shorter."
            print(f"❌ {error_msg}")
            return error_msg
        except Exception as e:
            error_msg = f"Error generating summary: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg

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