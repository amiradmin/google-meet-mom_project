from django.contrib import admin
from .models import Meeting


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'transcript_length', 'minutes_length')
    list_filter = ('created_at',)
    search_fields = ('title', 'transcript', 'minutes')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def transcript_length(self, obj):
        return f"{len(obj.transcript)} chars"

    transcript_length.short_description = 'Transcript Size'

    def minutes_length(self, obj):
        return f"{len(obj.minutes)} chars"

    minutes_length.short_description = 'Minutes Size'