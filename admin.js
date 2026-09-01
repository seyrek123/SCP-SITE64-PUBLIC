/* =========================================
   ADMIN NAVIGATION
========================================= */

document
    .querySelectorAll(".admin-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                document
                    .querySelectorAll(
                        ".admin-tab"
                    )
                    .forEach(item =>
                        item.classList
                            .remove("active")
                    );

                document
                    .querySelectorAll(
                        ".admin-page"
                    )
                    .forEach(item =>
                        item.classList
                            .remove("active")
                    );

                button.classList
                    .add("active");

                const target =
                    document.getElementById(
                        page
                    );

                if (target) {
                    target.classList
                        .add("active");
                }

                if (page === "requests") {
                    loadAdminRequests();
                }

                if (page === "sites") {
                    loadSites();
                }

            }
        );

    });


/* =========================================
   REQUESTS
========================================= */

async function loadAdminRequests() {

    const container =
        document.getElementById(
            "adminRequests"
        );

    try {

        const response =
            await fetch(
                "/api/requests"
            );

        const data =
            await response.json();

        if (
            !data.requests ||
            !data.requests.length
        ) {

            container.innerHTML = `
                <div class="empty-request">
                    NO REQUESTS IN DATABASE.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.requests
            .slice()
            .reverse()
            .forEach(request => {

                container.appendChild(
                    createRequestCard(
                        request
                    )
                );

            });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-request">
                DATABASE CONNECTION FAILED.
            </div>
        `;
    }
}


function createRequestCard(request) {

    const card =
        document.createElement("div");

    card.className =
        "request-card";

    const status =
        request.status ||
        "PENDING";

    card.innerHTML = `

        <div class="request-card-top">

            <strong>
                ${escapeHTML(request.id)}
            </strong>

            <span class="status ${status.toLowerCase()}">
                ${escapeHTML(status)}
            </span>

        </div>

        <div class="request-info">

            <div>
                TYPE
                <strong>
                    ${escapeHTML(
                        request.typeName ||
                        request.type ||
                        "-"
                    )}
                </strong>
            </div>

            <div>
                SCP
                <strong>
                    ${escapeHTML(
                        request.scp ||
                        "N/A"
                    )}
                </strong>
            </div>

            <div>
                TIME
                <strong>
                    ${escapeHTML(
                        request.time ||
                        "-"
                    )}
                </strong>
            </div>

            <div>
                PERIOD
                <strong>
                    ${escapeHTML(
                        request.period ||
                        "-"
                    )}
                </strong>
            </div>

        </div>

        <div style="margin-top:18px;">

            <small style="color:#777;">
                O5 RESPONSE
            </small>

            <textarea
                class="admin-message"
                placeholder="Enter response..."
            >${escapeHTML(
                request.adminMessage || ""
            )}</textarea>

        </div>

        <div class="admin-controls">

            <input
                class="admin-time"
                type="time"
                min="01:00"
                max="22:00"
                value="${escapeHTML(
                    request.time || ""
                )}"
                style="
                    width:100%;
                    box-sizing:border-box;
                    background:#030303;
                    border:1px solid #292929;
                    color:white;
                    padding:12px;
                "
            >

            <button class="change-time">
                CHANGE TIME
            </button>

            <button class="approve-request">
                APPROVE REQUEST
            </button>

            <button class="reject-request">
                REJECT REQUEST
            </button>

        </div>
    `;

    const message =
        card.querySelector(
            ".admin-message"
        );

    const time =
        card.querySelector(
            ".admin-time"
        );

    card.querySelector(
        ".approve-request"
    ).addEventListener(
        "click",
        () => {

            updateRequest(
                request.id,
                "approve",
                {
                    message:
                        message.value,
                    time:
                        time.value
                }
            );

        }
    );

    card.querySelector(
        ".reject-request"
    ).addEventListener(
        "click",
        () => {

            updateRequest(
                request.id,
                "reject",
                {
                    message:
                        message.value
                }
            );

        }
    );

    card.querySelector(
        ".change-time"
    ).addEventListener(
        "click",
        () => {

            updateRequest(
                request.id,
                "time",
                {
                    time:
                        time.value
                }
            );

        }
    );

    return card;
}


/* =========================================
   REQUEST UPDATE
========================================= */

async function updateRequest(
    id,
    action,
    data
) {

    let endpoint;

    if (action === "approve") {

        endpoint =
            `/api/requests/${id}/approve`;

    } else if (
        action === "reject"
    ) {

        endpoint =
            `/api/requests/${id}/reject`;

    } else {

        endpoint =
            `/api/requests/${id}/time`;

    }

    try {

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Operation failed."
            );

        }

        await loadAdminRequests();

    } catch (error) {

        alert(error.message);

    }
}


/* =========================================
   SITES
========================================= */

async function loadSites() {

    const container =
        document.getElementById(
            "siteGrid"
        );

    try {

        const response =
            await fetch(
                "/api/sites"
            );

        const data =
            await response.json();

        if (
            !data.sites ||
            !data.sites.length
        ) {

            container.innerHTML = `
                <div class="empty-request">
                    NO SITES REGISTERED.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.sites
            .slice()
            .reverse()
            .forEach(site => {

                container.appendChild(
                    createSiteCard(site)
                );

            });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-request">
                SITE DATABASE CONNECTION FAILED.
            </div>
        `;
    }
}


function createSiteCard(site) {

    const card =
        document.createElement("div");

    card.className =
        "site-card";

    card.innerHTML = `

        <div class="site-code">
            ${escapeHTML(site.code)}
        </div>

        <h3>
            ${escapeHTML(site.name)}
        </h3>

        <div style="color:#777;">
            ${escapeHTML(
                site.location ||
                "CLASSIFIED"
            )}
        </div>

        <span class="site-status">
            ${escapeHTML(
                site.status ||
                "OPERATIONAL"
            )}
        </span>

        <div class="site-description">
            ${escapeHTML(
                site.description ||
                "No description available."
            )}
        </div>

        <button
            class="delete-site"
            data-id="${escapeHTML(site.id)}">

            DELETE SITE

        </button>
    `;

    card
        .querySelector(".delete-site")
        .addEventListener(
            "click",
            async () => {

                const confirmed =
                    confirm(
                        `Delete ${site.code}?`
                    );

                if (!confirmed) {
                    return;
                }

                try {

                    const response =
                        await fetch(
                            `/api/sites/${site.id}`,
                            {
                                method:
                                    "DELETE"
                            }
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.message ||
                            "Failed to delete site."
                        );
                    }

                    loadSites();

                } catch (error) {

                    alert(
                        error.message
                    );

                }

            }
        );

    return card;
}


/* =========================================
   CREATE SITE
========================================= */

document
    .getElementById("siteForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const site = {

                name:
                    document.getElementById(
                        "siteName"
                    ).value.trim(),

                code:
                    document.getElementById(
                        "siteCode"
                    ).value.trim(),

                location:
                    document.getElementById(
                        "siteLocation"
                    ).value.trim(),

                status:
                    document.getElementById(
                        "siteStatus"
                    ).value,

                description:
                    document.getElementById(
                        "siteDescription"
                    ).value.trim()

            };

            try {

                const response =
                    await fetch(
                        "/api/sites",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body:
                                JSON.stringify(site)
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to create site."
                    );

                }

                event.target.reset();

                loadSites();

            } catch (error) {

                alert(
                    error.message
                );

            }

        }
    );


/* =========================================
   TERMINAL
========================================= */

const terminalInput =
    document.getElementById(
        "terminalCommand"
    );

const terminalOutput =
    document.getElementById(
        "terminalOutput"
    );


terminalInput.addEventListener(
    "keydown",
    async event => {

        if (event.key !== "Enter") {
            return;
        }

        const command =
            terminalInput.value.trim();

        if (!command) {
            return;
        }

        terminalInput.value = "";

        appendTerminal(
            `> ${command}`
        );

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

                terminalOutput.textContent =
                    "";

                return;
            }

            appendTerminal(
                data.output ||
                ""
            );

        } catch (error) {

            appendTerminal(
                "TERMINAL CONNECTION FAILED."
            );

        }

    }
);


function appendTerminal(text) {

    terminalOutput.textContent +=
        `\n${text}\n`;

    terminalOutput.scrollTop =
        terminalOutput.scrollHeight;
}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   START
========================================= */

loadAdminRequests();
loadSites();

setInterval(
    () => {

        const requestsPage =
            document.getElementById(
                "requests"
            );

        const sitesPage =
            document.getElementById(
                "sites"
            );

        if (
            requestsPage.classList
                .contains("active")
        ) {
            loadAdminRequests();
        }

        if (
            sitesPage.classList
                .contains("active")
        ) {
            loadSites();
        }

    },
    5000
);