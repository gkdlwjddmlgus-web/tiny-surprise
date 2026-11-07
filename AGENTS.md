# Repository workflow

- This directory is the working project for https://github.com/gkdlwjddmlgus-web/tiny-surprise.
- Before edits, inspect the current branch, `git status`, and relevant changes.
- Work on a task branch; preserve the existing structure and working features.
- Do not create unnecessary ZIP archives or duplicate project copies.
- Run checks appropriate to each change and report changed files and test results concisely.
- Record code changes in Git commits. Push the working branch when authorized and credentials allow it.
- If a push fails, preserve local commits and report the reason.
- Never force-push main.

## Automatic pull request merging

- Start each task branch from the latest fetched main, after checking the current branch and uncommitted changes. Preserve unrelated changes.
- Run the relevant tests after making changes and check the existing core flows for regressions.
- When all relevant tests pass and the core features remain intact, create a pull request and merge it into main without asking for separate merge approval.
- Do not merge when tests fail, core features break, conflicts remain unresolved, major functionality is removed or unexpectedly changed, deployment settings change materially, secrets or personal information are unintentionally exposed, or testing cannot establish the safety of the changes. Report the issue to the user instead.
- Never bypass repository permissions, required checks, review requirements or branch protection. Never force-push main.
- After merging, confirm the latest main commit SHA. Verify Streamlit Cloud automatic redeployment and the actual deployed app when access allows it.
- If deployment access is unavailable, report the merge as complete and deployment as unverified. Never claim deployment success from a merge alone.
- Final reports must include test results, merge status, final main commit SHA and deployment verification status.
