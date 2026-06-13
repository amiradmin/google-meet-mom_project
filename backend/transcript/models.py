from django.db import models

class Meeting(models.Model):
    title = models.CharField(max_length=200)
    transcript = models.TextField()
    minutes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)