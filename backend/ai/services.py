import requests
import json
from django.conf import settings


class OllamaService:
    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_HOST', 'http://ollama:11434')
        self.model = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:3b')  # Updated to 3B

    def generate_summary(self, transcript_text):
        """Generate meeting minutes directly in Farsi using the larger model"""

        # Truncate very long transcripts
        if len(transcript_text) > 3000:
            print(f"⚠️ Transcript too long ({len(transcript_text)} chars), truncating...")
            transcript_text = transcript_text[-3000:]

        # Direct Farsi prompt (the 3B model handles this well)
        prompt = f"""شما یک تحلیلگر حرفه‌ای کسب و کار هستید. صورتجلسه زیر را به فارسی بنویسید.

متن جلسه:
{transcript_text}

صورتجلسه را با این ساختار بنویسید:

خلاصه اجرایی:
[دو تا سه خط خلاصه]

نکات کلیدی بحث شده:
- [نکته اول]
- [نکته دوم]
- [نکته سوم]

تصمیمات گرفته شده:
- [تصمیم اول]
- [تصمیم دوم]

اقدامات مورد نیاز:
- [اقدام اول]
- [اقدام دوم]

صورتجلسه:"""

        try:
            print("=" * 60)
            print("🤖 GENERATING FARSI MINUTES OF MEETING")
            print(f"📦 Model: {self.model} (3B - Better for Farsi)")
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
                        "num_predict": 1024,
                        "num_ctx": 2048
                    }
                },
                timeout=300
            )

            if response.status_code == 200:
                result = response.json()
                generated_text = result.get('response', 'خطا در تولید صورتجلسه')
                print(f"✅ Farsi MoM generated! Length: {len(generated_text)} characters")
                print(f"📝 Preview: {generated_text[:200]}...")
                return generated_text
            else:
                error_msg = f"Error: Ollama returned status {response.status_code}"
                print(f"❌ {error_msg}")
                return error_msg

        except requests.exceptions.Timeout:
            error_msg = "مدت زمان تولید صورتجلسه به پایان رسید."
            print(f"❌ {error_msg}")
            return error_msg
        except Exception as e:
            error_msg = f"خطا در تولید صورتجلسه: {str(e)}"
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