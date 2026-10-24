#!/usr/bin/env bash
# android-smoke.sh: device smoke test for the PES Android app (Capacitor 8, UI in a WebView).
#
# Usage:  android-smoke.sh <apk> <outdir>
#
# Needs a booted device/emulator reachable by adb (set ANDROID_SERIAL if several are attached),
# adb on PATH or under $ANDROID_HOME/platform-tools, and GNU coreutils (timeout, date +%N).
# Every step logs PASS/FAIL/SKIP; <outdir> gets numbered screenshots + uiautomator dumps,
# smoke.log, logcat.txt and summary.md. Exit code: 0 all passed, 1 a step failed, 2 bad usage.
#
# Step functions are called indirectly (run_step "$fn", traps), which shellcheck cannot follow:
# shellcheck disable=SC2329
set -Eeuo pipefail
shopt -s nocasematch   # all UI regexes below match case-insensitively

# ---------------------------------------------------------------------------------------------
# UI strings the test waits for or taps. POSIX extended regexes (case-insensitive), matched
# against the trimmed `text` or `content-desc` of nodes in the app window. Update them here
# when the UI copy changes, or override any of them with an environment variable.
# ---------------------------------------------------------------------------------------------
TXT_ONB_START=${TXT_ONB_START:-'^Get started'}                 # first onboarding button; proves the WebView rendered
TXT_ONB_NAME_FIELD=${TXT_ONB_NAME_FIELD:-'^android\.widget\.EditText$'}  # name input: matched against the node CLASS
TXT_ONB_CONTINUE=${TXT_ONB_CONTINUE:-'^Continue'}              # "About you" step button (enabled once a name is typed)
TXT_ONB_SKIP=${TXT_ONB_SKIP:-'^Continue without AI'}           # "AI key" step: continue without a key
TXT_HOME_MARK=${TXT_HOME_MARK:-'^Today$'}                      # heading shown only on the home screen
TXT_APP_TITLE=${TXT_APP_TITLE:-'^PES$'}                        # title a native ActionBar would show (must be absent)
ONB_NAME=${ONB_NAME:-Smoke}                                    # typed via `input text`: letters only

# ---------------------------------------------------------------------------------------------
# App and test settings
# ---------------------------------------------------------------------------------------------
PKG=io.github.helgurkonungson.pes
ACTIVITY=.MainActivity
BOOT_TIMEOUT=${BOOT_TIMEOUT:-300}      # s, wait for sys.boot_completed
RENDER_TIMEOUT=${RENDER_TIMEOUT:-60}   # s, wait for the first web UI after launch
STEP_TIMEOUT=${STEP_TIMEOUT:-30}       # s, default wait for a UI element
ADB_TIMEOUT=${ADB_TIMEOUT:-90}         # s, cap for any single adb call (a hung emulator must not hang the job)
# Native ActionBar views carry ids like action_bar, action_bar_container, action_bar_title.
# AppCompat's content root "action_bar_root" (and two hidden helpers) exist even with NoActionBar
# themes, so they are allowed.
ACTIONBAR_ID_RE='action_bar'
ACTIONBAR_ID_ALLOW_RE='(action_bar_root|action_bar_activity_content|action_mode_bar_stub)$'
CONSOLE_ERROR_RE='Capacitor/Console.*(Uncaught|TypeError|ReferenceError|SyntaxError)'
REMOTE_XML=/data/local/tmp/pes-smoke-ui.xml

# ---------------------------------------------------------------------------------------------
# Arguments, output folder, adb
# ---------------------------------------------------------------------------------------------
if [[ $# -ne 2 ]]; then
  echo "usage: $0 <apk> <outdir>" >&2
  exit 2
fi
APK=$1
mkdir -p "$2"
OUT=$(cd "$2" && pwd)
LOG=$OUT/smoke.log
: > "$LOG"
WORK=$(mktemp -d)
CUR_XML=$WORK/current.xml

ADB_BIN=$(command -v adb || true)
for sdk in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}"; do
  if [[ -z $ADB_BIN && -n $sdk && -x $sdk/platform-tools/adb ]]; then ADB_BIN=$sdk/platform-tools/adb; fi
done

# State shared by the steps and the summary
declare -A RESULT=()
STEP_IDS=() STEP_TITLES=() STEP_RESULTS=() STEP_NOTES=()
FAILED=0 SNAP_N=0 NOTE="" LAST_ERR_LINE=""
INSTALL_MS=n/a UPDATE_INSTALL_MS=n/a COLD_START_MS=n/a RENDER_MS=n/a LAUNCH_T0=0
DEV_MODEL="" DEV_ANDROID="" DEV_SCREEN="" DEV_WEBVIEW="" DEV_WEBVIEW_PROVIDER="" APP_VERSION=""
LAST_TOTAL_MS=n/a LAST_INSTALL_MS=n/a
# Current UI dump, filled by parse_ui (one array entry per node of our app)
N_CLASS=() N_RID=() N_TEXT=() N_DESC=() N_WEB=() N_X1=() N_Y1=() N_X2=() N_Y2=()
APP_W=0 APP_H=0 WEBVIEW_NODES=0 WEBVIEW_CHILDREN=0 ROTATION='?' ANR_TITLE="" ANR_X="" ANR_Y="" FOUND=-1

# ---------------------------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------------------------
log()    { printf '%s %s\n' "$(date +%H:%M:%S)" "$*" | tee -a "$LOG" >&2; }
note()   { NOTE="${NOTE:+$NOTE; }$*"; log "  - $*"; }
fail()   { note "FAIL: $*"; }   # logs only; callers `return 1` themselves
now_ms() { date +%s%3N; }
adb()    { timeout -k 10 "$ADB_TIMEOUT" "$ADB_BIN" "$@" </dev/null; }
adbt()   { local t=$1; shift; timeout -k 10 "$t" "$ADB_BIN" "$@" </dev/null; }
ash()    { adb shell "$@" | tr -d '\r'; }   # adb shell, CR-stripped

record() {  # record <id> <title> <result> <notes>
  STEP_IDS+=("$1"); STEP_TITLES+=("$2"); STEP_RESULTS+=("$3"); STEP_NOTES+=("$4")
  RESULT[$1]=$3
}

# run_step <id> <needs: space-separated step ids that must have passed> <title> <function>
run_step() {
  local id=$1 needs=$2 title=$3 fn=$4 dep result
  NOTE=""
  for dep in $needs; do
    if [[ ${RESULT[$dep]:-} != PASS ]]; then
      log "=== [$id] SKIP: $title (needs step $dep)"
      record "$id" "$title" SKIP "not run: step $dep did not pass"
      return 0
    fi
  done
  log "=== [$id] $title"
  if "$fn"; then result=PASS; else result=FAIL; FAILED=1; fi
  snap "$id-end"
  record "$id" "$title" "$result" "$NOTE"
  log "=== [$id] $result: $title"
  # GitHub annotations are readable without logging in, so failures are visible from the API
  if [[ $result == FAIL && -n ${GITHUB_ACTIONS:-} ]]; then
    printf '::error title=Smoke step %s failed::%s — %s\n' "$id" "$title" "$(printf '%s' "$NOTE" | tr '\n' ' ' | cut -c1-600)"
  fi
}

snap() {  # snap <label>: screenshot + UI dump into $OUT; never fails
  SNAP_N=$((SNAP_N + 1))
  local base
  base=$(printf '%s/%02d-%s' "$OUT" "$SNAP_N" "$1")
  adb exec-out screencap -p > "$base.png" 2>/dev/null || true
  if [[ ! -s $base.png ]]; then rm -f "$base.png"; fi
  dump_ui "$base.xml" || rm -f "$base.xml"
  return 0
}

# ---------------------------------------------------------------------------------------------
# UI dump parsing
# ---------------------------------------------------------------------------------------------
dump_ui() {  # dump_ui <local.xml>: fresh uiautomator dump; returns 0 if it looks valid
  local dst=$1
  for _ in 1 2 3; do
    ash rm -f "$REMOTE_XML" >/dev/null 2>&1 || true
    adbt 30 shell uiautomator dump "$REMOTE_XML" >/dev/null 2>&1 || true
    if adb exec-out cat "$REMOTE_XML" > "$dst" 2>/dev/null && grep -q '<hierarchy' "$dst"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

ATTR=""
attr() {  # attr <name> <node-token>: sets ATTR to the attribute value, entity-decoded and trimmed
  local re=" $1=\"([^\"]*)\"" s=""
  if [[ $2 =~ $re ]]; then s=${BASH_REMATCH[1]}; fi
  s=${s//'&#10;'/' '}; s=${s//'&#13;'/' '}; s=${s//'&lt;'/'<'}; s=${s//'&gt;'/'>'}
  s=${s//'&quot;'/'"'}; s=${s//'&apos;'/"'"}; s=${s//'&amp;'/'&'}
  s=${s#"${s%%[![:space:]]*}"}; s=${s%"${s##*[![:space:]]}"}
  ATTR=$s
}

# parse_ui <xml>: fills the N_* arrays with the nodes of our app window. N_WEB[i]=1 for nodes
# inside the android.webkit.WebView subtree (web content), 0 for native views.
RE_BOUNDS=' bounds="\[(-?[0-9]+),(-?[0-9]+)\]\[(-?[0-9]+),(-?[0-9]+)\]"'
RE_ROTATION='<hierarchy rotation="([0-9]+)"'
parse_ui() {
  local xml=$1 tok top depth=0 web_depth=-1 inweb cls pkg rid x1 y1 x2 y2
  N_CLASS=() N_RID=() N_TEXT=() N_DESC=() N_WEB=() N_X1=() N_Y1=() N_X2=() N_Y2=()
  APP_W=0 APP_H=0 WEBVIEW_NODES=0 WEBVIEW_CHILDREN=0 ROTATION='?' ANR_TITLE="" ANR_X="" ANR_Y=""
  top=$(head -c 300 "$xml")
  if [[ $top =~ $RE_ROTATION ]]; then ROTATION=${BASH_REMATCH[1]}; fi
  while IFS= read -r tok; do
    if [[ $tok == '</node>' ]]; then
      depth=$((depth - 1))
      if (( web_depth >= 0 && depth <= web_depth )); then web_depth=-1; fi
      continue
    fi
    inweb=0
    if (( web_depth >= 0 )); then inweb=1; fi
    x1=0 y1=0 x2=0 y2=0
    if [[ $tok =~ $RE_BOUNDS ]]; then
      x1=${BASH_REMATCH[1]} y1=${BASH_REMATCH[2]} x2=${BASH_REMATCH[3]} y2=${BASH_REMATCH[4]}
    fi
    attr class "$tok"; cls=$ATTR
    attr package "$tok"; pkg=$ATTR
    attr resource-id "$tok"; rid=$ATTR
    if [[ $rid == 'android:id/aerr_wait' ]]; then   # "isn't responding" system dialog: Wait button
      ANR_X=$(( (x1 + x2) / 2 )) ANR_Y=$(( (y1 + y2) / 2 ))
    fi
    if [[ $rid == 'android:id/alertTitle' ]]; then attr text "$tok"; ANR_TITLE=$ATTR; fi
    if [[ $pkg == "$PKG" ]] || (( inweb )); then
      N_CLASS+=("$cls"); N_RID+=("$rid"); N_WEB+=("$inweb")
      attr text "$tok"; N_TEXT+=("$ATTR")
      attr content-desc "$tok"; N_DESC+=("$ATTR")
      N_X1+=("$x1"); N_Y1+=("$y1"); N_X2+=("$x2"); N_Y2+=("$y2")
      if (( x2 > APP_W )); then APP_W=$x2; fi
      if (( y2 > APP_H )); then APP_H=$y2; fi
      if (( inweb )); then
        WEBVIEW_CHILDREN=$((WEBVIEW_CHILDREN + 1))
      elif [[ $cls == android.webkit.WebView ]]; then
        WEBVIEW_NODES=$((WEBVIEW_NODES + 1))
      fi
    fi
    if [[ $tok != *'/>' ]]; then   # element with children: track depth to know the WebView subtree
      if [[ $cls == android.webkit.WebView && $pkg == "$PKG" ]] && (( web_depth < 0 )); then web_depth=$depth; fi
      depth=$((depth + 1))
    fi
  done < <(grep -oE '<node [^>]*>|</node>' "$xml" || true)
}

refresh_ui() {  # fresh dump + parse; on failure the N_* arrays are emptied (never stale)
  if dump_ui "$CUR_XML"; then parse_ui "$CUR_XML"; return 0; fi
  : > "$CUR_XML"; parse_ui "$CUR_XML"; return 1
}

# find_node <text|class> <regex> [visible|any]: sets FOUND to the first matching app node.
# "text" matches text or content-desc; "visible" (default) skips zero-size (off-screen) nodes.
find_node() {
  local mode=$1 re=$2 want=${3:-visible} i
  FOUND=-1
  for i in "${!N_CLASS[@]}"; do
    if [[ $want == visible ]] && (( N_X2[i] <= N_X1[i] || N_Y2[i] <= N_Y1[i] )); then continue; fi
    if [[ $mode == class ]]; then
      if [[ ${N_CLASS[i]} =~ $re ]]; then FOUND=$i; return 0; fi
    elif [[ -n ${N_TEXT[i]} && ${N_TEXT[i]} =~ $re ]] || [[ -n ${N_DESC[i]} && ${N_DESC[i]} =~ $re ]]; then
      FOUND=$i; return 0
    fi
  done
  return 1
}

dismiss_system_dialog() {  # taps "Wait" on a system "isn't responding" dialog, if one is showing
  if [[ -n $ANR_X ]]; then
    note "WARN: system dialog '${ANR_TITLE:-not responding}' on screen; tapped Wait"
    snap system-dialog
    ash input tap "$ANR_X" "$ANR_Y" >/dev/null || true
    sleep 2
  fi
}

swipe_up() {  # scrolls the web page down by about half a screen
  local x=$(( APP_W / 2 ))
  log "  element not on screen yet: swiping up to scroll"
  ash input swipe "$x" $(( APP_H * 3 / 4 )) "$x" $(( APP_H / 4 )) 400 >/dev/null || true
  sleep 1
}

# wait_for <text|class> <regex> <timeout_s> [scroll 0|1]: polls uiautomator dumps until a visible
# node matches. With scroll=1 it also swipes up (max 3x) once the page has rendered, because
# uiautomator omits nodes that are scrolled off screen (bottom buttons on small phones).
wait_for() {
  local mode=$1 re=$2 timeout=$3 scroll=${4:-0} deadline polls=0 swipes=0
  deadline=$(( $(date +%s) + timeout ))
  while :; do
    if refresh_ui; then
      dismiss_system_dialog
      if find_node "$mode" "$re" visible; then return 0; fi
      polls=$((polls + 1))
      if (( scroll && swipes < 3 && polls >= 2 && WEBVIEW_CHILDREN > 1 && APP_H > 0 )); then
        swipe_up
        swipes=$((swipes + 1))
      fi
    fi
    if (( $(date +%s) >= deadline )); then return 1; fi
    sleep 2
  done
}

wait_text() { wait_for text "$1" "${2:-$STEP_TIMEOUT}" 0; }   # wait_text <regex> [timeout_s]

tap_index() {  # tap_index <i>: taps the centre of node i's bounds
  local i=$1 x y label
  x=$(( (N_X1[i] + N_X2[i]) / 2 )); y=$(( (N_Y1[i] + N_Y2[i]) / 2 ))
  label=${N_TEXT[i]:-${N_DESC[i]:-${N_CLASS[i]}}}
  log "  tap ($x,$y) on '$label'"
  ash input tap "$x" "$y" >/dev/null || true
  sleep 1
}

tap_text() {  # tap_text <regex> [timeout_s]: waits for a node whose text matches (scrolling if needed), taps its centre
  if ! wait_for text "$1" "${2:-$STEP_TIMEOUT}" 1; then
    fail "'$1' not found on screen within ${2:-$STEP_TIMEOUT}s"
    return 1
  fi
  tap_index "$FOUND"
}

# ---------------------------------------------------------------------------------------------
# Device / app helpers
# ---------------------------------------------------------------------------------------------
app_pid() {
  local p
  p=$(ash pidof "$PKG" 2>/dev/null || true)
  if [[ -z $p ]]; then
    p=$( { ash ps -A 2>/dev/null || true; } | awk -v pkg="$PKG" '$NF == pkg { print $2 }')
  fi
  p=${p//[[:space:]]/ }
  printf '%s' "${p%% *}"
}

app_in_foreground() {
  local w
  w=$(ash dumpsys window 2>/dev/null | grep -E 'mCurrentFocus=|mFocusedApp=' || true)
  if [[ -z $w ]]; then   # dumpsys format differs on this Android version: ask the activity manager
    w=$(ash dumpsys activity activities 2>/dev/null | grep -E 'ResumedActivity' || true)
  fi
  [[ $w == *"$PKG"* ]]
}

ensure_foreground() {
  if ! app_in_foreground; then
    log "  app is not in the foreground: bringing it back with am start"
    ash am start -n "$PKG/$ACTIVITY" >/dev/null 2>&1 || true
    sleep 3
  fi
}

ime_shown() {
  local s
  s=$(ash dumpsys input_method 2>/dev/null | grep -oE '(mInputShown|mIsInputViewShown|isInputViewShown)=true' || true)
  [[ -n $s ]]
}

hide_keyboard() {  # BACK only while the soft keyboard is up (BACK on a bare screen minimises the app)
  if ime_shown; then
    ash input keyevent 4 >/dev/null || true
    sleep 1
    log "  soft keyboard hidden"
  fi
  ensure_foreground
}

launch_app() {  # launch_app: am start -W; sets LAST_TOTAL_MS; returns 1 if am start reports an error
  local out
  LAUNCH_T0=$(now_ms)
  out=$(ash am start -W -n "$PKG/$ACTIVITY" 2>&1 || true)
  printf '%s\n' "$out" | sed 's/^/    /' | tee -a "$LOG"
  LAST_TOTAL_MS=$(printf '%s\n' "$out" | sed -n 's/^TotalTime: *\([0-9][0-9]*\).*/\1/p')
  LAST_TOTAL_MS=${LAST_TOTAL_MS:-n/a}
  if [[ $out == *Error* || $out == *Exception* ]]; then
    fail "am start failed: $(printf '%s\n' "$out" | grep -iE 'error|exception' | sed -n 1p)"
    return 1
  fi
}

install_apk() {  # install_apk: adb install -r with one retry; sets LAST_INSTALL_MS
  local t0 out="" attempt
  for attempt in 1 2; do
    t0=$(now_ms)
    out=$(adbt 300 install -r "$APK" 2>&1 || true)
    LAST_INSTALL_MS=$(( $(now_ms) - t0 ))
    printf '%s\n' "$out" >> "$LOG"
    if [[ $out == *Success* ]]; then return 0; fi
    log "  install attempt $attempt failed: $(printf '%s\n' "$out" | tail -n 1)"
    sleep 10
  done
  fail "adb install -r failed: $(printf '%s\n' "$out" | tail -n 1)"
  return 1
}

CRASHES_SEEN=0
crash_in_logcat() {  # true if logcat has a NEW FATAL EXCEPTION for our process since the last call
  local f=$WORK/logcat-check.txt n
  adb logcat -d > "$f" 2>/dev/null || true
  n=$(grep -A2 'FATAL EXCEPTION' "$f" | grep -cF "Process: $PKG," || true)
  n=${n:-0}
  if (( n > CRASHES_SEEN )); then CRASHES_SEEN=$n; return 0; fi
  return 1
}

AB_ISSUES=()
find_actionbar() {  # find_actionbar: fills AB_ISSUES from the current parse; returns 1 if an ActionBar is seen
  local i limit=$(( APP_H / 5 ))
  AB_ISSUES=()
  for i in "${!N_CLASS[@]}"; do
    if [[ ${N_RID[i]} =~ $ACTIONBAR_ID_RE && ! ${N_RID[i]} =~ $ACTIONBAR_ID_ALLOW_RE ]]; then
      AB_ISSUES+=("native ActionBar node resource-id=${N_RID[i]} class=${N_CLASS[i]}")
    fi
    if [[ ${N_WEB[i]} == 0 && ${N_CLASS[i]} == android.widget.TextView && ${N_TEXT[i]} =~ $TXT_APP_TITLE ]] \
       && (( N_Y1[i] < limit )); then
      AB_ISSUES+=("native TextView '${N_TEXT[i]}' at y=${N_Y1[i]}, inside the top 20% of ${APP_H}px (ActionBar title)")
    fi
  done
  (( ${#AB_ISSUES[@]} == 0 ))
}

# recheck_actionbar <label>: ActionBar check on later screens. Fails only if step e passed (the bar
# appeared later); if step e already failed it just notes it, so one bug is not reported 3 times.
recheck_actionbar() {
  local issue
  if find_actionbar; then return 0; fi
  if [[ ${RESULT[e]:-} != PASS ]]; then note "$1: ActionBar still present (already reported in step e)"; return 0; fi
  for issue in "${AB_ISSUES[@]}"; do fail "$1: $issue"; done
  return 1
}

expect_home() {  # expect_home <label>: home marker visible, onboarding not shown, no ActionBar
  local label=$1
  if ! wait_text "$TXT_HOME_MARK" 45; then
    if find_node text "$TXT_ONB_START" any; then
      fail "$label: onboarding is shown again, app data was lost"
    else
      fail "$label: home marker '$TXT_HOME_MARK' not visible within 45s"
    fi
    return 1
  fi
  if find_node text "$TXT_ONB_START" any; then
    fail "$label: onboarding button '$TXT_ONB_START' is on screen, app data was lost"
    return 1
  fi
  recheck_actionbar "$label" || return 1
  note "$label: home visible, onboarding not shown"
}

collect_device_info() {
  local v p
  DEV_MODEL="$(ash getprop ro.product.manufacturer 2>/dev/null || true) $(ash getprop ro.product.model 2>/dev/null || true)"
  DEV_ANDROID="$(ash getprop ro.build.version.release 2>/dev/null || true) (API $(ash getprop ro.build.version.sdk 2>/dev/null || true))"
  DEV_SCREEN="$(ash wm size 2>/dev/null | tail -n 1 | sed 's/.*: *//' || true), $(ash wm density 2>/dev/null | tail -n 1 | sed 's/.*: *//' || true) dpi"
  DEV_WEBVIEW=""
  for p in com.google.android.webview com.android.webview; do
    v=$(ash dumpsys package "$p" 2>/dev/null | grep 'versionName=' | sed -n '1s/.*versionName=//p' || true)
    if [[ -n $v ]]; then DEV_WEBVIEW="$v ($p)"; break; fi
  done
  DEV_WEBVIEW_PROVIDER=$(ash dumpsys webviewupdate 2>/dev/null | grep 'Current WebView package' | sed -n '1s/.*: *//p' || true)
  DEV_WEBVIEW=${DEV_WEBVIEW:-${DEV_WEBVIEW_PROVIDER:-unknown}}
}

# ---------------------------------------------------------------------------------------------
# Steps
# ---------------------------------------------------------------------------------------------
step_boot() {  # a
  if [[ -z $ADB_BIN ]]; then fail "adb not found (PATH, \$ANDROID_HOME/platform-tools)"; return 1; fi
  log "  adb: $ADB_BIN"
  if ! adbt "$BOOT_TIMEOUT" wait-for-device; then fail "no device within ${BOOT_TIMEOUT}s"; return 1; fi
  local deadline
  deadline=$(( $(date +%s) + BOOT_TIMEOUT ))
  until [[ $(ash getprop sys.boot_completed 2>/dev/null || true) == 1 \
           && $(ash pm path android 2>/dev/null || true) == package:* ]]; do
    if (( $(date +%s) >= deadline )); then fail "boot not completed after ${BOOT_TIMEOUT}s"; return 1; fi
    sleep 3
  done
  ash settings put global window_animation_scale 0 >/dev/null || true
  ash settings put global transition_animation_scale 0 >/dev/null || true
  ash settings put global animator_duration_scale 0 >/dev/null || true
  ash settings put system accelerometer_rotation 0 >/dev/null || true
  ash settings put system user_rotation 0 >/dev/null || true
  ash settings put global verifier_verify_adb_installs 0 >/dev/null 2>&1 || true   # no install-scan dialogs
  ash settings put global package_verifier_enable 0 >/dev/null 2>&1 || true
  ash svc power stayon true >/dev/null || true
  # API 34 emulator images keep raising "Pixel Launcher isn't responding" over the app (v0.6–0.8
  # CI runs). The app is started directly with am start, so the launcher is not needed: switch it
  # off and hide system error dialogs for the run.
  ash settings put global hide_error_dialogs 1 >/dev/null 2>&1 || true
  local launcher
  for launcher in com.google.android.apps.nexuslauncher com.android.launcher3; do
    if ash pm path "$launcher" 2>/dev/null | grep -q package:; then
      ash pm disable-user --user 0 "$launcher" >/dev/null 2>&1 && note "launcher $launcher disabled for the run" || true
    fi
  done
  ash input keyevent 224 >/dev/null || true   # WAKEUP
  ash input keyevent 82 >/dev/null || true    # MENU: dismisses the emulator's swipe lock screen
  ash wm dismiss-keyguard >/dev/null 2>&1 || true
  adb logcat -G 16M >/dev/null 2>&1 || true   # keep the whole run in the log buffer
  collect_device_info
  note "device: $DEV_MODEL, Android $DEV_ANDROID, screen $DEV_SCREEN, WebView $DEV_WEBVIEW"
}

step_install() {  # b
  if [[ ! -f $APK ]]; then fail "APK not found: '$APK'"; return 1; fi
  log "  APK: $APK ($(du -h "$APK" | cut -f1))"
  adb uninstall "$PKG" >/dev/null 2>&1 || true   # fresh app data even on a reused emulator snapshot
  install_apk || return 1
  INSTALL_MS=$LAST_INSTALL_MS
  local info name code
  info=$(ash dumpsys package "$PKG" 2>/dev/null || true)
  name=$(printf '%s\n' "$info" | sed -n 's/.*versionName=\([^ ]*\).*/\1/p' | sed -n 1p)
  code=$(printf '%s\n' "$info" | sed -n 's/.*versionCode=\([0-9]*\).*/\1/p' | sed -n 1p)
  APP_VERSION="${name:-?} (code ${code:-?})"
  note "installed $APP_VERSION in ${INSTALL_MS} ms"
}

step_launch() {  # c
  adb logcat -c >/dev/null 2>&1 || true
  ash am force-stop "$PKG" >/dev/null 2>&1 || true
  launch_app || return 1
  COLD_START_MS=$LAST_TOTAL_MS
  note "cold start TotalTime ${COLD_START_MS} ms"
  sleep 2
  if [[ -z $(app_pid) ]]; then fail "app process is not running after launch"; return 1; fi
}

step_render() {  # d
  if wait_for text "$TXT_ONB_START" "$RENDER_TIMEOUT" 1; then
    RENDER_MS=$(( $(now_ms) - LAUNCH_T0 ))
    note "web UI visible ~${RENDER_MS} ms after launch ('${N_TEXT[FOUND]:-${N_DESC[FOUND]}}')"
    return 0
  fi
  # a system dialog may have pushed the app back: bring it to the front and look once more
  note "WARN: '$TXT_ONB_START' not visible after ${RENDER_TIMEOUT}s; bringing the app back and retrying once"
  refresh_ui || true
  dismiss_system_dialog
  ensure_foreground
  if wait_for text "$TXT_ONB_START" "$RENDER_TIMEOUT" 1; then
    RENDER_MS=$(( $(now_ms) - LAUNCH_T0 ))
    note "web UI visible after retry ~${RENDER_MS} ms after launch"
    return 0
  fi
  local why js
  why="blank WebView: '$TXT_ONB_START' did not appear within ${RENDER_TIMEOUT}s"
  if (( WEBVIEW_NODES == 0 )); then
    why+=" (no android.webkit.WebView in the window)"
  else
    why+=" (WebView has ${WEBVIEW_CHILDREN} accessible child nodes)"
  fi
  fail "$why"
  js=$( { adb logcat -d 2>/dev/null || true; } | grep -E "$CONSOLE_ERROR_RE" | sed -n 1p | cut -c1-240 || true)
  if [[ -n $js ]]; then note "first JS error: $js"; fi
  return 1
}

step_no_actionbar() {  # e
  if ! refresh_ui; then fail "could not dump the UI"; return 1; fi
  if (( APP_H == 0 )); then fail "no nodes of $PKG in the UI dump (app not on screen?)"; return 1; fi
  if ! find_actionbar; then
    local issue
    for issue in "${AB_ISSUES[@]}"; do fail "$issue"; done
    return 1
  fi
  note "no ActionBar ids, no native '$TXT_APP_TITLE' TextView in the top 20% (window ${APP_W}x${APP_H})"
}

step_onboarding() {  # f
  tap_text "$TXT_ONB_START" || return 1
  if ! wait_for class "$TXT_ONB_NAME_FIELD" "$STEP_TIMEOUT"; then
    fail "name field (class $TXT_ONB_NAME_FIELD) did not appear after tapping start"
    return 1
  fi
  snap onb-name-field
  local typed=0 attempt
  for attempt in 1 2; do
    if ! find_node class "$TXT_ONB_NAME_FIELD" visible; then refresh_ui || true; fi
    if ! find_node class "$TXT_ONB_NAME_FIELD" visible; then fail "name field disappeared"; return 1; fi
    tap_index "$FOUND"
    ash input text "$ONB_NAME" >/dev/null || true
    sleep 1
    if refresh_ui && find_node class "$TXT_ONB_NAME_FIELD" visible && [[ ${N_TEXT[FOUND]} == *"$ONB_NAME"* ]]; then
      typed=1
      break
    fi
    log "  typed name not visible in the field (attempt $attempt)"
  done
  if (( typed )); then note "typed name '$ONB_NAME'"; else note "WARN: could not confirm the typed name; continuing"; fi
  snap onb-name-typed
  hide_keyboard
  tap_text "$TXT_ONB_CONTINUE" || return 1
  if ! wait_text "$TXT_ONB_SKIP" 15; then
    log "  '$TXT_ONB_SKIP' not visible: the keyboard may cover the button; BACK and retry"
    ash input keyevent 4 >/dev/null || true
    sleep 1
    ensure_foreground
    tap_text "$TXT_ONB_CONTINUE" || return 1
    if ! wait_text "$TXT_ONB_SKIP" "$STEP_TIMEOUT"; then
      fail "'$TXT_ONB_SKIP' did not appear after tapping continue"
      return 1
    fi
  fi
  snap onb-ai-key
  tap_text "$TXT_ONB_SKIP" || return 1
  if ! wait_text "$TXT_HOME_MARK" "$STEP_TIMEOUT"; then
    fail "home marker '$TXT_HOME_MARK' did not appear after skipping the key"
    return 1
  fi
  note "onboarding done, home visible"
}

step_persistence() {  # g
  install_apk || return 1
  UPDATE_INSTALL_MS=$LAST_INSTALL_MS
  note "update install ${UPDATE_INSTALL_MS} ms"
  launch_app || return 1
  expect_home "after app update" || return 1
  snap after-update
  ash am force-stop "$PKG" >/dev/null 2>&1 || true
  sleep 1
  launch_app || return 1
  expect_home "after force-stop" || return 1
}

step_back() {  # h
  ensure_foreground
  if ! wait_text "$TXT_HOME_MARK" "$STEP_TIMEOUT"; then fail "home screen not visible, cannot test BACK on home"; return 1; fi
  ash input keyevent 4 >/dev/null || true
  sleep 3
  snap after-back
  local pid
  pid=$(app_pid)
  if crash_in_logcat; then fail "FATAL EXCEPTION for $PKG after BACK"; return 1; fi
  if [[ -z $pid ]]; then fail "app process is gone after BACK"; return 1; fi
  if app_in_foreground; then
    note "app still in the foreground after BACK (pid $pid)"
  else
    note "app went to the background after BACK, process alive (pid $pid)"
  fi
  launch_app || return 1
  if ! wait_text "$TXT_HOME_MARK" "$STEP_TIMEOUT"; then fail "home not shown after reopening the app"; return 1; fi
  note "reopened: home visible"
}

step_rotate() {  # i
  local rc=0 was_home=0
  ensure_foreground   # independent of how step h ended
  if refresh_ui && find_node text "$TXT_HOME_MARK" visible; then was_home=1; fi
  ash settings put system accelerometer_rotation 0 >/dev/null || true
  ash settings put system user_rotation 1 >/dev/null || true
  sleep 3
  snap rotated
  if refresh_ui; then
    note "rotated: hierarchy rotation=$ROTATION, app window ${APP_W}x${APP_H}"
    if [[ $ROTATION == 0 ]]; then note "WARN: the device did not report a rotation"; fi
    if (( WEBVIEW_NODES == 0 )); then fail "no WebView in the window after rotation"; rc=1; fi
    recheck_actionbar "rotated" || rc=1
    if find_node text "$TXT_HOME_MARK" visible; then note "home marker visible while rotated"; fi
  else
    fail "could not dump the UI after rotation"; rc=1
  fi
  if [[ -z $(app_pid) ]]; then fail "app process is gone after rotation"; rc=1; fi
  if crash_in_logcat; then fail "FATAL EXCEPTION for $PKG after rotation"; rc=1; fi
  if ! app_in_foreground; then fail "app is not in the foreground after rotation"; rc=1; fi
  ash settings put system user_rotation 0 >/dev/null || true
  sleep 3
  if (( was_home )) && ! wait_text "$TXT_HOME_MARK" "$STEP_TIMEOUT"; then
    fail "home marker not visible after rotating back"; rc=1
  fi
  return "$rc"
}

step_logcat() {  # j
  local f=$OUT/logcat.txt fatal console anr rc=0
  if ! adb logcat -d > "$f" 2>/dev/null; then fail "could not read logcat"; return 1; fi
  fatal=$(grep -A2 'FATAL EXCEPTION' "$f" | grep -F "Process: $PKG," || true)
  console=$(grep -E "$CONSOLE_ERROR_RE" "$f" || true)
  anr=$(grep -E "ANR in $PKG" "$f" || true)
  if [[ -n $fatal ]]; then
    grep -B1 -A40 'FATAL EXCEPTION' "$f" > "$OUT/crash.txt" || true
    fail "$(printf '%s\n' "$fatal" | wc -l) FATAL EXCEPTION(s) for $PKG, see crash.txt"
    rc=1
  fi
  if [[ -n $console ]]; then
    fail "$(printf '%s\n' "$console" | wc -l) Capacitor console error(s), first: $(printf '%s\n' "$console" | sed -n 1p | cut -c1-240)"
    rc=1
  fi
  if [[ -n $anr ]]; then note "WARN: $(printf '%s\n' "$anr" | sed -n 1p | cut -c1-200)"; fi
  note "logcat.txt: $(wc -l < "$f") lines"
  return "$rc"
}

# ---------------------------------------------------------------------------------------------
# Summary + exit (always runs, also after an unexpected error or a kill)
# ---------------------------------------------------------------------------------------------
md() { local s=${1//|/\\|}; printf '%s' "${s//$'\n'/ }"; }

write_summary() {
  local f=$OUT/summary.md overall=PASS i
  if (( FAILED )); then overall=FAIL; fi
  {
    printf '# PES Android smoke test: %s\n\n' "$overall"
    printf '| Item | Value |\n|---|---|\n'
    printf '| Device | %s |\n' "$(md "${DEV_MODEL:-unknown}")"
    printf '| Android | %s |\n' "$(md "${DEV_ANDROID:-unknown}")"
    printf '| Screen | %s |\n' "$(md "${DEV_SCREEN:-unknown}")"
    printf '| WebView | %s |\n' "$(md "${DEV_WEBVIEW:-unknown}")"
    printf '| WebView provider | %s |\n' "$(md "${DEV_WEBVIEW_PROVIDER:-unknown}")"
    printf '| App | %s |\n' "$(md "${APP_VERSION:-unknown}")"
    printf '| APK | %s |\n' "$(md "${APK##*/}")"
    printf '| Install time | %s ms |\n' "$INSTALL_MS"
    printf '| Update install time | %s ms |\n' "$UPDATE_INSTALL_MS"
    printf '| Cold start (am start -W TotalTime) | %s ms |\n' "$COLD_START_MS"
    printf '| Launch to first web UI | %s ms |\n' "$RENDER_MS"
    printf '\n## Steps\n\n| Step | Result | Notes |\n|---|---|---|\n'
    for i in "${!STEP_IDS[@]}"; do
      printf '| %s. %s | **%s** | %s |\n' "${STEP_IDS[i]}" "$(md "${STEP_TITLES[i]}")" \
        "${STEP_RESULTS[i]}" "$(md "${STEP_NOTES[i]}")"
    done
    printf '\nFiles: NN-*.png screenshots and NN-*.xml UI dumps (numbered in run order), smoke.log, logcat.txt.\n'
  } > "$f"
  if [[ -n ${GITHUB_STEP_SUMMARY:-} ]]; then cat "$f" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true; fi
}

finish() {
  local rc=$?
  trap - EXIT
  set +e
  if (( rc != 0 )); then
    FAILED=1
    record "!" "script stopped early" FAIL "exit code $rc${LAST_ERR_LINE:+, last error near line $LAST_ERR_LINE}"
    log "!!! script stopped early (exit $rc${LAST_ERR_LINE:+, line $LAST_ERR_LINE})"
  fi
  if [[ -n $ADB_BIN ]]; then
    ash settings put system user_rotation 0 >/dev/null 2>&1
    run_step j "" "Logcat: no crash, no JS console errors" step_logcat
    if [[ -z $DEV_MODEL || $DEV_MODEL == " " ]]; then collect_device_info; fi
  fi
  write_summary
  if [[ -n ${GITHUB_ACTIONS:-} ]]; then
    printf '::notice title=Smoke %s::%s · Android %s · WebView %s · cold start %s ms · %s\n' \
      "$( (( FAILED )) && echo FAIL || echo PASS)" "${DEV_MODEL:-?}" "${DEV_ANDROID:-?}" "${DEV_WEBVIEW:-?}" "$COLD_START_MS" \
      "$(for i in "${!STEP_IDS[@]}"; do printf '%s:%s ' "${STEP_IDS[i]}" "${STEP_RESULTS[i]}"; done)"
  fi
  rm -rf "$WORK"
  log "Results in $OUT"
  if (( FAILED )); then log "RESULT: FAIL"; exit 1; fi
  log "RESULT: PASS"
  exit 0
}
trap finish EXIT
trap 'LAST_ERR_LINE=$LINENO' ERR
trap 'exit 130' INT TERM

# ---------------------------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------------------------
log "PES smoke test: apk='$APK' out='$OUT'"
run_step a ""  "Boot, disable animations, unlock"        step_boot
run_step b "a" "Install APK"                              step_install
run_step c "b" "Cold start"                               step_launch
run_step d "c" "WebView renders onboarding"               step_render
run_step e "c" "No native ActionBar"                      step_no_actionbar
run_step f "d" "Complete onboarding"                      step_onboarding
run_step g "f" "Data survives app update and force-stop"  step_persistence
run_step h "f" "BACK on home does not crash"              step_back
run_step i "d" "Rotate and rotate back"                   step_rotate
exit 0
