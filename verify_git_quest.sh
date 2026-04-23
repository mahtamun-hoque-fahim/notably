#!/usr/bin/env bash
# Git Quest — Automated Verification Script
# Usage: bash verify_git_quest.sh [path-to-repo]
set -euo pipefail
REPO_DIR="${1:-.}"; PASS=0; FAIL=0; TOTAL=0; XP=0
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
divider() { echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
check() { local q="$1" d="$2" p="$3"; shift 3; TOTAL=$((TOTAL+1)); if "$@" >/dev/null 2>&1; then echo -e "  ${GREEN}✅ PASS${NC} — $d (+${p} XP)"; PASS=$((PASS+1)); XP=$((XP+p)); else echo -e "  ${RED}❌ FAIL${NC} — $d"; FAIL=$((FAIL+1)); fi; }
cd "$REPO_DIR"
echo -e "\n${BOLD}${CYAN}⚔️  Git Quest — Automated Verifier${NC}\n${CYAN}   Checking: $(pwd)${NC}"; divider
echo -e "\n${BOLD}Quest 1 — First Boot${NC} (10 XP)"
check 1 "Git installed" 2 bash -c 'git --version | grep -q "git version"'
check 1 "user.name set" 4 bash -c 'git config user.name | grep -q "."'
check 1 "user.email set" 4 bash -c 'git config user.email | grep -q "."'
echo -e "\n${BOLD}Quest 2 — Foundation${NC} (10 XP)"
check 2 ".git exists" 2 test -d .git
check 2 "README.md" 2 bash -c 'test -s README.md'
check 2 "release-notes.md" 2 bash -c 'test -s notes/release-notes.md'
check 2 "meeting-notes.md" 1 bash -c 'test -s notes/meeting-notes.md'
check 2 ".gitignore" 1 bash -c 'test -s .gitignore'
check 2 "≥5 tracked files" 2 bash -c '[ "$(git ls-files | wc -l)" -ge 5 ]'
echo -e "\n${BOLD}Quest 3 — Commit Trail${NC} (10 XP)"
CC=$(git rev-list --count HEAD 2>/dev/null || echo 0)
check 3 "≥6 commits (found: $CC)" 5 bash -c "[ $CC -ge 6 ]"
UF=$(git log --pretty=format: --name-only | sort -u | grep -v '^$' | wc -l)
check 3 "Multiple files changed ($UF)" 3 bash -c "[ $UF -ge 4 ]"
VC=$(git log --pretty=format:"%s" | grep -ciE '^(update|fix|changes|stuff|wip|test|asdf)$' || true)
check 3 "No vague messages" 2 bash -c "[ ${VC:-0} -eq 0 ]"
echo -e "\n${BOLD}Quest 4 — Inspector's Toolkit${NC} (5 XP)\n  ${YELLOW}⚠️  Manual: verify screenshots of status/diff/log/show${NC}"
echo -e "\n${BOLD}Quest 5 — Branch & Merge${NC} (10 XP)"
check 5 "readme-update branch" 3 bash -c 'git branch -a | grep -qi "readme.update" || git log --all --oneline | grep -qi "readme"'
MC=$(git log --oneline --merges | wc -l)
check 5 "≥1 merge commit ($MC)" 4 bash -c "[ $MC -ge 1 ]"
check 5 "Merge references feature" 3 bash -c 'git log --merges --oneline | grep -qi "readme\|feature\|merge"'
echo -e "\n${BOLD}Quest 6 — Conflict Boss${NC} (10 XP)"
check 6 "release-template branch" 3 bash -c 'git branch -a | grep -qi "release.template" || git log --all --oneline | grep -qi "release.template"'
check 6 "≥2 merge commits" 4 bash -c "[ $MC -ge 2 ]"
check 6 "release-notes content" 3 bash -c '[ "$(cat notes/release-notes.md | wc -l)" -ge 5 ]'
echo -e "\n${BOLD}Quest 7 — Going Remote${NC} (10 XP)"
RC=$(git remote | wc -l)
check 7 "Remote configured ($RC)" 5 bash -c "[ $RC -ge 1 ]"
check 7 "origin exists" 5 bash -c 'git remote get-url origin >/dev/null 2>&1'
echo -e "\n${BOLD}Quest 8 — Collaboration${NC} (10 XP)"
AC=$(git log --format="%aN" | sort -u | wc -l)
check 8 "Multiple authors ($AC)" 7 bash -c "[ $AC -ge 2 ]"
check 8 "Non-primary author exists" 3 bash -c 'P=$(git log --format="%aN"|sort|uniq -c|sort -rn|head -1|xargs|cut -d" " -f2-); git log --format="%aN"|grep -v "$P"|grep -q "."'
echo -e "\n${BOLD}Quest 9 — Tool Mastery${NC} (15 XP)\n  ${YELLOW}⚠️  Manual: verify ≥4 Ch.7 tools (3 XP each, max 15)${NC}"
RL=$(git reflog | wc -l)
[ "$RL" -gt "$CC" ] && echo -e "  ${GREEN}📎${NC} reflog=$RL vs commits=$CC — suggests reset/amend"
echo -e "\n${BOLD}Quest 10 — Release Tag${NC} (5 XP)"
check 10 "Tag exists" 2 bash -c '[ "$(git tag | wc -l)" -ge 1 ]'
check 10 "v1.0 tag" 3 bash -c 'git tag | grep -q "v1.0"'
echo -e "\n${BOLD}Bonus — Reflection${NC} (5 XP)\n  ${YELLOW}⚠️  Manual: verify 150-300 word reflection${NC}"
divider
echo -e "\n${BOLD}📊 Summary${NC}\n   Checks: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total\n   XP: ${CYAN}$XP${NC} (of ~80 automatable)\n   Manual: Quest 4 (5), Quest 9 (15), Bonus (5)"
if [ $XP -ge 85 ]; then R="🏆 Git Grandmaster"; elif [ $XP -ge 60 ]; then R="🔧 Artisan"; elif [ $XP -ge 30 ]; then R="⚒️ Journeyman"; else R="📘 Apprentice"; fi
echo -e "   Rank: ${BOLD}$R${NC} ($XP XP)\n\n${BOLD}📈 Graph:${NC}"; git log --oneline --graph --decorate --all | head -20; echo; divider