#!/bin/bash
# =============================================================
# FinTrack - Supabase Keep-Alive Script
# 
# Sends a lightweight query to the Supabase project to prevent
# the free-tier project from being paused after 7 days of
# inactivity.
#
# Usage:
#   ./scripts/supabase-keep-alive.sh
#
# Required environment variables:
#   SUPABASE_URL      - Your Supabase project URL
#   SUPABASE_ANON_KEY - Your Supabase anon/public key
# =============================================================

set -e

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set."
  echo "   export SUPABASE_URL=https://your-project.supabase.co"
  echo "   export SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi

echo "🔋 FinTrack Supabase Keep-Alive"
echo "   URL: $SUPABASE_URL"
echo "   Time: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

# ─── Ping 1: Health check via REST API ────────────────────────
echo "① Pinging REST API…"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  --max-time 10 2>/dev/null || echo "000")

echo "   HTTP status: $HTTP_STATUS"

# ─── Ping 2: Lightweight RPC call (get_or_create_profile) ─────
# Use a fixed keep-alive UUID so we don't pollute the database
PING_UUID="00000000-0000-0000-0000-000000000001"

echo "② Calling RPC get_or_create_profile…"
RPC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/rest/v1/rpc/get_or_create_profile" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "{\"p_id\": \"${PING_UUID}\"}" \
  --max-time 10 2>/dev/null || echo "000")

echo "   HTTP status: $RPC_STATUS"

# ─── Ping 3: Auth settings (light public endpoint) ────────────
echo "③ Fetching auth settings…"
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/auth/v1/settings" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  --max-time 10 2>/dev/null || echo "000")

echo "   HTTP status: $AUTH_STATUS"

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "✅ Keep-alive completed!"
echo "   REST API:     $HTTP_STATUS"
echo "   RPC call:     $RPC_STATUS"
echo "   Auth settings: $AUTH_STATUS"
