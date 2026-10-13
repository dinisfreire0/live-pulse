from django.contrib import admin

from .models import Vote


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["poll", "option", "created_at"]
    list_filter = ["poll"]
