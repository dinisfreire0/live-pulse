from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from polls.models import Poll

from .helpers import PollAPITestCase


class HostPollTests(PollAPITestCase):
    def test_create_poll(self):
        response = self.client.post(
            reverse("host-poll-list"),
            {"question": "Qual a melhor linguagem?", "options": ["Python", "TypeScript"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "draft")
        self.assertEqual([o["text"] for o in response.data["options"]], ["Python", "TypeScript"])

    def test_create_poll_validation(self):
        cases = [
            ({"question": "  ", "options": ["a", "b"]}, "question"),
            ({"question": "Q?", "options": ["a"]}, "options"),
            ({"question": "Q?", "options": ["a", "b", "c", "d", "e", "f"]}, "options"),
            ({"question": "Q?", "options": ["a", ""]}, "options"),
            ({"question": "Q?", "options": ["Sim", "sim"]}, "options"),
        ]
        for payload, field in cases:
            with self.subTest(payload=payload):
                response = self.client.post(reverse("host-poll-list"), payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_host_lists_all_polls_including_drafts(self):
        self.make_poll(Poll.Status.DRAFT)
        self.make_poll(Poll.Status.OPEN)
        response = self.client.get(reverse("host-poll-list"))
        self.assertEqual(len(response.data), 2)

    def test_host_list_is_newest_first_with_vote_totals(self):
        older = self.make_poll()
        newer = self.make_poll()
        self.vote(older)
        response = self.client.get(reverse("host-poll-list"))
        self.assertEqual([p["id"] for p in response.data], [newer.pk, older.pk])
        self.assertEqual(response.data[1]["total_votes"], 1)

    def test_status_moves_forward_only(self):
        poll = self.make_poll(Poll.Status.DRAFT)
        url = reverse("host-poll-detail", args=[poll.pk])
        steps = [("closed", 400), ("open", 200), ("closed", 200), ("open", 400)]

        for new_status, expected_code in steps:
            with self.subTest(new_status=new_status):
                response = self.client.patch(url, {"status": new_status}, format="json")
                self.assertEqual(response.status_code, expected_code)

    def test_host_sees_results_while_open(self):
        poll = self.make_poll()
        self.vote(poll)
        response = self.client.get(reverse("host-poll-results", args=[poll.pk]))
        self.assertEqual(response.data["total_votes"], 1)
        self.assertEqual(response.data["options"][0]["percentage"], 100)

    def test_timer_closes_poll(self):
        poll = self.make_poll(Poll.Status.DRAFT)
        url = reverse("host-poll-detail", args=[poll.pk])
        response = self.client.patch(url, {"status": "open", "duration_seconds": 60}, format="json")
        self.assertIsNotNone(response.data["closes_at"])

        Poll.objects.filter(pk=poll.pk).update(closes_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.get(url).data["status"], "closed")

    def test_timer_requires_open_poll(self):
        poll = self.make_poll(Poll.Status.DRAFT)
        response = self.client.patch(
            reverse("host-poll-detail", args=[poll.pk]), {"duration_seconds": 60}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
