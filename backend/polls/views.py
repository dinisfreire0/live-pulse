from django.db.models import Count
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from votes.services import has_voted

from . import services
from .models import Poll
from .serializers import (
    HostPollDetailSerializer,
    HostPollListSerializer,
    PollCreateSerializer,
    PollUpdateSerializer,
    PublicPollDetailSerializer,
    PublicPollListSerializer,
)
from .sse import poll_snapshots, sse_response

VOTER_TOKEN_HEADER = "X-Voter-Token"


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
        return Response(HostPollDetailSerializer(services.get_host_poll(pk)).data)

    def patch(self, request, pk):
        poll = services.get_host_poll(pk)
        serializer = PollUpdateSerializer(poll, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        services.update_poll(poll, **serializer.validated_data)
        return Response(HostPollDetailSerializer(poll).data)


class HostPollResultsView(APIView):
    def get(self, request, pk):
        return Response(services.get_results(services.get_host_poll(pk)))


@require_GET
def host_poll_stream(request, pk):
    services.get_host_poll(pk)
    return sse_response(poll_snapshots(pk, lambda poll: HostPollDetailSerializer(poll).data))


# --- Public -----------------------------------------------------------------


class PublicPollListView(APIView):
    def get(self, request):
        Poll.objects.close_expired()
        polls = Poll.objects.visible_to_public()
        return Response(PublicPollListSerializer(polls, many=True).data)


class PublicPollDetailView(APIView):
    def get(self, request, pk):
        poll = services.get_public_poll(pk)
        data = PublicPollDetailSerializer(poll).data
        data["has_voted"] = has_voted(poll, request.headers.get(VOTER_TOKEN_HEADER))
        return Response(data)


class PublicPollResultsView(APIView):
    def get(self, request, pk):
        poll = services.get_public_poll(pk)
        if not poll.results_are_public:
            return Response(
                {"detail": "Os resultados só ficam disponíveis quando a votação fechar."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(services.get_results(poll))


@require_GET
def public_poll_stream(request, pk):
    services.get_public_poll(pk)
    return sse_response(poll_snapshots(pk, lambda poll: PublicPollDetailSerializer(poll).data))
