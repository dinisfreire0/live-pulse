from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from polls.models import Poll, Vote
from polls.services import create_poll

TOKEN = "voter-token-1"


class PollTestCase(APITestCase):
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


class HostPollTests(PollTestCase):
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

        self.assertEqual(self.client.patch(url, {"status": "closed"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(url, {"status": "open"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(url, {"status": "closed"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(url, {"status": "open"}, format="json").status_code, 400)

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


class PublicPollTests(PollTestCase):
    def test_drafts_are_hidden(self):
        draft = self.make_poll(Poll.Status.DRAFT)
        self.make_poll(Poll.Status.OPEN)
        self.make_poll(Poll.Status.CLOSED)

        self.assertEqual(len(self.client.get(reverse("poll-list")).data), 2)
        self.assertEqual(self.client.get(reverse("poll-detail", args=[draft.pk])).status_code, 404)

    def test_vote_is_recorded(self):
        poll = self.make_poll()
        response = self.vote(poll)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vote.objects.count(), 1)

        detail = self.client.get(reverse("poll-detail", args=[poll.pk]), HTTP_X_VOTER_TOKEN=TOKEN)
        self.assertTrue(detail.data["has_voted"])

    def test_one_vote_per_person(self):
        poll = self.make_poll()
        self.vote(poll)
        response = self.vote(poll, option=poll.options.last())
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(self.vote(poll, token="another-voter").status_code, 201)

    def test_votes_rejected_when_not_open(self):
        closed = self.make_poll(Poll.Status.CLOSED)
        draft = self.make_poll(Poll.Status.DRAFT)
        self.assertEqual(self.vote(closed).status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(self.vote(draft).status_code, status.HTTP_404_NOT_FOUND)

    def test_option_from_another_poll_is_rejected(self):
        poll = self.make_poll()
        other = self.make_poll()
        response = self.vote(poll, option=other.options.first())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("option_id", response.data)

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
