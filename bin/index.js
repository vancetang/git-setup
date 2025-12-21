#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const os = require('os').platform();
const fs = require('fs');

// Function to read single keypress
function readKey() {
    return new Promise((resolve, reject) => {
        const wasRaw = process.stdin.isRaw;
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', (data) => {
            process.stdin.setRawMode(wasRaw);
            process.stdin.pause();

            // Handle Ctrl+C
            if (data[0] === 3) {
                console.log('\n已取消');
                process.exit(0);
            }

            // Handle 'q' key to quit
            if (data.toString().toLowerCase() === 'q') {
                console.log();
                console.log('已取消');
                process.exit(0);
            }

            resolve(data.toString());
        });
    });
}

(async function () {

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function ask(subject) {
        return new Promise((resolve, reject) => {
            readline.question(subject + ' ', (ans) => { resolve(ans); });
        });
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    let name = '';
    let email = '';
    let interactive = false;

    // Handle help flag
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage: npx @willh/git-setup [options]

Options:
  --name <name>       Set Git user.name
  --email <email>     Set Git user.email
  -i, --interactive   Enable interactive confirmation for each setting
  -h, --help          Display this help message
  -v, --version       Display version information
`);
        process.exit(0);
    }

    // Handle version flag
    if (args.includes('--version') || args.includes('-v')) {
        const pkg = require('../package.json');
        console.log(`v${pkg.version}`);
        process.exit(0);
    }

    // Check for --name and --email arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--name' && i + 1 < args.length) {
            name = args[i + 1];
            i++; // Skip the next argument as it's the value
        } else if (args[i] === '--email' && i + 1 < args.length) {
            email = args[i + 1];
            i++; // Skip the next argument as it's the value
        } else if (args[i] === '--interactive' || args[i] === '-i') {
            interactive = true;
        }
    }

    // If arguments were not provided, prompt for them
    if (!name || !email) {
        console.log('以下將會協助你進行 Git 版控環境設定：');
        console.log();

        // Read current Git user.name and user.email
        let currentName = '';
        let currentEmail = '';
        try {
            const { stdout: nameStdout } = await exec('git config --global user.name');
            currentName = nameStdout.trim();
        } catch (err) {
            // Ignore error if not set
        }
        try {
            const { stdout: emailStdout } = await exec('git config --global user.email');
            currentEmail = emailStdout.trim();
        } catch (err) {
            // Ignore error if not set
        }

        if (!name) {
            const namePrompt = currentName ? `請問您的顯示名稱？ [${currentName}]` : `請問您的顯示名稱？`;
            const input = await ask(namePrompt);
            name = input.trim() || currentName;
        }

        if (!email) {
            const emailPrompt = currentEmail ? `請問您的 E-mail 地址？ [${currentEmail}]` : `請問您的 E-mail 地址？`;
            const input = await ask(emailPrompt);
            email = input.trim() || currentEmail;
        }
    }

    if (!name) {
        console.error('You MUST configure user.name setting!');
        return;
    }

    if (!validateEmail(email)) {
        console.error('You MUST configure user.email setting!');
        return;
    }

    console.log();
    console.log('開始進行 Git 環境設定');
    console.log('------------------------------------------');

    await cmd(`git config --global user.name  ${name}`);
    await cmd(`git config --global user.email  ${email}`);

    await cmdWithConfirm("git config --global help.autocorrect 30", interactive, ask);

    await cmdWithConfirm("git config --global init.defaultBranch main", interactive, ask);
    await cmdWithConfirm("git config --global core.autocrlf input", interactive, ask);
    await cmdWithConfirm("git config --global core.safecrlf true", interactive, ask);
    await cmdWithConfirm("git config --global core.quotepath false", interactive, ask);

    await cmdWithConfirm("git config --global color.diff auto", interactive, ask);
    await cmdWithConfirm("git config --global color.status auto", interactive, ask);
    await cmdWithConfirm("git config --global color.branch auto", interactive, ask);

    await cmdWithConfirm("git config --global alias.ci   commit", interactive, ask);
    await cmdWithConfirm("git config --global alias.cm   \"commit --amend -C HEAD\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.co   checkout", interactive, ask);
    await cmdWithConfirm("git config --global alias.st   status", interactive, ask);
    await cmdWithConfirm("git config --global alias.sts  \"status -s\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.br   branch", interactive, ask);
    await cmdWithConfirm("git config --global alias.re   remote", interactive, ask);
    await cmdWithConfirm("git config --global alias.di   diff", interactive, ask);
    await cmdWithConfirm("git config --global alias.type \"cat-file -t\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.dump \"cat-file -p\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.lo   \"log --oneline\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.ls   \"log --show-signature\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.ll   \"log --pretty=format:'%h %ad | %s%d [%Cgreen%an%Creset]' --graph --date=short\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.lg   \"log --graph --pretty=format:'%Cred%h%Creset %ad |%C(yellow)%d%Creset %s %Cgreen(%cr)%Creset [%Cgreen%an%Creset]' --abbrev-commit --date=short\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.alias \"config --get-regexp ^alias\\.\"", interactive, ask);

    // --- add: alias.ac / alias.undo (cross-platform) ---
    const aliasAc = `!f() { if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then exit 0; fi; if ! command -v aichat >/dev/null 2>&1; then exit 0; fi; if git diff --cached --quiet; then if git diff --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then exit 0; fi; git add -A; fi; diff=$(git diff --cached); msg=$(printf "%s" "$diff" | aichat "依據 diff 產生高解析度、技術導向、精準且簡潔的繁體中文 Git commit 訊息。採用 Conventional Commits 1.0.0 格式撰寫。不得包含多餘語句，只輸出 commit title 與必要的 body。"); git commit -m "$msg" && git log -1; }; f`;
    const aliasUndo = `!f() { if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then echo "[undo] skip: not a git repository"; exit 0; fi; echo "[undo] Undo Last Commit: git reset HEAD~"; git reset HEAD~; }; f`;

    const escapeForSingleQuotes = (s) => s.replace(/'/g, `'\\''`);

    if (os === 'win32') {
        await cmdWithConfirm(`git config --global alias.ac "${aliasAc.replace(/"/g, '\\"')}"`, interactive, ask);
        await cmdWithConfirm(`git config --global alias.undo "${aliasUndo.replace(/"/g, '\\"')}"`, interactive, ask);
    } else {
        await cmdWithConfirm(`git config --global alias.ac '${escapeForSingleQuotes(aliasAc)}'`, interactive, ask);
        await cmdWithConfirm(`git config --global alias.undo '${escapeForSingleQuotes(aliasUndo)}'`, interactive, ask);
    }

    // git config --global alias.ignore "!gi() { curl -sL https://www.gitignore.io/api/\$@ ;}; gi"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.ignore \"!gi() { curl -sL https://www.gitignore.io/api/$@ ;}; gi\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.ignore '!'\"gi() { curl -sL https://www.gitignore.io/api/\\$@ ;}; gi\"", interactive, ask);
    }

    // git config --global alias.iac  "!giac() { git init && git add . && git commit -m 'Initial commit' ;}; giac"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.iac \"!giac() { git init -b main && git add . && git commit -m 'Initial commit' ;}; giac\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.iac '!'\"giac() { git init -b main && git add . && git commit -m 'Initial commit' ;}; giac\"", interactive, ask);
    }

    // git config --global alias.cc  "!grcc() { git reset --hard && git clean -fdx ;}; read -p 'Do you want to run the <<< git reset --hard && git clean -fdx >>> command? (Y/N) ' answer && [[ $answer == [Yy] ]] && grcc"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.cc \"!grcc() { git reset --hard && git clean -fdx ;}; read -p 'Do you want to run the <<< git reset --hard && git clean -fdx >>> command? (Y/N) ' answer && [[ $answer == [Yy] ]] && grcc\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.cc '!'\"grcc() { git reset --hard && git clean -fdx ;}; read -p 'Do you want to run the <<< git reset --hard && git clean -fdx >>> command? (Y/N) ' answer && [[ $answer == [Yy] ]] && grcc\"", interactive, ask);
    }

    // git config --global alias.acp "!gacp() { git add . && git commit --reuse-message=HEAD --amend && git push -f ;}; gacp"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.acp \"!gacp() { git add . && git commit --reuse-message=HEAD --amend && git push -f ;}; gacp\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.acp '!'\"gacp() { git add . && git commit --reuse-message=HEAD --amend && git push -f ;}; gacp\"", interactive, ask);
    }

    // git config --global alias.aca "!gaca() { git add . && git commit --reuse-message=HEAD --amend ;}; gaca"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.aca \"!gaca() { git add . && git commit --reuse-message=HEAD --amend ;}; gaca\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.aca '!'\"gaca() { git add . && git commit --reuse-message=HEAD --amend ;}; gaca\"", interactive, ask);
    }

    if (os === 'win32' && fs.existsSync('C:/PROGRA~1/TortoiseGit/bin/TortoiseGitProc.exe')) {
        await cmdWithConfirm("git config --global alias.tlog \"!start 'C:\\PROGRA~1\\TortoiseGit\\bin\\TortoiseGitProc.exe' /command:log /path:.", interactive, ask);
    }

    if (os === 'win32') {
        await cmdWithConfirm("git config --global core.editor notepad", interactive, ask);
    }

    if (!process.env.LC_ALL) {
        if (os === 'win32') {
            await cmd("SETX LC_ALL C.UTF-8");
            console.log("請重新啟動應用程式或命令提示字元以讓環境變數生效！");
        } else {
            console.log("BE REMEMBER SETUP THE FOLLOWING ENVIRONMENT VARIABLE:");
            console.warn("export LC_ALL=C.UTF-8");
        }
    }

    if (!process.env.LANG) {
        if (os === 'win32') {
            await cmd("SETX LANG C.UTF-8");
            console.log("請重新啟動應用程式或命令提示字元以讓環境變數生效！");
        } else {
            console.log("BE REMEMBER SETUP THE FOLLOWING ENVIRONMENT VARIABLE:");
            console.warn("export LANG=C.UTF-8");
        }
    }

    readline.close();
})();

async function cmd(command) {
    console.log(command);
    const { stdout, stderr } = await exec(command);
    if (stderr) {
        console.debug(stderr);
        return;
    }
    if (stdout) {
        console.log(stdout);
    }
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

async function cmdWithConfirm(command, interactive, ask) {
    if (interactive) {
        process.stdout.write(`執行此命令嗎？ ${command} (y/n/q): `);
        const key = await readKey();
        console.log(); // Just print newline without echoing the key
        if (key.toLowerCase() !== 'y') {
            console.log('已跳過');
            return;
        }
    }
    await cmd(command);
    if (interactive) {
        console.log('已設定');
    }
}