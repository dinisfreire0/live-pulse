from django.contrib import admin

from .models import Option, Poll


class OptionInline(admin.TabularInline):
    model = Option
    extra = 0


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ["question", "status", "show_live_results", "created_at"]
    list_filter = ["status"]
    inlines = [OptionInline]
