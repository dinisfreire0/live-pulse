from rest_framework import serializers

from .models import Option, Poll, Vote
from .services import get_results

MIN_OPTIONS = 2
MAX_OPTIONS = 5
MIN_DURATION_SECONDS = 10
MAX_DURATION_SECONDS = 24 * 60 * 60


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id", "text"]


# --- Host -------------------------------------------------------------------


class HostPollListSerializer(serializers.ModelSerializer):
    total_votes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Poll
        fields = [
            "id",
            "question",
            "status",
            "show_live_results",
            "closes_at",
            "created_at",
            "total_votes",
        ]


class HostPollDetailSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    results = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id",
            "question",
            "status",
            "show_live_results",
            "closes_at",
            "created_at",
            "options",
            "results",
        ]

    def get_results(self, poll):
        return get_results(poll)


class PollCreateSerializer(serializers.Serializer):
    question = serializers.CharField(
        max_length=200,
        error_messages={
            "blank": "A pergunta não pode estar vazia.",
            "required": "A pergunta é obrigatória.",
            "max_length": "A pergunta não pode ter mais de 200 caracteres.",
        },
    )
    options = serializers.ListField(
        child=serializers.CharField(
            max_length=100,
            error_messages={
                "blank": "As opções não podem estar vazias.",
                "max_length": "Cada opção pode ter no máximo 100 caracteres.",
            },
        ),
        error_messages={"required": "As opções são obrigatórias."},
    )

    def validate_options(self, options):
        if not MIN_OPTIONS <= len(options) <= MAX_OPTIONS:
            raise serializers.ValidationError(
                f"Uma votação precisa de entre {MIN_OPTIONS} e {MAX_OPTIONS} opções."
            )
        normalized = [text.casefold() for text in options]
        if len(set(normalized)) != len(normalized):
            raise serializers.ValidationError("As opções não podem ser repetidas.")
        return options


class PollUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Poll.Status.choices,
        required=False,
        error_messages={"invalid_choice": "Estado inválido: «{input}»."},
    )
    show_live_results = serializers.BooleanField(required=False)
    duration_seconds = serializers.IntegerField(
        required=False,
        min_value=MIN_DURATION_SECONDS,
        max_value=MAX_DURATION_SECONDS,
        error_messages={
            "min_value": f"O temporizador tem de ter pelo menos {MIN_DURATION_SECONDS} segundos.",
            "max_value": "O temporizador não pode passar de 24 horas.",
        },
    )

    def validate_status(self, status):
        poll = self.instance
        if status != poll.status and not poll.can_transition_to(status):
            raise serializers.ValidationError(
                f"Não é possível passar de «{poll.get_status_display()}» "
                f"para «{Poll.Status(status).label}»."
            )
        return status

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Nada para atualizar.")
        resulting_status = attrs.get("status", self.instance.status)
        if "duration_seconds" in attrs and resulting_status != Poll.Status.OPEN:
            raise serializers.ValidationError(
                {"duration_seconds": "O temporizador só pode ser definido numa votação aberta."}
            )
        return attrs


# --- Public -----------------------------------------------------------------


class PublicPollListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poll
        fields = ["id", "question", "status", "closes_at", "created_at"]


class PublicPollDetailSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    results = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id",
            "question",
            "status",
            "show_live_results",
            "closes_at",
            "created_at",
            "options",
            "results",
        ]

    def get_results(self, poll):
        # Hidden while the poll is open, so the audience is not influenced,
        # unless the host explicitly enabled live results.
        return get_results(poll) if poll.results_are_public else None


class VoteReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ["id", "option_id", "created_at"]


class VoteCreateSerializer(serializers.Serializer):
    option_id = serializers.IntegerField(
        error_messages={"required": "Escolhe uma opção.", "invalid": "Opção inválida."}
    )
    voter_token = serializers.CharField(
        min_length=8,
        max_length=64,
        error_messages={
            "required": "Falta o identificador do participante.",
            "blank": "Falta o identificador do participante.",
            "min_length": "Identificador do participante inválido.",
            "max_length": "Identificador do participante inválido.",
        },
    )

    def validate_option_id(self, option_id):
        poll = self.context["poll"]
        option = poll.options.filter(pk=option_id).first()
        if option is None:
            raise serializers.ValidationError("Opção inválida para esta votação.")
        return option
