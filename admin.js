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

                    ŞU ANDA BEKLEYEN VEYA TAMAMLANMIŞ
                    TALEP YOK.

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
                    createAdminCard(
                        request
                    )
                );

            });

    }

    catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-request">

                DATABASE CONNECTION FAILED.

                <br><br>

                SERVER.JS ÇALIŞIYOR MU?

            </div>

        `;

    }

}


function createAdminCard(
    request
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "request-card";


    const status =
        request.status ||
        "PENDING";


    card.innerHTML = `

        <div class="request-card-top">

            <strong>
                ${request.id}
            </strong>

            <span
                class="status
                ${status.toLowerCase()}">

                ${status}

            </span>

        </div>


        <div class="request-info">

            <div>
                TÜR

                <strong>
                    ${request.typeName}
                </strong>
            </div>


            <div>
                SCP

                <strong>
                    ${request.scp || "N/A"}
                </strong>
            </div>


            <div>
                SAAT

                <strong>
                    ${request.time}
                </strong>
            </div>


            <div>
                DÖNEM

                <strong>
                    ${request.period}
                </strong>
            </div>

        </div>


        <div
            class="admin-response"
            style="margin-top:15px;">

            <small>
                O5 RESPONSE
            </small>

            <textarea
                class="admin-message"
                placeholder="Talep cevabını buraya yaz..."
                style="
                    width:100%;
                    min-height:80px;
                    margin-top:10px;
                    padding:12px;
                    resize:vertical;
                    background:#030303;
                    border:1px solid #292929;
                    color:white;
                    outline:none;
                "
            >${request.adminMessage || ""}</textarea>

        </div>


        <div
            style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-top:10px;
            ">

            <input
                type="time"
                class="admin-time"
                value="${request.time}"
                style="
                    padding:13px;
                    background:#030303;
                    border:1px solid #292929;
                    color:white;
                "
            >


            <button
                class="submit-button change-time">

                SAATİ DEĞİŞTİR

            </button>


            <button
                class="submit-button approve-request">

                TALEBİ KABUL ET

            </button>


            <button
                class="submit-button reject-request"
                style="
                    background:#350000;
                    border-color:#700000;
                ">

                TALEBİ REDDET

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
    )
    .addEventListener(
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
    )
    .addEventListener(
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
    )
    .addEventListener(
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


async function updateRequest(
    id,
    action,
    data
) {

    let endpoint;


    if (action === "approve") {

        endpoint =
            `/api/requests/${id}/approve`;

    }

    else if (
        action === "reject"
    ) {

        endpoint =
            `/api/requests/${id}/reject`;

    }

    else {

        endpoint =
            `/api/requests/${id}/time`;

    }


    try {

        const response =
            await fetch(
                endpoint,
                {

                    method:
                        "POST",

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
                "İşlem başarısız."
            );

        }


        await loadAdminRequests();


    }

    catch (error) {

        alert(
            error.message
        );

    }

}


loadAdminRequests();


setInterval(
    loadAdminRequests,
    5000
);