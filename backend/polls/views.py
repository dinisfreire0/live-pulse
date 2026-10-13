from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Poll
from .serializers import (
    HostPollDetailSerializer,
    HostPollListSerializer,
    PollCreateSerializer,
    PollUpdateSerializer,
    PublicPollDetailSerializer,
    PublicPollListSerializer,
    VoteCreateSerializer,
    VoteReceiptSerializer,
)
from .sse import poll_snapshots, sse_response

VOTER_TOKEN_HEADER = "X-Voter-Token"


def get_host_poll(pk):
    Poll.objects.close_expired()
    return get_object_or_404(Poll.objects.prefetch_related("options"), pk=pk)


def get_public_poll(pk):
    """Drafts do not exist as far as the audience is concerned (404)."""
    Poll.objects.close_expired()
    return get_object_or_404(
        Poll.objects.visible_to_public().prefetch_related("options"), pk=pk
    )


# --- Host -------------------------------------------------------------------


class HostPollListView(APIView):
    def get(self, request):
        Poll.objects.close_expired()
        # Meta.ordering is ignored by aggregate (GROUP BY) queries, so repeat it.
        polls = Poll.objects.annotate(total_votes=Count("votes")).order_by(*Poll._meta.ordering)
        return Response(HostPollListSerializer(polls, many=True).data)

    def post(self, request):
        serializer = PollCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        poll = services.create_poll(**serializer.validated_data)
        return Response(HostPollDetailSerializer(poll).data, status=status.HTTP_201_CREATED)


class HostPollDetailView(APIView):
    def get(self, request, pk):
        return Response(HostPollDetailSerializer(get_host_poll(pk)).data)

    def patch(self, request, pk):
        poll = get_host_poll(pk)
        serializer = PollUpdateSerializer(poll, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        services.update_poll(poll, **serializer.validated_data)
        return Response(HostPollDetailSerializer(poll).data)


class HostPollResultsView(APIView):
    def get(self, request, pk):
        return Response(services.get_results(get_host_poll(pk)))


@require_GET
def host_poll_stream(request, pk):
    get_host_poll(pk)
    return sse_response(
        poll_snapshots(pk, lambda poll: HostPollDetailSerializer(poll).data)
    )


# --- Public -----------------------------------------------------------------


class PublicPollListView(APIView):
    def get(self, request):
        Poll.objects.close_expired()
        polls = Poll.objects.visible_to_public()
        return Response(PublicPollListSerializer(polls, many=True).data)


class PublicPollDetailView(APIView):
    def get(self, request, pk):
        poll = get_public_poll(pk)
        data = PublicPollDetailSerializer(poll).data
        data["has_voted"] = services.has_voted(poll, request.headers.get(VOTER_TOKEN_HEADER))
        return Response(data)


class PublicPollResultsView(APIView):
    def get(self, request, pk):
        poll = get_public_poll(pk)
        if not poll.results_are_public:
            return Response(
                {"detail": "Os resultados só ficam disponíveis quando a votação fechar."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(services.get_results(poll))


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


@require_GET
def public_poll_stream(request, pk):
    get_public_poll(pk)
    return sse_response(
        poll_snapshots(pk, lambda poll: PublicPollDetailSerializer(poll).data)
    )
