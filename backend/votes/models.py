from django.db import models


class Vote(models.Model):
    poll = models.ForeignKey("polls.Poll", on_delete=models.CASCADE, related_name="votes")
    option = models.ForeignKey("polls.Option", on_delete=models.CASCADE, related_name="votes")
    voter_token = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["poll", "voter_token"], name="one_vote_per_voter_per_poll"
            ),
        ]

    def __str__(self):
        return f"{self.option} ({self.created_at:%H:%M:%S})"
