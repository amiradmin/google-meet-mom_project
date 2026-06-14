import requests
import json
from django.conf import settings


class OllamaService:
    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_HOST', 'http://ollama:11434')
        self.model = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:1b')

    def generate_summary(self, transcript_text):
        """Generate meeting minutes in Farsi using two-step process"""

        # Truncate very long transcripts
        if len(transcript_text) > 3000:
            print(f"⚠️ Transcript too long ({len(transcript_text)} chars), truncating...")
            transcript_text = transcript_text[-3000:]

        # Step 1: Generate MoM in English (the model does this well)
        english_prompt = f"""You are an expert business analyst. Create a concise Minutes of Meeting in English with these sections:
- Executive Summary (2-3 sentences)
- Key Discussion Points (2-3 bullet points)
- Decisions Made (2 bullet points)
- Action Items (2 bullet points)

Transcript:
{transcript_text}

Minutes of Meeting:"""

        try:
            print("=" * 60)
            print("🤖 STEP 1: Generating English MoM")
            print(f"📦 Model: {self.model}")
            print("=" * 60)

            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": english_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.6,
                        "num_predict": 1024,
                        "num_ctx": 2048
                    }
                },
                timeout=300
            )

            if response.status_code != 200:
                return f"خطا: {response.status_code}"

            result = response.json()
            english_mom = result.get('response', '')
            print(f"✅ English MoM generated: {len(english_mom)} chars")

            # Step 2: Translate to Farsi using the same model
            print("=" * 60)
            print("🤖 STEP 2: Translating to Farsi/Persian")
            print("=" * 60)

            translate_prompt = f"""Translate the following English text to Persian/Farsi (فارسی). Only output the Persian translation, no explanations.

English text:
{english_mom}

Persian translation:"""

            translate_response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": translate_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # Lower temperature for accurate translation
                        "num_predict": 1024,
                        "num_ctx": 2048
                    }
                },
                timeout=300
            )

            if translate_response.status_code == 200:
                farsi_mom = translate_response.json().get('response', english_mom)
                print(f"✅ Farsi translation complete: {len(farsi_mom)} chars")
                return farsi_mom
            else:
                # Fallback to English if translation fails
                return f"⚠️ ترجمه امکان‌پذیر نبود:\n\n{english_mom}"

        except requests.exceptions.Timeout:
            return "مدت زمان تولید خلاصه به پایان رسید."
        except Exception as e:
            return f"خطا: {str(e)}"

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