from django.db import IntegrityError, transaction

from .models import Vote


class AlreadyVoted(Exception):
    pass


class PollNotOpen(Exception):
    pass


def cast_vote(poll, option, voter_token):
    if not poll.is_open:
        raise PollNotOpen
    try:
        with transaction.atomic():
            return Vote.objects.create(poll=poll, option=option, voter_token=voter_token)
    except IntegrityError as exc:
        raise AlreadyVoted from exc


def has_voted(poll, voter_token):
    return bool(voter_token) and poll.votes.filter(voter_token=voter_token).exists()
