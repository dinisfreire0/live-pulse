from django.urls import reverse
from rest_framework.test import APITestCase

from polls.models import Poll
from polls.services import create_poll

TOKEN = "voter-token-1"


class PollAPITestCase(APITestCase):
    """Shared helpers for API tests in the polls and votes apps."""

    def make_poll(self, status=Poll.Status.OPEN, options=("Sim", "Não"), **fields):
        poll = create_poll("Gostas de pizza?", list(options))
        Poll.objects.filter(pk=poll.pk).update(status=status, **fields)
        poll.refresh_from_db()
        return poll

    def vote(self, poll, option=None, token=TOKEN):
        option = option or poll.options.first()
        return self.client.post(
            reverse("poll-votes", args=[poll.pk]),
            {"option_id": option.pk, "voter_token": token},
            format="json",
        )
