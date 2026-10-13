from django.urls import path

from . import views

urlpatterns = [
    path("polls/<int:pk>/votes/", views.VoteCreateView.as_view(), name="poll-votes"),
]
