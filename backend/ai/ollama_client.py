import requests

OLLAMA_URL = "http://ollama:11434/api/generate"


def ask_ollama(prompt: str, model: str = "gemma2:9b"):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()

        data = response.json()
        return data.get("response", "")

    except Exception as e:
        return f"Error calling Ollama: {str(e)}"