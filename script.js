/* =========================================================
   SECURECONTAINPROTECT // SITE-64
   PUBLIC CLIENT SCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const navLinks =
        document.querySelectorAll(".navigation a");

    const sections =
        document.querySelectorAll(".page-section");

    function updateActiveNavigation() {

        let currentSection = "home";

        sections.forEach(section => {

            const rect =
                section.getBoundingClientRect();

            if (
                rect.top <= 180 &&
                rect.bottom >= 180
            ) {
                currentSection =
                    section.id;
            }

        });

        navLinks.forEach(link => {

            const target =
                link.getAttribute("href");

            link.classList.toggle(
                "active",
                target === `#${currentSection}`
            );

        });
    }

    window.addEventListener(
        "scroll",
        updateActiveNavigation
    );

    updateActiveNavigation();


    /* =====================================================
       REQUEST FORM
    ===================================================== */

    const requestForm =
        document.getElementById("requestForm");

    const result =
        document.getElementById("result");

    if (requestForm) {

        requestForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const name =
                    document
                        .getElementById("name")
                        ?.value
                        .trim();

                const type =
                    document
                        .getElementById("type")
                        ?.value;

                const time =
                    document
                        .getElementById("time")
                        ?.value;

                const message =
                    document
                        .getElementById("message")
                        ?.value
                        .trim();


                if (!name) {
                    showResult(
                        "PLEASE ENTER YOUR FULL NAME.",
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

                if (!time) {
                    showResult(
                        "PLEASE SELECT A TIME.",
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


                const hour =
                    parseInt(
                        time.split(":")[0],
                        10
                    );


                if (
                    Number.isNaN(hour) ||
                    hour < 1 ||
                    hour > 22
                ) {

                    showResult(
                        "PLEASE SELECT A VALID TIME BETWEEN 01:00 AND 22:00.",
                        "error"
                    );

                    return;
                }


                const period =
                    hour <= 12
                        ? "NIGHT"
                        : "DAY";


                const requestData = {

                    type:
                        type,

                    typeName:
                        type.toUpperCase(),

                    scp:
                        null,

                    time:
                        time,

                    period:
                        period,

                    name:
                        name,

                    message:
                        message

                };


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
                                    JSON.stringify(
                                        requestData
                                    )
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        showResult(
                            data.message ||
                            "REQUEST COULD NOT BE SUBMITTED.",
                            "error"
                        );

                        return;
                    }


                    saveMyRequest(
                        data.request
                    );


                    showResult(
                        `
                        REQUEST SUBMITTED SUCCESSFULLY.<br><br>
                        REQUEST ID:
                        <strong>${escapeHtml(data.request.id)}</strong><br>
                        STATUS:
                        <strong>PENDING</strong>
                        `,
                        "success"
                    );


                    requestForm.reset();

                    loadRequests();

                } catch (error) {

                    console.error(
                        "REQUEST ERROR:",
                        error
                    );

                    showResult(
                        "SERVER CONNECTION FAILED.",
                        "error"
                    );
                }

            }
        );
    }


    /* =====================================================
       RESULT
    ===================================================== */

    function showResult(
        message,
        type
    ) {

        if (!result) {
            return;
        }

        result.innerHTML =
            message;

        result.className =
            `result ${type}`;

        result.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       MY REQUESTS
    ===================================================== */

    const requestsList =
        document.getElementById(
            "requestsList"
        );


    function saveMyRequest(request) {

        if (!request) {
            return;
        }

        let stored =
            getMyRequests();

        if (
            !stored.some(
                item =>
                    item.id ===
                    request.id
            )
        ) {

            stored.push(request);

            localStorage.setItem(
                "scp_site64_requests",
                JSON.stringify(stored)
            );
        }
    }


    function getMyRequests() {

        try {

            const data =
                localStorage.getItem(
                    "scp_site64_requests"
                );

            if (!data) {
                return [];
            }

            const parsed =
                JSON.parse(data);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch {

            return [];
        }
    }


    async function loadRequests() {

        if (!requestsList) {
            return;
        }

        const myRequests =
            getMyRequests();


        if (!myRequests.length) {

            renderEmptyRequests();

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/requests"
                );

            if (!response.ok) {
                renderRequests(
                    myRequests
                );
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

                renderRequests(
                    myRequests
                );

                return;
            }


            const updated =
                [];


            myRequests.forEach(local => {

                const serverRequest =
                    data.requests.find(
                        server =>
                            server.id ===
                            local.id
                    );

                if (
                    serverRequest
                ) {
                    updated.push(
                        serverRequest
                    );
                } else {
                    updated.push(
                        local
                    );
                }

            });


            localStorage.setItem(
                "scp_site64_requests",
                JSON.stringify(updated)
            );


            renderRequests(
                updated
            );

        } catch {

            renderRequests(
                myRequests
            );
        }
    }


    function renderEmptyRequests() {

        requestsList.innerHTML = `

            <div class="empty-state">

                <div>
                    NO REQUESTS FOUND
                </div>

                <span>
                    SUBMITTED REQUESTS WILL APPEAR HERE.
                </span>

            </div>

        `;
    }


    function renderRequests(
        requests
    ) {

        if (!requests.length) {

            renderEmptyRequests();

            return;
        }


        requestsList.innerHTML =
            requests
                .slice()
                .reverse()
                .map(
                    createRequestCard
                )
                .join("");
    }


    function createRequestCard(
        request
    ) {

        const status =
            String(
                request.status ||
                "PENDING"
            ).toLowerCase();


        const type =
            request.typeName ||
            request.type ||
            "UNKNOWN";


        const message =
            request.adminMessage ||
            "NO ADMINISTRATIVE MESSAGE.";


        return `

            <div class="request-card">

                <div class="request-card-top">

                    <div class="request-id">
                        ${escapeHtml(
                            request.id ||
                            "UNKNOWN"
                        )}
                    </div>

                    <div class="request-status ${escapeHtml(status)}">
                        ${escapeHtml(
                            request.status ||
                            "PENDING"
                        )}
                    </div>

                </div>


                <div class="request-details">

                    <div class="request-detail">

                        <span>
                            REQUEST TYPE
                        </span>

                        <strong>
                            ${escapeHtml(type)}
                        </strong>

                    </div>


                    <div class="request-detail">

                        <span>
                            PREFERRED TIME
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
                            PERIOD
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.period ||
                                "N/A"
                            )}
                        </strong>

                    </div>

                </div>


                <div class="admin-message">

                    ${escapeHtml(
                        message
                    )}

                </div>

            </div>

        `;
    }


    /* =====================================================
       TERMINAL
    ===================================================== */

    const terminalForm =
        document.getElementById(
            "terminalForm"
        );

    const terminalInput =
        document.getElementById(
            "terminalInput"
        );

    const terminalOutput =
        document.getElementById(
            "terminalOutput"
        );


    function terminalPrint(
        text
    ) {

        if (!terminalOutput) {
            return;
        }

        terminalOutput.innerHTML +=
            `\n${escapeHtml(text)}`;

        terminalOutput.scrollTop =
            terminalOutput.scrollHeight;
    }


    if (
        terminalForm &&
        terminalInput
    ) {

        terminalForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const command =
                    terminalInput.value.trim();

                if (!command) {
                    return;
                }


                terminalPrint(
                    `> ${command}`
                );


                terminalInput.value =
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
                                        command:
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


                    terminalPrint(
                        data.output ||
                        "NO OUTPUT."
                    );

                } catch {

                    terminalPrint(
                        "TERMINAL CONNECTION ERROR."
                    );
                }

            }
        );
    }


    /* =====================================================
       SITE STATUS
    ===================================================== */

    async function loadSystemStatus() {

        try {

            const response =
                await fetch(
                    "/api/status"
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();


            const statusBoxes =
                document.querySelectorAll(
                    ".status-box strong"
                );


            if (
                statusBoxes.length >= 3
            ) {

                statusBoxes[0].textContent =
                    data.server ||
                    "ONLINE";

                statusBoxes[1].textContent =
                    data.database ||
                    "ONLINE";

                statusBoxes[2].textContent =
                    "OPERATIONAL";
            }

        } catch {

            console.warn(
                "STATUS SERVER UNAVAILABLE."
            );
        }
    }


    /* =====================================================
       HTML SECURITY
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(value)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    /* =====================================================
       START
    ===================================================== */

    loadRequests();

    loadSystemStatus();

});
