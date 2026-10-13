from rest_framework import serializers

from .models import Vote


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
