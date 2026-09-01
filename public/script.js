document.addEventListener("DOMContentLoaded", () => {

    const navigationLinks =
        document.querySelectorAll(".navigation a");

    const sections =
        document.querySelectorAll(".page-section");


    /* =====================================================
       NAVIGATION
    ====================================================== */

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

            const target =
                link.getAttribute("href").substring(1);

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
       REQUEST FORM
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


    if (typeInput) {

        typeInput.addEventListener(
            "change",
            () => {

                if (typeInput.value === "scp") {

                    scpGroup.style.display =
                        "block";

                    scpInput.required =
                        true;

                } else {

                    scpGroup.style.display =
                        "none";

                    scpInput.required =
                        false;

                    scpInput.value =
                        "";
                }
            }
        );
    }


    if (requestForm) {

        requestForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                result.className =
                    "result";

                result.textContent =
                    "SUBMITTING REQUEST...";


                const name =
                    document
                        .getElementById("name")
                        .value
                        .trim();


                const type =
                    typeInput.value;


                const typeName =
                    typeInput
                        .options[
                            typeInput.selectedIndex
                        ]
                        .text;


                const scp =
                    type === "scp"
                        ? scpInput.value.trim()
                        : null;


                const time =
                    document
                        .getElementById("time")
                        .value;


                const message =
                    document
                        .getElementById("message")
                        .value
                        .trim();


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
                                        name,
                                        type,
                                        typeName,
                                        scp,
                                        time,
                                        message
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "REQUEST FAILED."
                        );
                    }


                    result.className =
                        "result success";


                    result.innerHTML =
                        `
                        REQUEST SUBMITTED SUCCESSFULLY.<br>
                        REQUEST ID:
                        <strong>
                            ${escapeHtml(
                                data.request.id
                            )}
                        </strong>
                        `;


                    saveMyRequest(
                        data.request
                    );


                    requestForm.reset();


                    scpGroup.style.display =
                        "none";


                    scpInput.required =
                        false;


                    loadMyRequests();

                } catch (error) {

                    result.className =
                        "result error";

                    result.textContent =
                        error.message;
                }
            }
        );
    }


    /* =====================================================
       LOCAL REQUESTS
    ====================================================== */

    function saveMyRequest(request) {

        let requests =
            JSON.parse(
                localStorage.getItem(
                    "scp_my_requests"
                ) || "[]"
            );


        if (
            !requests.some(
                item =>
                    item.id === request.id
            )
        ) {

            requests.push(request);

            localStorage.setItem(
                "scp_my_requests",
                JSON.stringify(requests)
            );
        }
    }


    function loadMyRequests() {

        const container =
            document.getElementById(
                "myRequestsList"
            );


        if (!container) {
            return;
        }


        const requests =
            JSON.parse(
                localStorage.getItem(
                    "scp_my_requests"
                ) || "[]"
            );


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
                        createRequestCard(request)
                )
                .join("");


        refreshMyRequests();
    }


    function createRequestCard(request) {

        const status =
            String(
                request.status || "PENDING"
            ).toLowerCase();


        return `
            <article class="request-card">

                <div class="request-card-top">

                    <span class="request-id">
                        ${escapeHtml(
                            request.id
                        )}
                    </span>

                    <span
                        class="request-status ${status}"
                    >
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
                            SCP
                        </span>

                        <strong>
                            ${escapeHtml(
                                request.scp ||
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

                </div>


                ${
                    request.adminMessage
                        ? `
                        <div class="admin-message">

                            <strong>
                                ADMIN MESSAGE
                            </strong>

                            <br>

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


    async function refreshMyRequests() {

        const localRequests =
            JSON.parse(
                localStorage.getItem(
                    "scp_my_requests"
                ) || "[]"
            );


        if (!localRequests.length) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/requests"
                );


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


            let changed = false;


            const updated =
                localRequests.map(local => {

                    const serverRequest =
                        data.requests.find(
                            item =>
                                item.id ===
                                local.id
                        );


                    if (serverRequest) {

                        changed = true;

                        return {
                            ...local,
                            ...serverRequest
                        };
                    }


                    return local;
                });


            if (changed) {

                localStorage.setItem(
                    "scp_my_requests",
                    JSON.stringify(updated)
                );


                loadMyRequests();
            }

        } catch {
            // Server may be unavailable.
        }
    }


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    loadMyRequests();

});