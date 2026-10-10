#!/bin/bash
# 새 맥에서 로컬 도우미(127.0.0.1:4180)를 자동으로 켜지게 한다.
# 맥을 켜거나 로그인하면 바로 시작, 꺼지면 다시 켜준다 (launchd).
#   설치:  bash helper-autostart.sh
#   해제:  bash helper-autostart.sh uninstall
# 도우미 폴더 위치가 다르면: HELPER_DIR=/경로 bash helper-autostart.sh
set -euo pipefail

HELPER_DIR="${HELPER_DIR:-$HOME/claude_workspace/homt-delivery-helper}"
LABEL="kr.co.hometraders.helper"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/Library/Logs/homt-helper"

if [ "${1:-}" = "uninstall" ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "자동 실행을 껐어요."
  exit 0
fi

[ -f "$HELPER_DIR/server.py" ] || { echo "도우미 폴더가 없어요: $HELPER_DIR (예전 맥에서 먼저 옮겨주세요)"; exit 1; }
[ -f "$HELPER_DIR/.env" ] || echo "주의: $HELPER_DIR/.env 가 없어요 — AI 판독·이카운트 등록이 안 돼요. 예전 맥의 .env 를 복사해 주세요."

# 파이썬 — 처음 쓰는 맥이면 개발자 도구 설치 창이 뜬다. 설치 끝나고 다시 실행.
if ! python3 --version >/dev/null 2>&1; then
  echo "python3 가 아직 없어요. 뜨는 창에서 '설치'를 누르고, 끝나면 이 스크립트를 다시 실행해 주세요."
  xcode-select --install 2>/dev/null || true
  exit 1
fi

# 도우미 전용 가상환경 — 시스템 파이썬을 건드리지 않는다
cd "$HELPER_DIR"
[ -x .venv/bin/python ] || python3 -m venv .venv
if [ -f requirements.txt ]; then
  .venv/bin/python -m pip install -q --upgrade pip
  .venv/bin/python -m pip install -q -r requirements.txt
else
  echo "requirements.txt 가 없어요 — 도우미가 쓰는 패키지가 있으면 '.venv/bin/pip install 이름' 으로 넣어주세요."
fi

mkdir -p "$LOG_DIR" "$(dirname "$PLIST")"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$HELPER_DIR/.venv/bin/python</string>
    <string>$HELPER_DIR/server.py</string>
  </array>
  <key>WorkingDirectory</key><string>$HELPER_DIR</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>LANG</key><string>ko_KR.UTF-8</string>
    <key>PYTHONUNBUFFERED</key><string>1</string>
  </dict>
  <key>StandardOutPath</key><string>$LOG_DIR/out.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/err.log</string>
</dict>
</plist>
PL

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

sleep 3
if curl -fsS http://127.0.0.1:4180/api/health >/dev/null 2>&1; then
  echo "✅ 도우미가 켜졌어요. 이제 맥을 켤 때마다 자동으로 켜져요."
else
  echo "⚠️ 아직 응답이 없어요. 오류 기록: tail -50 $LOG_DIR/err.log"
fi
