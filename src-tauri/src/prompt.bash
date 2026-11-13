# SSH Connector — session-only modern prompt (bash). Loaded with `bash --rcfile`; nothing is written to
# the user's dotfiles. Powerline-style "flags" (or plain colored text) for user@host, folder, git, command
# duration, exit code and time. Colors/options come from the app (validated config lines prepended to
# this file). Folder and git state are also reported to the app with OSC 7 / OSC 6973 (invisible).

# the temp rc file removes itself right away
[ -n "$SSHC_RC" ] && rm -f -- "$SSHC_RC" 2>/dev/null
unset SSHC_RC

# behave like a normal login shell: system + user profile (which usually pulls in ~/.bashrc)
[ -f /etc/profile ] && . /etc/profile
if [ -f ~/.bash_profile ]; then . ~/.bash_profile
elif [ -f ~/.bash_login ]; then . ~/.bash_login
elif [ -f ~/.profile ]; then . ~/.profile
fi

# defaults (overridden by the app's config lines above)
: "${__sshc_style:=glass}" "${__sshc_two:=1}" "${__sshc_dirmode:=full}"
: "${__sshc_segs:=user dir git dur status}"
: "${__sshc_c_user_bg:=58;62;74}" "${__sshc_c_user_fg:=230;232;238}"
: "${__sshc_c_dir_bg:=40;90;160}" "${__sshc_c_dir_fg:=240;244;250}"
: "${__sshc_c_git_bg:=50;120;60}" "${__sshc_c_git_fg:=240;250;240}"
: "${__sshc_c_gitd_bg:=150;120;20}" "${__sshc_c_gitd_fg:=20;20;20}"
: "${__sshc_c_dur_bg:=90;80;40}" "${__sshc_c_dur_fg:=250;240;210}"
: "${__sshc_c_err_bg:=150;40;40}" "${__sshc_c_err_fg:=255;235;235}"
: "${__sshc_c_time_bg:=60;60;70}" "${__sshc_c_time_fg:=220;220;230}"
: "${__sshc_c_ok:=80;200;120}" "${__sshc_c_bad:=230;80;80}"

# separators (U+E0B0… powerline shapes; the app's GPU renderer draws them without special fonts)
case "$__sshc_style" in
  glass) __sshc_sep=""; __sshc_cap="" ;;
  round) __sshc_sep=$''; __sshc_cap=$'' ;;
  slant) __sshc_sep=$''; __sshc_cap=$'' ;;
  plain) __sshc_sep=""; __sshc_cap="" ;;
  *)     __sshc_sep=$''; __sshc_cap="" ;;
esac

__sshc_has() { case " $__sshc_segs " in *" $1 "*) return 0 ;; esac; return 1; }
# escape sequences wrapped in \001..\002 so readline knows they take no space. Text values are only
# ever expanded from variables in PS1, never re-evaluated, so folder/branch names can't run anything.
__sshc_e() { printf '\001\033[%sm\002' "$1"; }

# append one segment: bg fg text
__sshc_seg() {
  local bg=$1 fg=$2 text=$3
  # "glass": separate, fully rounded pills with a gap (translucent tint + tinted text come from the app)
  if [ "$__sshc_style" = glass ]; then
    __sshc_out+="${__sshc_out:+ }$(__sshc_e "0;38;2;${bg}")$(__sshc_e "0;48;2;${bg};38;2;${fg}")${text}$(__sshc_e "0;38;2;${bg}")$(__sshc_e 0)"
    __sshc_prev=$bg
    return
  fi
  if [ "$__sshc_style" = plain ]; then
    __sshc_out+="${__sshc_out:+ }$(__sshc_e "1;38;2;${bg}")${text}$(__sshc_e 0)"
    return
  fi
  if [ -z "$__sshc_prev" ]; then
    [ -n "$__sshc_cap" ] && __sshc_out+="$(__sshc_e "0;38;2;${bg}")${__sshc_cap}"
  else
    __sshc_out+="$(__sshc_e "38;2;${__sshc_prev};48;2;${bg}")${__sshc_sep}"
  fi
  __sshc_out+="$(__sshc_e "0;48;2;${bg};38;2;${fg}") ${text} "
  __sshc_prev=$bg
}
__sshc_end() {
  if [ "$__sshc_style" != plain ] && [ "$__sshc_style" != glass ] && [ -n "$__sshc_prev" ]; then
    __sshc_out+="$(__sshc_e "0;38;2;${__sshc_prev}")${__sshc_sep:-$''}$(__sshc_e 0)"
  fi
}

__sshc_git() {
  __sshc_graw=""; __sshc_gtext=""; __sshc_gdirty=0
  local out
  out=$(git --no-optional-locks status --porcelain=v2 --branch 2>/dev/null) || return 0
  local line branch="" oid="" ahead=0 behind=0 staged=0 modified=0 untracked=0 conflicts=0 x y
  while IFS= read -r line; do
    case "$line" in
      "# branch.head "*) branch=${line#\# branch.head } ;;
      "# branch.oid "*) oid=${line#\# branch.oid } ;;
      "# branch.ab "*) line=${line#\# branch.ab }; ahead=${line%% *}; ahead=${ahead#+}; behind=${line##* }; behind=${behind#-} ;;
      "1 "*|"2 "*) x=${line:2:1}; y=${line:3:1}
                   [ "$x" != "." ] && staged=$((staged + 1))
                   [ "$y" != "." ] && modified=$((modified + 1)) ;;
      "u "*) conflicts=$((conflicts + 1)) ;;
      "? "*) untracked=$((untracked + 1)) ;;
    esac
  done <<< "$out"
  [ "$branch" = "(detached)" ] && branch="${oid:0:7}"
  [ -z "$branch" ] && return 0
  local t=$'⎇'" ${branch}"
  [ "$conflicts" -gt 0 ] && t+=" ✖${conflicts}"
  [ "$staged" -gt 0 ] && t+=" ✚${staged}"
  [ "$modified" -gt 0 ] && t+=" ●${modified}"
  [ "$untracked" -gt 0 ] && t+=" ?${untracked}"
  [ "$ahead" -gt 0 ] 2>/dev/null && t+=" ⇡${ahead}"
  [ "$behind" -gt 0 ] 2>/dev/null && t+=" ⇣${behind}"
  [ $((conflicts + staged + modified + untracked)) -gt 0 ] && __sshc_gdirty=1
  __sshc_gtext=$t
  __sshc_graw="${branch}|${staged}|${modified}|${untracked}|${ahead}|${behind}|${conflicts}"
}

# time each command (DEBUG fires before it runs; our own prompt hooks are ignored)
__sshc_preexec() {
  case "$BASH_COMMAND" in __sshc_*) return ;; esac
  [ -z "$__sshc_t0" ] && __sshc_t0=$SECONDS
}
trap '__sshc_preexec' DEBUG

# folder shortened to the last two parts ("…/b/c"), or just the last one
__sshc_short() {
  local IFS=/ parts; read -ra parts <<< "$1"
  if [ "$2" = 1 ]; then [ "${#parts[@]}" -gt 1 ] && printf '%s' "${parts[-1]}" || printf '%s' "$1"
  elif [ "${#parts[@]}" -gt 3 ]; then printf '…/%s/%s' "${parts[-2]}" "${parts[-1]}"
  else printf '%s' "$1"; fi
}
# visible width of the collected segments (text + padding + separator)
__sshc_width() { local w=0 t; for t in "${__sshc_txt[@]}"; do [ -n "$t" ] && w=$((w + ${#t} + 3)); done; __sshc_w=$w; }

__sshc_prompt() {
  local ec=${__sshc_ec:-0} d dir
  __sshc_out=""; __sshc_prev=""
  dir="${PWD/#$HOME/\~}"

  # collect segments first (index = draw order), then fit them to the terminal width
  local u="" f="" g="" du="" er="" tm=""
  __sshc_has user && u="${USER:-$(id -un)}@${HOSTNAME%%.*}"
  if __sshc_has dir; then f=$dir; [ "$__sshc_dirmode" = short ] && f=$(__sshc_short "$dir"); fi
  __sshc_git
  __sshc_has git && g=$__sshc_gtext
  if __sshc_has dur && [ -n "$__sshc_t0" ]; then
    d=$((SECONDS - __sshc_t0))
    if [ "$d" -ge 60 ]; then du="$((d / 60))m$((d % 60))s"; elif [ "$d" -ge 3 ]; then du="${d}s"; fi
  fi
  unset __sshc_t0
  __sshc_has status && [ "$ec" -ne 0 ] && er="✘ ${ec}"
  __sshc_has time && printf -v tm '%(%H:%M)T' -1

  # too wide for the terminal? drop/shorten the least important parts first (git and errors stay)
  local room=$(( ${COLUMNS:-80} - 3 )) step
  local br=${__sshc_graw%%|*}
  for step in time user short dur leaf gitbr gitcut nodir; do
    __sshc_txt=("$u" "$f" "$g" "$du" "$er" "$tm"); __sshc_width
    [ "$__sshc_w" -le "$room" ] && break
    case $step in
      time) tm="" ;; user) u="" ;; short) [ -n "$f" ] && f=$(__sshc_short "$dir") ;;
      dur) du="" ;; leaf) [ -n "$f" ] && f=$(__sshc_short "$dir" 1) ;;
      gitbr) [ -n "$g" ] && g=$'⎇'" ${br}" ;;                       # branch only (color still shows dirty)
      gitcut) [ -n "$g" ] && [ "${#br}" -gt 12 ] && g=$'⎇'" ${br:0:11}…" ;;
      nodir) f="" ;;
    esac
  done

  [ -n "$u" ] && __sshc_seg "$__sshc_c_user_bg" "$__sshc_c_user_fg" "$u"
  [ -n "$f" ] && __sshc_seg "$__sshc_c_dir_bg" "$__sshc_c_dir_fg" "$f"
  if [ -n "$g" ]; then
    if [ "$__sshc_gdirty" -eq 1 ]; then __sshc_seg "$__sshc_c_gitd_bg" "$__sshc_c_gitd_fg" "$g"
    else __sshc_seg "$__sshc_c_git_bg" "$__sshc_c_git_fg" "$g"; fi
  fi
  [ -n "$du" ] && __sshc_seg "$__sshc_c_dur_bg" "$__sshc_c_dur_fg" "$du"
  [ -n "$er" ] && __sshc_seg "$__sshc_c_err_bg" "$__sshc_c_err_fg" "$er"
  [ -n "$tm" ] && __sshc_seg "$__sshc_c_time_bg" "$__sshc_c_time_fg" "$tm"
  __sshc_end

  if [ "$__sshc_two" = 1 ]; then
    local c=$__sshc_c_ok; [ "$ec" -ne 0 ] && c=$__sshc_c_bad
    __sshc_line2=$'\n'"$(__sshc_e "1;38;2;${c}")❯$(__sshc_e 0) "
  else
    __sshc_line2=" "
  fi

  # tell the app where we are (folder + git), invisible on screen
  printf '\033]7;file://%s%s\007\033]6973;cwd=%s\007\033]6973;git=%s\007' "${HOSTNAME:-host}" "$PWD" "$dir" "$__sshc_graw"
}

PS1='\n${__sshc_out}${__sshc_line2}'
PS2='  '

# keep whatever PROMPT_COMMAND the system/user already had (window title, history sync…);
# bash 5.1+ allows it to be an array, so join all entries
__sshc_old_pc=$(IFS=';'; printf '%s' "${PROMPT_COMMAND[*]}")
unset PROMPT_COMMAND
PROMPT_COMMAND='__sshc_ec=$?'"${__sshc_old_pc:+; $__sshc_old_pc}"'; __sshc_prompt'
