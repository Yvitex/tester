#!/usr/bin/env python3

import bisect
import fnmatch
import os
import re
import subprocess
import sys
from pathlib import Path

from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer
from presidio_analyzer.nlp_engine import NlpEngineProvider


DATA_EXTENSIONS = set(
    ext.strip().lower()
    for ext in os.environ.get(
        "PHI_SCAN_EXTENSIONS", ".csv,.json,.sql,.txt,.xml,.tsv,.log,.yaml,.yml,.md"
    ).split(",")
    if ext.strip()
)

# Code files: only comments are scanned (code is masked out before analysis).
_C_STYLE = {"line": ["//"], "block": [("/*", "*/")]}
_HASH_STYLE = {"line": ["#"], "block": []}

CODE_COMMENT_STYLES = {
    ".cs": _C_STYLE,
    ".js": _C_STYLE, ".jsx": _C_STYLE, ".mjs": _C_STYLE, ".cjs": _C_STYLE,
    ".ts": _C_STYLE, ".tsx": _C_STYLE,
    ".java": _C_STYLE, ".kt": _C_STYLE, ".scala": _C_STYLE,
    ".c": _C_STYLE, ".h": _C_STYLE, ".cpp": _C_STYLE, ".hpp": _C_STYLE, ".cc": _C_STYLE,
    ".go": _C_STYLE, ".rs": _C_STYLE, ".swift": _C_STYLE,
    ".php": {"line": ["//", "#"], "block": [("/*", "*/")]},
    ".py": {"line": ["#"], "block": [('"""', '"""'), ("'''", "'''")]},
    ".rb": _HASH_STYLE, ".sh": _HASH_STYLE, ".r": _HASH_STYLE,
    ".ps1": {"line": ["#"], "block": [("<#", "#>")]},
    ".css": {"line": [], "block": [("/*", "*/")]},
    ".html": {"line": [], "block": [("<!--", "-->")]},
}

_code_ext_env = os.environ.get("PHI_SCAN_CODE_EXTENSIONS", "").strip()
if _code_ext_env:
    CODE_EXTENSIONS = {
        e.strip().lower() for e in _code_ext_env.split(",") if e.strip()
    } & set(CODE_COMMENT_STYLES)
else:
    CODE_EXTENSIONS = set(CODE_COMMENT_STYLES)

# When true, string-literal contents in code files are scanned along with
# comments; when false, only comments are scanned.
SCAN_CODE_STRINGS = os.environ.get("PHI_SCAN_CODE_STRINGS", "true").strip().lower() not in (
    "0", "false", "no", "off"
)

TARGET_ENTITIES = ["PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS", "US_SSN", "MEDICAL_RECORD_NUMBER"]

SCORE_THRESHOLD = float(os.environ.get("PHI_SCAN_SCORE_THRESHOLD", "0.7"))
NLP_MODEL = os.environ.get("PHI_SCAN_NLP_MODEL", "en_core_web_lg")

EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"  # git's fixed hash for an empty tree

DEFAULT_EXCLUDE_GLOBS = [
    "package-lock.json", "**/package-lock.json",
    "pnpm-lock.yaml", "**/pnpm-lock.yaml",
    "yarn.lock", "**/yarn.lock",
    "tsconfig*.json", "**/tsconfig*.json",
    ".eslintrc*.json", "**/.eslintrc*.json",
    "*oxlintrc.json", "**/*oxlintrc.json",
    ".github/**",
]

SCRIPT_DIR = Path(__file__).resolve().parent
IGNORE_FILE = SCRIPT_DIR / "phi_ignore.txt"
HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")


def _load_ignore_file():
    path_globs, line_regexes = [], []
    if IGNORE_FILE.exists():
        for raw in IGNORE_FILE.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("path:"):
                path_globs.append(line[len("path:"):].strip())
            elif line.startswith("regex:"):
                pattern = line[len("regex:"):].strip()
                try:
                    line_regexes.append(re.compile(pattern))
                except re.error as e:
                    print(f"::warning::Skipping invalid regex in phi_ignore.txt: {pattern!r} ({e})")
    return path_globs, line_regexes


EXTRA_EXCLUDE_GLOBS, IGNORE_REGEXES = _load_ignore_file()


def is_excluded_path(file_str):
    normalized = file_str.replace("\\", "/")
    return any(fnmatch.fnmatch(normalized, pat) for pat in DEFAULT_EXCLUDE_GLOBS + EXTRA_EXCLUDE_GLOBS)


def is_ignored_snippet(snippet):
    if "presidio:ignore" in snippet or "presidio-ignore" in snippet:
        return True
    return any(rx.search(snippet) for rx in IGNORE_REGEXES)


def setup_analyzer():
    nlp_engine = NlpEngineProvider(
        nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": NLP_MODEL}],
        }
    ).create_engine()
    analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])

    mrn_pattern = Pattern(
        name="mrn_regex",
        # NOTE: inline flag must be at the START of the pattern in modern Python
        # re (mid-pattern (?i) is deprecated/rejected) - original had this bug.
        regex=r"(?i)\b(mrn|patient_id)\s*[:=]?\s*[\"']?\d{6,10}[\"']?\b",
        score=0.85,
    )
    analyzer.registry.add_recognizer(
        PatternRecognizer(supported_entity="MEDICAL_RECORD_NUMBER", patterns=[mrn_pattern])
    )
    return analyzer


def _rev_ok(rev):
    return subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", rev],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    ).returncode == 0


def resolve_diff_range():
    head = os.environ.get("PHI_HEAD_SHA", "").strip() or "HEAD"
    base = os.environ.get("PHI_BASE_SHA", "").strip()

    if base and set(base) == {"0"}:  # all-zero SHA = no prior ref (new branch push)
        base = ""

    if base:
        if not _rev_ok(base):
            raise RuntimeError(f"PHI_BASE_SHA={base!r} is not a valid commit in this checkout")
        return base, head

    head_sha = subprocess.check_output(["git", "rev-parse", head], text=True).strip()

    for candidate in ("origin/main", "origin/master"):
        if _rev_ok(candidate):
            merge_base = subprocess.check_output(["git", "merge-base", candidate, head], text=True).strip()
            if merge_base == head_sha:
                # origin/<default> already points at the pushed commit — this is
                # the first push of the default branch (or a branch cut from its
                # tip). An empty diff here would let the entire pushed history
                # through unscanned, so scan the whole tree instead.
                return EMPTY_TREE_SHA, head
            return merge_base, head

    if _rev_ok(f"{head}~1"):
        return f"{head}~1", head
    return EMPTY_TREE_SHA, head


def get_changed_files(base, head):
    out = subprocess.check_output(
        ["git", "diff", "--no-color", "--diff-filter=ACMR", "--name-only", base, head],
        text=True,
    )
    files = []
    for line in out.splitlines():
        file_str = line.strip()
        if not file_str:
            continue
        suffix = Path(file_str).suffix.lower()
        if suffix not in DATA_EXTENSIONS and suffix not in CODE_EXTENSIONS:
            continue
        if is_excluded_path(file_str):
            continue
        files.append(file_str)
    return files


def mask_code_block(text, style, keep_strings):
    line_prefixes = style.get("line", [])
    block_pairs = style.get("block", [])
    masked_lines = []
    open_closer = None  # closing delimiter of an unterminated block comment

    for line in text.split("\n"):
        out = [" "] * len(line)
        i = 0
        if open_closer:
            end = line.find(open_closer)
            if end == -1:
                masked_lines.append(line)  # whole line is inside a block comment
                continue
            for j in range(end):
                out[j] = line[j]
            i = end + len(open_closer)
            open_closer = None
        while i < len(line):
            # comment markers are checked before the string-literal skip so that
            # openers that start with a quote char (Python's triple quotes) win
            prefix = next((p for p in line_prefixes if line.startswith(p, i)), None)
            if prefix:
                for j in range(i + len(prefix), len(line)):
                    out[j] = line[j]
                break
            pair = next((bp for bp in block_pairs if line.startswith(bp[0], i)), None)
            if pair:
                opener, closer = pair
                start = i + len(opener)
                end = line.find(closer, start)
                if end == -1:
                    for j in range(start, len(line)):
                        out[j] = line[j]
                    open_closer = closer
                    break
                for j in range(start, end):
                    out[j] = line[j]
                i = end + len(closer)
                continue
            ch = line[i]
            if ch in "\"'`":
                quote = ch
                i += 1
                while i < len(line):
                    if line[i] == "\\":
                        if keep_strings:
                            out[i] = line[i]
                            if i + 1 < len(line):
                                out[i + 1] = line[i + 1]
                        i += 2
                        continue
                    if line[i] == quote:
                        i += 1
                        break
                    if keep_strings:
                        out[i] = line[i]
                    i += 1
                continue
            i += 1
        masked_lines.append("".join(out))

    return "\n".join(masked_lines)


def get_added_blocks(base, head, file_str):
    try:
        diff_out = subprocess.check_output(
            ["git", "diff", "--no-color", "--unified=0", base, head, "--", file_str],
            text=True, errors="ignore",
        )
    except subprocess.CalledProcessError:
        return []

    if "Binary files" in diff_out or "GIT binary patch" in diff_out:
        return []

    blocks = []
    current_line = None
    block_start = None
    block_lines = []

    def flush():
        nonlocal block_start, block_lines
        if block_lines:
            blocks.append((block_start, "\n".join(block_lines)))
        block_start, block_lines = None, []

    for line in diff_out.splitlines():
        m = HUNK_RE.match(line)
        if m:
            flush()
            current_line = int(m.group(1))
            continue
        if line.startswith("+++") or line.startswith("---"):
            continue
        if line.startswith("+"):
            if block_start is None:
                block_start = current_line
            block_lines.append(line[1:])
            current_line += 1
        elif line.startswith("-") or line.startswith("\\"):
            continue  # removed lines / "\ No newline at end of file"

    flush()
    return blocks

def scan_blocks(blocks, analyzer):
    findings = []
    for start_line, text in blocks:
        if not text.strip():
            continue

        results = analyzer.analyze(
            text=text, entities=TARGET_ENTITIES, language="en", score_threshold=SCORE_THRESHOLD
        )
        if not results:
            continue

        lines = text.split("\n")
        line_offsets = []
        offset = 0
        for l in lines:
            line_offsets.append(offset)
            offset += len(l) + 1

        for res in results:
            idx = max(0, min(bisect.bisect_right(line_offsets, res.start) - 1, len(lines) - 1))
            snippet = lines[idx].strip()
            if is_ignored_snippet(snippet):
                continue
            findings.append({
                "line": start_line + idx,
                "col": res.start - line_offsets[idx] + 1,
                "entity": res.entity_type,
                "score": round(res.score, 2),
                "snippet": snippet,
            })
    return findings


def write_step_summary(rows):
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path or not rows:
        return
    lines = ["## PHI scan findings", "", "| File | Line | Entity | Score | Snippet |", "|---|---|---|---|---|"]
    for file_str, line_no, entity, score, snippet in rows:
        safe_snippet = snippet.replace("|", "\\|")[:120]
        lines.append(f"| `{file_str}` | {line_no} | {entity} | {score} | `{safe_snippet}` |")
    with open(summary_path, "a", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


def main():
    try:
        base, head = resolve_diff_range()
    except Exception as e:
        print(f"Could not determine which commits to diff: {e}")
        print("Failing closed. Fix the checkout (e.g. fetch-depth) instead of skipping the scan.")
        sys.exit(1)

    try:
        changed_files = get_changed_files(base, head)
    except subprocess.CalledProcessError as e:
        print(f"`git diff` failed while listing changed files: {e}")
        sys.exit(1)

    if not changed_files:
        print("No changed data/fixture or code files in this diff.")
        sys.exit(0)

    print(f"Loading Presidio analyzer ({NLP_MODEL})...")
    try:
        analyzer = setup_analyzer()
    except Exception as e:
        print(f"Failed to initialize Presidio analyzer: {e}")
        print(f"Make sure the spaCy model is installed: python -m spacy download {NLP_MODEL}")
        sys.exit(1)

    print(f"Scanning {len(changed_files)} changed file(s) for PHI (diff-only, {base}..{head})...\n")
    code_scope = "comments + string literals" if SCAN_CODE_STRINGS else "comments only"
    print(f"Data/fixture files are scanned in full; code files: {code_scope}.\n")

    found_phi = False
    summary_rows = []

    for file_str in changed_files:
        blocks = get_added_blocks(base, head, file_str)
        if not blocks:
            continue
        suffix = Path(file_str).suffix.lower()
        if suffix not in DATA_EXTENSIONS:
            style = CODE_COMMENT_STYLES[suffix]
            blocks = [
                (start, mask_code_block(text, style, SCAN_CODE_STRINGS))
                for start, text in blocks
            ]
        findings = scan_blocks(blocks, analyzer)
        if not findings:
            continue
        found_phi = True
        print(f"[PHI DETECTED] File: {file_str}")
        for f in findings:
            print(f"   Line {f['line']}: [{f['entity']}] (score {f['score']}) -> \"{f['snippet']}\"")
            print(f"::error file={file_str},line={f['line']},col={f['col']}::[{f['entity']}] score={f['score']}: possible PHI in added line")
            summary_rows.append((file_str, f["line"], f["entity"], f["score"], f["snippet"]))

    write_step_summary(summary_rows)

    if found_phi:
        print("\nBlocked: possible PHI found in added/modified lines of data or fixture files.")
        print("False positive? Add an inline `# presidio:ignore` marker on that line, or add a")
        print("path/regex entry to .github/scripts/phi_ignore.txt.")
        sys.exit(1)

    print("\nScan complete: no PHI indicators found in the diff.")
    sys.exit(0)


if __name__ == "__main__":
    main()
