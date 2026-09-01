document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       NAVIGATION
    ====================================================== */

    const navigationLinks =
        document.querySelectorAll(".navigation a");

    const sections =
        document.querySelectorAll("section[id]");

    function updateNavigation() {

        let current = "home";

        sections.forEach(section => {

            const top =
                section.getBoundingClientRect().top;

            if (top <= 180) {
                current = section.id;
            }

        });

        navigationLinks.forEach(link => {

            const href =
                link.getAttribute("href");

            if (!href || !href.startsWith("#")) {
                return;
            }

            const target =
                href.substring(1);

            link.classList.toggle(
                "active",
                target === current
            );

        });

    }

    window.addEventListener(
        "scroll",
        updateNavigation
    );

    updateNavigation();


    /* =====================================================
       REQUEST SYSTEM
    ====================================================== */

    const requestForm =
        document.getElementById("requestForm");

    const typeInput =
        document.getElementById("type");

    const scpGroup =
        document.getElementById("scpGroup");

    const scpInput =
        document.getElementById("scp");

    const result =
        document.getElementById("result");


    /* =====================================================
       REQUEST TYPE
    ====================================================== */

    function updateSCPField() {

        if (!typeInput) {
            return;
        }

        const selectedType =
            typeInput.value;

        const isSCP =
            selectedType === "scp";

        if (scpGroup) {

            scpGroup.style.display =
                isSCP
                    ? "block"
                    : "none";
        }

        if (scpInput) {

            scpInput.required =
                isSCP;

            if (!isSCP) {
                scpInput.value = "";
            }

        }

    }


    if (typeInput) {

        typeInput.addEventListener(
            "change",
            updateSCPField
        );

        updateSCPField();

    }


    /* =====================================================
       SHOW RESULT
    ====================================================== */

    function showResult(
        message,
        type = ""
    ) {

        if (!result) {
            return;
        }

        result.className =
            type
                ? `result ${type}`
                : "result";

        result.textContent =
            message;

    }


    /* =====================================================
       SUBMIT REQUEST
    ====================================================== */

    if (requestForm) {

        requestForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                /* -----------------------------------------
                   BASIC DATA
                ------------------------------------------ */

                const nameInput =
                    document.getElementById("name");

                const dateInput =
                    document.getElementById("date");

                const timeInput =
                    document.getElementById("time");

                const messageInput =
                    document.getElementById("message");


                const name =
                    nameInput?.value.trim() || "";

                const type =
                    typeInput?.value || "";

                const date =
                    dateInput?.value || "";

                const time =
                    timeInput?.value || "";

                const message =
                    messageInput?.value.trim() || "";


                let typeName = "";

                if (
                    typeInput &&
                    typeInput.selectedIndex >= 0
                ) {

                    typeName =
                        typeInput.options[
                            typeInput.selectedIndex
                        ].text.trim();

                }


                const scp =
                    type === "scp"
                        ? scpInput?.value || ""
                        : null;


                /* -----------------------------------------
                   VALIDATION
                ------------------------------------------ */

                if (!name) {

                    showResult(
                        "PLEASE ENTER YOUR NAME.",
                        "error"
                    );

                    return;
                }


                if (!type) {

                    showResult(
                        "PLEASE SELECT A REQUEST TYPE.",
                        "error"
                    );

                    return;
                }


                if (type === "auto_inspection") {

                    showResult(
                        "AUTO INSPECTION CANNOT BE SELECTED.",
                        "error"
                    );

                    return;
                }


                if (!date) {

                    showResult(
                        "PLEASE SELECT A DATE.",
                        "error"
                    );

                    return;
                }


                if (!time) {

                    showResult(
                        "PLEASE SELECT A TIME.",
                        "error"
                    );

                    return;
                }


                if (type === "scp" && !scp) {

                    showResult(
                        "PLEASE SELECT AN SCP.",
                        "error"
                    );

                    return;
                }


                if (!message) {

                    showResult(
                        "PLEASE ENTER REQUEST DETAILS.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   SUBMITTING
                ------------------------------------------ */

                showResult(
                    "SUBMITTING REQUEST..."
                );


                try {

                    const response =
                        await fetch(
                            "/api/requests",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        name:
                                            name,

                                        type:
                                            type,

                                        typeName:
                                            typeName,

                                        scp:
                                            scp,

                                        date:
                                            date,

                                        time:
                                            time,

                                        message:
                                            message

                                    })
                            }
                        );


                    let data;

                    try {

                        data =
                            await response.json();

                    } catch {

                        throw new Error(
                            "SERVER RETURNED INVALID DATA."
                        );

                    }


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "REQUEST FAILED."
                        );

                    }


                    if (
                        !data.request ||
                        !data.request.id
                    ) {

                        throw new Error(
                            "REQUEST WAS NOT CREATED."
                        );

                    }


                    /* -------------------------------------
                       SUCCESS
                    -------------------------------------- */

                    if (result) {

                        result.className =
                            "result success";

                        result.innerHTML =
                            `
                            REQUEST SUBMITTED SUCCESSFULLY.<br><br>

                            REQUEST ID:
                            <strong>
                                ${escapeHtml(
                                    data.request.id
                                )}
                            </strong>
                            `;

                    }


                    saveMyRequest(
                        data.request
                    );


                    requestForm.reset();


                    updateSCPField();


                    loadMyRequests();

                } catch (error) {

                    console.error(
                        "REQUEST ERROR:",
                        error
                    );


                    showResult(
                        error.message ||
                        "REQUEST FAILED.",
                        "error"
                    );

                }

            }
        );

    }


    /* =====================================================
       SAVE MY REQUEST
    ====================================================== */

    function saveMyRequest(request) {

        let requests = [];


        try {

            requests =
                JSON.parse(
                    localStorage.getItem(
                        "scp_my_requests"
                    ) || "[]"
                );

        } catch {

            requests = [];

        }


        const existingIndex =
            requests.findIndex(
                item =>
                    item.id === request.id
            );


        if (existingIndex === -1) {

            requests.push(
                request
            );

        } else {

            requests[existingIndex] =
                {
                    ...requests[existingIndex],
                    ...request
                };

        }


        localStorage.setItem(
            "scp_my_requests",
            JSON.stringify(requests)
        );

    }


    /* =====================================================
       LOAD MY REQUESTS
    ====================================================== */

    function loadMyRequests() {

        const container =
            document.getElementById(
                "myRequestsList"
            );


        if (!container) {
            return;
        }


        let requests = [];


        try {

            requests =
                JSON.parse(
                    localStorage.getItem(
                        "scp_my_requests"
                    ) || "[]"
                );

        } catch {

            requests = [];

        }


        if (!requests.length) {

            container.innerHTML =
                `
                <div class="empty-state">

                    <div>
                        NO REQUESTS FOUND
                    </div>

                    <span>
                        Submitted requests will appear here.
                    </span>

                </div>
                `;

            return;
        }


        container.innerHTML =
            requests
                .map(
                    request =>
                        createRequestCard(
                            request
                        )
                )
                .join("");


        refreshMyRequests();

    }


    /* =====================================================
       CREATE REQUEST CARD
    ====================================================== */

    function createRequestCard(request) {

        const status =
            String(
                request.status ||
                "PENDING"
            ).toLowerCase();


        return `
            <article class="request-card">

                <div class="request-card-top">

                    <span class="request-id">
                        ${escapeHtml(
                            request.id
                        )}
                    </span>

                    <span class="request-status ${escapeHtml(status)}">
                        ${escapeHtml(
                            request.status ||
                            "PENDING"
                        )}
                    </span>

                </div>


                <div class="request-details">

                    <div class="request-detail">

                        <span>
                            REQUEST TYPE
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.typeName ||
                                request.type ||
                                "UNKNOWN"
                            )}
                        </strong>

                    </div>


                    <div class="request-detail">

                        <span>
                            DATE
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.date ||
                                "N/A"
                            )}
                        </strong>

                    </div>


                    <div class="request-detail">

                        <span>
                            TIME
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.time ||
                                "N/A"
                            )}
                        </strong>

                    </div>


                    <div class="request-detail">

                        <span>
                            SCP
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.scp ||
                                "N/A"
                            )}
                        </strong>

                    </div>

                </div>


                ${
                    request.message
                        ? `
                        <div class="admin-message">

                            <strong>
                                REQUEST DETAILS
                            </strong>

                            <br><br>

                            ${escapeHtml(
                                request.message
                            )}

                        </div>
                        `
                        : ""
                }


                ${
                    request.adminMessage
                        ? `
                        <div class="admin-message">

                            <strong>
                                ADMIN MESSAGE
                            </strong>

                            <br><br>

                            ${escapeHtml(
                                request.adminMessage
                            )}

                        </div>
                        `
                        : ""
                }

            </article>
        `;

    }


    /* =====================================================
       REFRESH REQUESTS FROM SERVER
    ====================================================== */

    async function refreshMyRequests() {

        let localRequests = [];


        try {

            localRequests =
                JSON.parse(
                    localStorage.getItem(
                        "scp_my_requests"
                    ) || "[]"
                );

        } catch {

            return;

        }


        if (!localRequests.length) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/requests"
                );


            if (!response.ok) {
                return;
            }


            const data =
                await response.json();


            if (
                !data.success ||
                !Array.isArray(
                    data.requests
                )
            ) {

                return;

            }


            const updated =
                localRequests.map(
                    localRequest => {

                        const serverRequest =
                            data.requests.find(
                                serverItem =>
                                    serverItem.id ===
                                    localRequest.id
                            );


                        if (serverRequest) {

                            return {
                                ...localRequest,
                                ...serverRequest
                            };

                        }


                        return localRequest;

                    }
                );


            localStorage.setItem(
                "scp_my_requests",
                JSON.stringify(updated)
            );


            const container =
                document.getElementById(
                    "myRequestsList"
                );


            if (container) {

                container.innerHTML =
                    updated
                        .map(
                            request =>
                                createRequestCard(
                                    request
                                )
                        )
                        .join("");

            }

        } catch (error) {

            console.warn(
                "REQUEST REFRESH ERROR:",
                error
            );

        }

    }


    loadMyRequests();


    /* =====================================================
       TERMINAL
    ====================================================== */

    const terminalForm =
        document.getElementById(
            "terminalForm"
        );

    const terminalCommand =
        document.getElementById(
            "terminalCommand"
        );

    const terminalOutput =
        document.getElementById(
            "terminalOutput"
        );


    function addTerminalOutput(text) {

        if (!terminalOutput) {
            return;
        }


        const line =
            document.createElement(
                "div"
            );


        line.textContent =
            text;


        terminalOutput.appendChild(
            line
        );


        terminalOutput.scrollTop =
            terminalOutput.scrollHeight;

    }


    if (
        terminalForm &&
        terminalCommand &&
        terminalOutput
    ) {

        terminalForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const command =
                    terminalCommand.value.trim();


                if (!command) {
                    return;
                }


                addTerminalOutput(
                    "> " + command
                );


                terminalCommand.value =
                    "";


                try {

                    const response =
                        await fetch(
                            "/api/terminal",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        command
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        data.output ===
                        "__CLEAR__"
                    ) {

                        terminalOutput.innerHTML =
                            "";

                        return;

                    }


                    addTerminalOutput(
                        data.output ||
                        "NO OUTPUT."
                    );

                } catch {

                    addTerminalOutput(
                        "TERMINAL CONNECTION ERROR."
                    );

                }

            }
        );

    }


    /* =====================================================
       SERVER STATUS
    ====================================================== */

    async function loadServerStatus() {

        const serverStatus =
            document.getElementById(
                "serverStatus"
            );

        const databaseStatus =
            document.getElementById(
                "databaseStatus"
            );


        try {

            const response =
                await fetch(
                    "/api/status"
                );


            if (!response.ok) {
                throw new Error(
                    "STATUS REQUEST FAILED"
                );
            }


            const data =
                await response.json();


            if (serverStatus) {

                serverStatus.textContent =
                    data.server ||
                    "ONLINE";

            }


            if (databaseStatus) {

                databaseStatus.textContent =
                    data.database ||
                    "ONLINE";

            }

        } catch {

            if (serverStatus) {

                serverStatus.textContent =
                    "OFFLINE";

            }


            if (databaseStatus) {

                databaseStatus.textContent =
                    "OFFLINE";

            }

        }

    }


    loadServerStatus();


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }

});