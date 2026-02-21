# Finbar repo: shell shortcuts for local development
#
# Copy or source this file into your real ~/.zshrc:
#   echo "source /FULL/PATH/TO/Finbar/.zshrc" >> ~/.zshrc
#
# Optionally set FINBAR_DIR in your ~/.zshrc to the repo path to avoid auto-detection:
#   export FINBAR_DIR="/Users/you/Projects/Finbar"

_finbar_detect_repo() {
  # Return path to repo root (directory that contains backend/ and frontend/)
  if [[ -n "${FINBAR_DIR:-}" && -d "$FINBAR_DIR" ]]; then
    echo "$FINBAR_DIR"
    return 0
  fi

  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/backend" && -d "$dir/frontend" ]]; then
      echo "$dir"
      return 0
    fi
    dir=$(dirname -- "$dir")
  done

  return 1
}

finbar() {
  local cmd=${1:-}
  local repo
  repo=$(_finbar_detect_repo) || {
    echo "Finbar repo not found. Set FINBAR_DIR or cd into the repo." >&2
    return 1
  }

  case "$cmd" in
    backend)
      echo "[finbar] running backend (from $repo/backend)"
      (cd "$repo/backend" && pip install -r requirements.txt && python3 app.py)
      ;;

    frontend)
      echo "[finbar] running frontend (from $repo/frontend)"
      (cd "$repo/frontend" && npm install && npm run dev)
      ;;

    all)
      echo "[finbar] starting backend and frontend (background)"
      (cd "$repo/backend" && pip install -r requirements.txt && python3 app.py) &
      (cd "$repo/frontend" && npm install && npm run dev) &
      wait
      ;;

    -h|--help|help|"")
      echo "Usage: finbar {backend|frontend|all}"
      echo "Set FINBAR_DIR in your ~/.zshrc to the repo path to avoid auto-detection"
      ;;

    *)
      echo "Unknown finbar command: $cmd" >&2
      echo "Usage: finbar {backend|frontend|all}" >&2
      return 2
      ;;
  esac
}

# Short alias
alias fb=finbar

# Optional: add tab completion for the command
_finbar_completion() {
  local -a cmds
  cmds=(backend frontend all help)
  compadd "$@" -- ${cmds[@]}
}
compdef _finbar_completion finbar fb
