# @willh/git-setup

## 1.3.0

- Add `--interactive` (`-i`) flag for interactive confirmation of each Git configuration command
- Add `readKey()` function to read single keypress for better user interaction
- Add `cmdWithConfirm()` helper function to handle interactive execution flow
- Improve user experience by allowing granular control over which settings to apply

## 1.2.0

- Add `git ac` alias that integrates with [aichat](https://github.com/sigoden/aichat) to automatically generate high-quality, technical, precise and concise Traditional Chinese commit messages following Conventional Commits 1.0.0 format
  - Automatically detects staged/unstaged changes and runs `git add -A` if needed
  - Checks if running in a git repository and if `aichat` command is available
  - Uses AI to analyze diff and generate commit message, then auto-commits
- Add `git undo` alias for quick undo of last commit while keeping all changes
  - Executes `git reset HEAD~` to undo the last commit
  - Preserves all changes in working directory
- Update README.md with detailed usage instructions for `git ac` and `git undo`
- Add `scripts.start` command in package.json

## 1.1.0

- Add `git aca` alias for `git add . && git commit --reuse-message=HEAD --amend`
  - Stages all changes and amends to the last commit reusing the same commit message
- Update `git acp` alias to use `--reuse-message=HEAD` instead of `-C HEAD` for better clarity
  - New command: `git add . && git commit --reuse-message=HEAD --amend && git push -f`

## 1.0.0

- **BREAKING CHANGE**: Update `core.autocrlf` configuration from `false` to `input` for cross-platform line ending consistency
- Add `core.safecrlf true` configuration to prevent mixed line endings from being committed
- This ensures all text files in repositories use LF line endings while preventing accidental mixed line ending commits
- These changes improve cross-platform collaboration between Windows, Linux, and macOS developers

## 0.10.0

- Add `init.defaultBranch` configuration set to `main` for new repositories

## 0.9.0

- Add support for `-h, --help` and `-v, --version` flags in CLI.
- Update README links: remove trailing slash from blog URL; update online course URL to `https://learn.duotify.com`.

## 0.8.0

- Add support for command-line arguments `--name` and `--email` to allow non-interactive usage
- Example: `npx @willh/git-setup --name "Your Name" --email your.email@example.com`

## 0.7.0

- Rename alias from `git rc` to `git cc` which CCleaner is a famous tool for cleaning up the system so `cc` is much easier to remember the alias.
- Add an alias `git acp` for `git add . && git commit --amend -C HEAD && git push -f`.

## 0.6.2

- Add `git rc` for execute `git reset --hard && git clean -fdx` command with confirmation.
- Update README.md

## 0.5.0

- Update `git iac` that assume `main` branch for `git init`

## 0.4.0

- Add `git iac` alias that doing `git init && git add . && git commit -m 'Initial commit'` at once.

## 0.3.0

- Add `git ls` alias that shows log with GPG signature information

    ```sh
    git config --global alias.ls "log --show-signature"
    ```

## 0.2.4

- Fix `git ignore` alias on Linux/macOS platform shell environment

    ```sh
    git config --global alias.ignore '!'"gi() { curl -sL https://www.gitignore.io/api/\$@ ;}; gi"
    ```

## 0.2.0

- Add `git ignore` alias

    git config --global alias.ignore "!gi() { curl -sL https://www.gitignore.io/api/$@ ;}; gi"

## 0.1.0

- Initial release
