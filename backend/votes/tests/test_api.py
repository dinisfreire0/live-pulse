from rest_framework import status

from polls.models import Poll
from polls.tests.helpers import PollAPITestCase
from votes.models import Vote


class VoteTests(PollAPITestCase):
    def test_vote_is_recorded(self):
        poll = self.make_poll()
        response = self.vote(poll)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["detail"], "Obrigado, o teu voto foi registado!")
        self.assertEqual(Vote.objects.get().option, poll.options.first())

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
