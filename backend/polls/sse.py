"""Server-Sent Events helpers.

Each stream re-reads a poll once per second and pushes a new snapshot only
when its fingerprint (status, live flag, timer, vote count) changes. Polling
the database server-side keeps this to plain Django with no message broker;
the browser still gets a push, and EventSource reconnects on its own.
"""

import json
import time

from django.http import StreamingHttpResponse

from .models import Poll
from .services import change_signature

CHECK_INTERVAL_SECONDS = 1
HEARTBEAT_SECONDS = 15
# Recycle long-lived connections so a forgotten tab does not hold a worker
# thread forever; the browser reconnects transparently.
MAX_STREAM_SECONDS = 5 * 60


def _format_event(data, event=None):
    lines = [f"event: {event}"] if event else []
    lines.append(f"data: {json.dumps(data, default=str)}")
    return "\n".join(lines) + "\n\n"


def poll_snapshots(poll_id, build_payload):
    yield "retry: 2000\n\n"
    started = last_sent = time.monotonic()
    last_signature = None

    while time.monotonic() - started < MAX_STREAM_SECONDS:
        Poll.objects.close_expired()
        poll = Poll.objects.filter(pk=poll_id).first()
        if poll is None:
            yield _format_event({}, event="deleted")
            return

        signature = change_signature(poll)
        now = time.monotonic()
        if signature != last_signature:
            last_signature = signature
            last_sent = now
            yield _format_event(build_payload(poll))
        elif now - last_sent >= HEARTBEAT_SECONDS:
            last_sent = now
            yield ": keepalive\n\n"

        time.sleep(CHECK_INTERVAL_SECONDS)


def sse_response(events):
    response = StreamingHttpResponse(events, content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response
