const output =
    document.getElementById(
        "terminalOutput"
    );

const input =
    document.getElementById(
        "terminalInput"
    );

function print(text = "") {

    const line =
        document.createElement(
            "div"
        );

    line.textContent =
        text;

    output.appendChild(
        line
    );

    output.scrollTop =
        output.scrollHeight;
}


function clearTerminal() {

    output.innerHTML = "";
}


async function executeCommand(
    command
) {

    const args =
        command
            .trim()
            .split(/\s+/);

    const cmd =
        args[0]
            ?.toLowerCase();

    if (!cmd) {
        return;
    }

    print(
        `C:\\SITE-64> ${command}`
    );


    if (cmd === "help") {

        print("");
        print("AVAILABLE COMMANDS:");
        print("");
        print("status       SERVER STATUS");
        print("requests     SHOW REQUEST SUMMARY");
        print("sites        SHOW SITE DATABASE");
        print("time         SHOW SERVER TIME");
        print("clear        CLEAR TERMINAL");
        print("about        SYSTEM INFORMATION");
        print("");

        return;
    }


    if (cmd === "clear") {

        clearTerminal();

        return;
    }


    if (cmd === "about") {

        print("");
        print(
            "SECURECONTAINPROTECT // SITE-64"
        );
        print(
            "ADMINISTRATION TERMINAL"
        );
        print(
            "ACCESS LEVEL: O5"
        );
        print("");

        return;
    }


    if (cmd === "time") {

        print(
            new Date().toLocaleString(
                "en-GB"
            )
        );

        return;
    }


    if (cmd === "sites") {

        print("");
        print(
            "SITE-51  | SECRET     | LOCATION UNKNOWN"
        );
        print(
            "SITE-64  | TOP SECRET | LOCATION UNKNOWN"
        );
        print("");

        return;
    }


    if (cmd === "status") {

        try {

            const response =
                await fetch(
                    "/api/status",
                    {
                        cache:
                            "no-store"
                    }
                );

            const data =
                await response.json();

            print("");
            print(
                `SERVER          : ${data.server}`
            );
            print(
                `SITE            : ${data.site}`
            );
            print(
                `DATABASE        : ${data.database}`
            );
            print(
                `REQUEST SYSTEM  : ${data.requestSystem}`
            );
            print(
                `PENDING REQUESTS: ${data.pendingRequests}`
            );
            print("");

        } catch {

            print(
                "SERVER CONNECTION FAILED."
            );
        }

        return;
    }


    if (cmd === "requests") {

        try {

            const response =
                await fetch(
                    "/api/requests",
                    {
                        cache:
                            "no-store"
                    }
                );

            const data =
                await response.json();

            const requests =
                data.requests || [];

            const pending =
                requests.filter(
                    r =>
                        r.status ===
                        "PENDING"
                ).length;

            const approved =
                requests.filter(
                    r =>
                        r.status ===
                        "APPROVED"
                ).length;

            const rejected =
                requests.filter(
                    r =>
                        r.status ===
                        "REJECTED"
                ).length;

            print("");
            print(
                `TOTAL     : ${requests.length}`
            );
            print(
                `PENDING   : ${pending}`
            );
            print(
                `APPROVED  : ${approved}`
            );
            print(
                `REJECTED  : ${rejected}`
            );
            print("");

        } catch {

            print(
                "DATABASE CONNECTION FAILED."
            );
        }

        return;
    }


    print(
        `COMMAND NOT FOUND: ${cmd}`
    );

    print(
        "TYPE 'help' FOR AVAILABLE COMMANDS."
    );
}


input.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            const command =
                input.value;

            input.value = "";

            executeCommand(
                command
            );
        }
    }
);