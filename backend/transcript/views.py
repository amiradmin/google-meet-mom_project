from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from ai.services import generate_meeting_summary, ollama_service
import json
import os
import re
from datetime import datetime

# Simple in-memory storage
transcript_store = []


def is_real_caption(text):
    """Check if text is a real caption, not UI element"""
    if not text or len(text) < 2:
        return False

    # ALWAYS capture Persian text (this is your spoken words)
    has_persian = any(ord(c) >= 0x0600 and ord(c) <= 0x06FF for c in text)
    if has_persian:
        return True

    # UI elements to filter out (English only)
    ui_keywords = [
        'cast', 'expand_less', 'expand_more', 'mic_none', 'videocam',
        'mood', 'back_hand', 'arrow_drop_down', 'keyboard_arrow_up',
        'computer_arrow_up', 'exclamation', 'default', 'companion',
        'looking for others', 'no one else is here', 'use companion mode',
        'frame_person', 'visual_effects', 'more_vert',
        'font', 'color', 'settings', 'language', 'format_size', 'circle',
        'caption', 'microphone', 'camera', 'join', 'leave', 'copy link',
        'add others', 'meeting', 'press', 'button', 'open caption'
    ]

    lower_text = text.lower().strip()

    # Check if it's a UI element
    for keyword in ui_keywords:
        if keyword in lower_text or lower_text == keyword:
            return False

    # Capture English sentences (multiple words)
    if len(text.split()) >= 2 and len(text) > 5:
        return True

    return False


class TranscriptView(APIView):
    def post(self, request):
        global transcript_store
        text = request.data.get("text")

        print("=" * 80)
        print(f"📝 NEW CAPTION RECEIVED at {datetime.now().strftime('%H:%M:%S')}")
        print(f"📄 Text: {text}")

        # Check for Persian text
        has_persian = any(ord(c) >= 0x0600 and ord(c) <= 0x06FF for c in text) if text else False

        if has_persian:
            print(f"🇮🇷 PERSIAN TEXT DETECTED! This is your spoken words!")

        # Check if it's a real caption
        is_valid = is_real_caption(text)

        if text and is_valid and len(text) > 2:
            transcript_store.append(text)
            print(f"✅ CAPTURE SUCCESSFUL - Total: {len(transcript_store)}")
            print(f"💾 Stored: {text}")
            if has_persian:
                print(f"🎉 PERSIAN VOICE CAPTURED: {text}")
            print(f"📋 All captions: {transcript_store}")
        elif text:
            print(f"🚫 FILTERED OUT: {text}")
        else:
            print(f"⚠️ Empty or invalid text received")

        print("=" * 80)

        return Response(
            {"status": "ok", "received": text, "total": len(transcript_store)},
            status=status.HTTP_200_OK
        )

    def get(self, request):
        """Get all transcripts for current session"""
        global transcript_store
        return Response({
            "total": len(transcript_store),
            "transcripts": transcript_store,
            "full_text": "\n".join(transcript_store)
        })


class SummaryView(APIView):

    def get(self, request):
        """Get current transcript"""
        global transcript_store
        full_transcript = "\n".join(transcript_store)
        print(f"📋 Current session has {len(transcript_store)} captions")
        return Response({
            "transcript": full_transcript,
            "total_captions": len(transcript_store),
            "captions": transcript_store
        })

    def post(self, request):
        """Generate MoM using Ollama"""
        global transcript_store

        print("=" * 80)
        print(f"📋 GENERATING MINUTES OF MEETING at {datetime.now().strftime('%H:%M:%S')}")
        print(f"📊 Current session has {len(transcript_store)} captions")
        print(f"📋 Captions: {transcript_store}")

        if not transcript_store or len(transcript_store) == 0:
            print("❌ No captions in store")
            return Response({
                "error": "No transcript available. Please capture some captions first.",
                "suggestion": "Make sure captions are enabled in Google Meet and you are speaking.",
                "total_captions": 0
            }, status=status.HTTP_400_BAD_REQUEST)

        transcript = "\n".join(transcript_store)
        print(f"📝 Using stored transcript from {len(transcript_store)} captions")
        print(f"📝 Transcript length: {len(transcript)} characters")
        print(f"📝 Full transcript:\n{transcript}")
        print("=" * 80)

        print("🔍 Checking Ollama connection...")
        is_healthy, health_message = ollama_service.check_health()

        if not is_healthy:
            print(f"❌ Ollama not ready: {health_message}")
            return Response({
                "error": f"Ollama is not ready: {health_message}",
                "summary": f"Unable to generate summary. {health_message}"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        print(f"✅ {health_message}")
        print("🔄 Generating summary with Ollama (this may take 30-60 seconds)...")

        result = generate_meeting_summary(transcript)

        print("=" * 80)
        print(f"✅ MoM GENERATION COMPLETE at {datetime.now().strftime('%H:%M:%S')}")
        print(f"📄 Summary length: {len(result)} characters")
        print("=" * 80)

        return Response({
            "summary": result,
            "total_captions": len(transcript_store),
            "status": "success",
            "model_used": settings.OLLAMA_MODEL
        })

    def delete(self, request):
        """Clear transcript store"""
        global transcript_store
        count = len(transcript_store)
        transcript_store = []
        print("=" * 80)
        print(f"🧹 TRANSCRIPT STORE CLEARED at {datetime.now().strftime('%H:%M:%S')}")
        print(f"📊 Removed {count} captions")
        print("=" * 80)
        return Response({
            "status": "cleared",
            "cleared_count": count,
            "message": f"Successfully cleared {count} captions"
        })


class OllamaStatusView(APIView):
    def get(self, request):
        global transcript_store
        is_healthy, message = ollama_service.check_health()
        return Response({
            "status": "healthy" if is_healthy else "unhealthy",
            "message": message,
            "model": settings.OLLAMA_MODEL,
            "ollama_host": settings.OLLAMA_HOST,
            "total_captions": len(transcript_store),
            "current_captions": transcript_store
        })