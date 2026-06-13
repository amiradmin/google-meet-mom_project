import requests

OLLAMA_URL = "http://ollama:11434/api/generate"


def ask_ollama(prompt: str, model: str = "llama3.1"):
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