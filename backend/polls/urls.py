from django.urls import path

from . import views

urlpatterns = [
    # Audience
    path("polls/", views.PublicPollListView.as_view(), name="poll-list"),
    path("polls/<int:pk>/", views.PublicPollDetailView.as_view(), name="poll-detail"),
    path("polls/<int:pk>/results/", views.PublicPollResultsView.as_view(), name="poll-results"),
    path("polls/<int:pk>/stream/", views.public_poll_stream, name="poll-stream"),
    # Host
    path("host/polls/", views.HostPollListView.as_view(), name="host-poll-list"),
    path("host/polls/<int:pk>/", views.HostPollDetailView.as_view(), name="host-poll-detail"),
    path(
        "host/polls/<int:pk>/results/",
        views.HostPollResultsView.as_view(),
        name="host-poll-results",
    ),
    path("host/polls/<int:pk>/stream/", views.host_poll_stream, name="host-poll-stream"),
]
