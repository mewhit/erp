#!/bin/sh
set -eu

node_modules/.bin/tsx http-server/src/main.ts &
api_pid="$!"
caddy_pid=""

shutdown() {
	if [ -n "$api_pid" ]; then
		kill "$api_pid" 2>/dev/null || true
	fi

	if [ -n "$caddy_pid" ]; then
		kill "$caddy_pid" 2>/dev/null || true
	fi
}

trap shutdown INT TERM

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy_pid="$!"

while true; do
	if ! kill -0 "$api_pid" 2>/dev/null; then
		set +e
		wait "$api_pid"
		exit_code="$?"
		set -e
		shutdown
		exit "$exit_code"
	fi

	if ! kill -0 "$caddy_pid" 2>/dev/null; then
		set +e
		wait "$caddy_pid"
		exit_code="$?"
		set -e
		shutdown
		exit "$exit_code"
	fi

	sleep 1
done
