from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from polls.services import get_public_poll

from . import services
from .serializers import VoteCreateSerializer, VoteReceiptSerializer


class VoteCreateView(APIView):
    def post(self, request, pk):
        poll = get_public_poll(pk)
        serializer = VoteCreateSerializer(data=request.data, context={"poll": poll})
        serializer.is_valid(raise_exception=True)
        try:
            vote = services.cast_vote(
                poll,
                serializer.validated_data["option_id"],
                serializer.validated_data["voter_token"],
            )
        except services.PollNotOpen:
            return Response(
                {"detail": "Esta votação não está aberta a votos."},
                status=status.HTTP_409_CONFLICT,
            )
        except services.AlreadyVoted:
            return Response(
                {"detail": "Já votaste nesta votação."},
                status=status.HTTP_409_CONFLICT,
            )
        receipt = VoteReceiptSerializer(vote).data
        receipt["detail"] = "Obrigado, o teu voto foi registado!"
        return Response(receipt, status=status.HTTP_201_CREATED)
