from django.db import models
from django.utils import timezone


class PollQuerySet(models.QuerySet):
    def visible_to_public(self):
        return self.exclude(status=Poll.Status.DRAFT)

    def close_expired(self):
        """Close every open poll whose timer has run out.

        Polls are closed lazily (whenever they are read) instead of by a
        background scheduler, which keeps the deployment to a single process.
        """
        now = timezone.now()
        return self.filter(status=Poll.Status.OPEN, closes_at__lte=now).update(
            status=Poll.Status.CLOSED, updated_at=now
        )


class Poll(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        OPEN = "open", "Aberta"
        CLOSED = "closed", "Fechada"

    # Status can only move forward: Draft -> Open -> Closed.
    ALLOWED_TRANSITIONS = {
        Status.DRAFT: {Status.OPEN},
        Status.OPEN: {Status.CLOSED},
        Status.CLOSED: set(),
    }

    question = models.CharField(max_length=200)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    show_live_results = models.BooleanField(default=False)
    closes_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PollQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.question

    def can_transition_to(self, new_status):
        return new_status in self.ALLOWED_TRANSITIONS[self.status]

    @property
    def is_open(self):
        return self.status == self.Status.OPEN

    @property
    def results_are_public(self):
        return self.status == self.Status.CLOSED or (self.is_open and self.show_live_results)


class Option(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=100)
    position = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(
                fields=["poll", "position"], name="unique_option_position_per_poll"
            ),
        ]

    def __str__(self):
        return self.text
