from django.urls import reverse
from rest_framework import status

from polls.models import Poll

from .helpers import TOKEN, PollAPITestCase


class PublicPollTests(PollAPITestCase):
    def test_drafts_are_hidden(self):
        draft = self.make_poll(Poll.Status.DRAFT)
        self.make_poll(Poll.Status.OPEN)
        self.make_poll(Poll.Status.CLOSED)

        self.assertEqual(len(self.client.get(reverse("poll-list")).data), 2)
        self.assertEqual(self.client.get(reverse("poll-detail", args=[draft.pk])).status_code, 404)

    def test_results_hidden_until_closed(self):
        poll = self.make_poll()
        self.assertEqual(self.client.get(reverse("poll-results", args=[poll.pk])).status_code, 403)
        self.assertIsNone(self.client.get(reverse("poll-detail", args=[poll.pk])).data["results"])

        poll.status = Poll.Status.CLOSED
        poll.save()
        self.assertEqual(self.client.get(reverse("poll-results", args=[poll.pk])).status_code, 200)

    def test_live_results_when_enabled_by_host(self):
        poll = self.make_poll(show_live_results=True)
        response = self.client.get(reverse("poll-results", args=[poll.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_detail_reports_whether_this_voter_already_voted(self):
        poll = self.make_poll()
        url = reverse("poll-detail", args=[poll.pk])
        self.assertFalse(self.client.get(url, HTTP_X_VOTER_TOKEN=TOKEN).data["has_voted"])

        self.vote(poll)
        self.assertTrue(self.client.get(url, HTTP_X_VOTER_TOKEN=TOKEN).data["has_voted"])
        self.assertFalse(self.client.get(url).data["has_voted"])
