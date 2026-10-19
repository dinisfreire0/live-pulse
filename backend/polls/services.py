from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Option, Poll


def get_host_poll(pk):
    Poll.objects.close_expired()
    return get_object_or_404(Poll.objects.prefetch_related("options"), pk=pk)


def get_public_poll(pk):
    Poll.objects.close_expired()
    return get_object_or_404(Poll.objects.visible_to_public().prefetch_related("options"), pk=pk)


@transaction.atomic
def create_poll(question, options):
    poll = Poll.objects.create(question=question)
    Option.objects.bulk_create(
        Option(poll=poll, text=text, position=index) for index, text in enumerate(options)
    )
    return poll


def update_poll(poll, status=None, show_live_results=None, duration_seconds=None):
    if status is not None and status != poll.status:
        poll.status = status
        if status == Poll.Status.CLOSED:
            poll.closes_at = None
    if show_live_results is not None:
        poll.show_live_results = show_live_results
    if duration_seconds is not None:
        poll.closes_at = timezone.now() + timezone.timedelta(seconds=duration_seconds)
    poll.save()
    return poll


def get_results(poll):
    options = poll.options.annotate(vote_count=Count("votes")).order_by("position")
    total = sum(option.vote_count for option in options)
    return {
        "total_votes": total,
        "options": [
            {
                "id": option.id,
                "text": option.text,
                "votes": option.vote_count,
                "percentage": round(option.vote_count * 100 / total, 1) if total else 0,
            }
            for option in options
        ],
    }


def change_signature(poll):
    return (poll.status, poll.show_live_results, poll.closes_at, poll.votes.count())
