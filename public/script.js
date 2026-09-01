document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           ELEMENTS
        ================================================= */

        const requestForm =
            document.getElementById(
                "requestForm"
            );

        const typeInput =
            document.getElementById(
                "type"
            );

        const scpGroup =
            document.getElementById(
                "scpGroup"
            );

        const scpInput =
            document.getElementById(
                "scp"
            );

        const timeInput =
            document.getElementById(
                "time"
            );

        const result =
            document.getElementById(
                "result"
            );


        /* =================================================
           SCP FIELD
        ================================================= */

        if (typeInput) {

            typeInput.addEventListener(
                "change",
                () => {

                    if (
                        typeInput.value ===
                        "scp"
                    ) {

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


        /* =================================================
           SUBMIT REQUEST
        ================================================= */

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
                            .getElementById(
                                "name"
                            )
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


                    const time =
                        timeInput.value;


                    const message =
                        document
                            .getElementById(
                                "message"
                            )
                            .value
                            .trim();


                    const scp =
                        type === "scp"
                            ? scpInput.value.trim()
                            : null;


                    if (!name) {

                        showError(
                            "FULL NAME IS REQUIRED."
                        );

                        return;
                    }


                    if (!type) {

                        showError(
                            "REQUEST TYPE IS REQUIRED."
                        );

                        return;
                    }


                    if (!time) {

                        showError(
                            "PLEASE SELECT A TIME."
                        );

                        return;
                    }


                    try {

                        const response =
                            await fetch(
                                "/api/requests",
                                {
                                    method:
                                        "POST",

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
                            REQUEST SUBMITTED SUCCESSFULLY.
                            <br>
                            REQUEST ID:
                            <strong>
                                ${escapeHtml(
                                    data.request.id
                                )}
                            </strong>
                            `;


                        saveRequest(
                            data.request
                        );


                        requestForm.reset();


                        scpGroup.style.display =
                            "none";

                        scpInput.required =
                            false;


                        loadMyRequests();

                    } catch (error) {

                        showError(
                            error.message
                        );
                    }

                }
            );
        }


        /* =================================================
           LOCAL REQUESTS
        ================================================= */

        function saveRequest(request) {

            let requests =
                JSON.parse(
                    localStorage.getItem(
                        "scp_my_requests"
                    ) || "[]"
                );


            if (
                !requests.some(
                    item =>
                        item.id ===
                        request.id
                )
            ) {

                requests.push(
                    request
                );

                localStorage.setItem(
                    "scp_my_requests",
                    JSON.stringify(
                        requests
                    )
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
                    <div>
                        NO REQUESTS FOUND.
                    </div>
                    `;

                return;
            }


            container.innerHTML =
                requests
                    .map(
                        createRequestCard
                    )
                    .join("");
        }


        function createRequestCard(
            request
        ) {

            return `
                <article>

                    <strong>
                        ${escapeHtml(
                            request.id
                        )}
                    </strong>

                    <div>
                        TYPE:
                        ${escapeHtml(
                            request.typeName ||
                            request.type
                        )}
                    </div>

                    <div>
                        SCP:
                        ${escapeHtml(
                            request.scp ||
                            "N/A"
                        )}
                    </div>

                    <div>
                        TIME:
                        ${escapeHtml(
                            request.time
                        )}
                    </div>

                    <div>
                        STATUS:
                        ${escapeHtml(
                            request.status ||
                            "PENDING"
                        )}
                    </div>

                    ${
                        request.adminMessage
                            ? `
                            <div>
                                ADMIN MESSAGE:
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


        /* =================================================
           SERVER UPDATE
        ================================================= */

        async function refreshRequests() {

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


                const updated =
                    localRequests.map(
                        local => {

                            const server =
                                data.requests.find(
                                    item =>
                                        item.id ===
                                        local.id
                                );


                            return server
                                ? {
                                    ...local,
                                    ...server
                                }
                                : local;
                        }
                    );


                localStorage.setItem(
                    "scp_my_requests",
                    JSON.stringify(
                        updated
                    )
                );


                loadMyRequests();

            } catch {
                // Server unavailable.
            }
        }


        /* =================================================
           HELPERS
        ================================================= */

        function showError(
            message
        ) {

            result.className =
                "result error";

            result.textContent =
                message;
        }


        function escapeHtml(
            value
        ) {

            return String(
                value ?? ""
            )
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


        /* =================================================
           START
        ================================================= */

        loadMyRequests();

        refreshRequests();

        setInterval(
            refreshRequests,
            10000
        );

    }
);