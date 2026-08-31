let selectedType = null;
let selectedSCP = null;
let selectedTime = null;
let selectedPeriod = null;


const requestTypes = [

    {
        id: "hygiene",
        name: "HYGIENE",
        description: "Temizlik ve hijyen talebi."
    },

    {
        id: "control",
        name: "CONTROL",
        description: "Site kontrol ve güvenlik talebi."
    },

    {
        id: "inspection",
        name: "INSPECTION",
        description: "Belirli bir alan için inceleme talebi."
    },

    {
        id: "auto",
        name: "AUTO INSPECTION",
        description: "Otomatik inceleme talebi."
    },

    {
        id: "scp",
        name: "SCP",
        description: "Bir SCP hakkında kontrol talebi."
    }

];


const scps = [

    ["SCP-049", "THE PLAGUE DOCTOR"],
    ["SCP-096", "THE SHY GUY"],
    ["SCP-173", "THE SCULPTURE"],
    ["SCP-682", "HARD-TO-DESTROY REPTILE"],
    ["SCP-106", "THE OLD MAN"],
    ["SCP-939", "WITH MANY VOICES"],
    ["SCP-079", "OLD AI"],
    ["SCP-999", "THE TICKLE MONSTER"],
    ["SCP-3008", "INFINITE IKEA"],
    ["SCP-087", "THE STAIRWELL"],
    ["SCP-055", "UNKNOWN"],
    ["SCP-2521", "UNKNOWN"]

];


function $(id) {
    return document.getElementById(id);
}


/* =========================================
   NAVIGATION
========================================= */

document.querySelectorAll(".nav-button")
.forEach(button => {

    button.addEventListener("click", () => {

        showPage(
            button.dataset.page
        );

    });

});


function showPage(pageId) {

    document.querySelectorAll(".page")
    .forEach(page => {

        page.classList.remove("active");

    });


    document.querySelectorAll(".nav-button")
    .forEach(button => {

        button.classList.remove("active");

    });


    const page =
        $(pageId);

    if (page) {

        page.classList.add("active");

    }


    const button =
        document.querySelector(
            `.nav-button[data-page="${pageId}"]`
        );


    if (button) {

        button.classList.add("active");

    }


    if (pageId === "myrequests") {

        loadRequests();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   HOME
========================================= */

$("startRequest")
.addEventListener("click", () => {

    showPage("request");

});


/* =========================================
   REQUEST TYPES
========================================= */

function renderRequestTypes() {

    const container =
        $("requestTypes");

    container.innerHTML = "";


    requestTypes.forEach(type => {

        const button =
            document.createElement("button");


        button.className =
            "request-option";


        button.innerHTML = `

            <strong>
                ${type.name}
            </strong>

            <small>
                ${type.description}
            </small>

        `;


        button.addEventListener(
            "click",
            () => {

                selectType(
                    type.id,
                    button
                );

            }
        );


        container.appendChild(
            button
        );

    });

}


function selectType(
    type,
    button
) {

    selectedType =
        type;

    selectedSCP =
        null;

    selectedTime =
        null;

    selectedPeriod =
        null;


    document.querySelectorAll(
        ".request-option"
    )
    .forEach(element => {

        element.classList.remove(
            "selected"
        );

    });


    button.classList.add(
        "selected"
    );


    if (type === "scp") {

        $("scpStep")
        .classList
        .remove("hidden");

        renderSCPs();

    }

    else {

        $("scpStep")
        .classList
        .add("hidden");

    }


    $("timeStep")
    .classList
    .remove("hidden");


    $("summary")
    .classList
    .add("hidden");


    clearTimeSelection();

    updateSummary();

}


/* =========================================
   SCP
========================================= */

function renderSCPs() {

    const container =
        $("scpList");

    container.innerHTML = "";


    $("selectedSCP")
        .textContent =
        "SCP SEÇİLMEDİ";


    scps.forEach(scp => {

        const button =
            document.createElement("button");


        button.className =
            "scp-option";


        button.innerHTML = `

            <strong>
                ${scp[0]}
            </strong>

            <small>
                ${scp[1]}
            </small>

        `;


        button.addEventListener(
            "click",
            () => {

                selectedSCP =
                    scp[0];


                document
                .querySelectorAll(
                    ".scp-option"
                )
                .forEach(element => {

                    element.classList
                    .remove("selected");

                });


                button.classList
                .add("selected");


                $("selectedSCP")
                .innerHTML =
                    `SEÇİLEN SCP:
                    <strong>
                    ${scp[0]}
                    </strong>`;


                updateSummary();

            }
        );


        container.appendChild(
            button
        );

    });

}


/* =========================================
   TIME
========================================= */

function renderTimes() {

    const night =
        $("nightTimes");

    const day =
        $("dayTimes");


    night.innerHTML = "";

    day.innerHTML = "";


    for (
        let hour = 1;
        hour <= 12;
        hour++
    ) {

        createTime(
            hour,
            "NIGHT",
            night
        );

    }


    for (
        let hour = 13;
        hour <= 22;
        hour++
    ) {

        createTime(
            hour,
            "DAY",
            day
        );

    }

}


function createTime(
    hour,
    period,
    container
) {

    const button =
        document.createElement("button");


    button.className =
        "time";


    const formatted =
        String(hour)
        .padStart(2, "0")
        + ":00";


    button.textContent =
        formatted;


    button.addEventListener(
        "click",
        () => {

            selectedTime =
                formatted;

            selectedPeriod =
                period;


            clearTimeSelection();


            button.classList
                .add("selected");


            updateSummary();

        }
    );


    container.appendChild(
        button
    );

}


function clearTimeSelection() {

    document.querySelectorAll(
        ".time"
    )
    .forEach(button => {

        button.classList
            .remove("selected");

    });

}


/* =========================================
   SUMMARY
========================================= */

function updateSummary() {

    if (!selectedType) {

        $("summary")
            .classList
            .add("hidden");

        return;

    }


    const type =
        requestTypes.find(
            item =>
                item.id === selectedType
        );


    $("sumType")
        .textContent =
        type
            ? type.name
            : "-";


    $("sumSCP")
        .textContent =
        selectedSCP || "N/A";


    $("sumTime")
        .textContent =
        selectedTime || "-";


    $("sumPeriod")
        .textContent =
        selectedPeriod || "-";


    const ready =

        selectedType &&
        selectedTime &&
        (
            selectedType !== "scp"
            ||
            selectedSCP
        );


    if (ready) {

        $("summary")
            .classList
            .remove("hidden");

    }

    else {

        $("summary")
            .classList
            .add("hidden");

    }

}


/* =========================================
   SUBMIT
========================================= */

$("submitRequest")
.addEventListener(
    "click",
    async () => {

        if (!selectedType) {

            alert(
                "TALEP TÜRÜ SEÇMELİSİN."
            );

            return;

        }


        if (
            selectedType === "scp"
            &&
            !selectedSCP
        ) {

            alert(
                "LÜTFEN SCP SEÇ."
            );

            return;

        }


        if (!selectedTime) {

            alert(
                "LÜTFEN SAAT SEÇ."
            );

            return;

        }


        const type =
            requestTypes.find(
                item =>
                    item.id === selectedType
            );


        const requestData = {

            type:
                selectedType,

            typeName:
                type.name,

            scp:
                selectedSCP,

            time:
                selectedTime,

            period:
                selectedPeriod

        };


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
                            JSON.stringify(
                                requestData
                            )

                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message
                );

            }


            showAcceptedPage(
                result.request
            );


        }

        catch (error) {

            console.error(error);

            alert(
                "SUNUCUYA BAĞLANILAMADI.\n\n" +
                "server.js ÇALIŞIYOR MU KONTROL ET."
            );

        }

    }
);


/* =========================================
   REQUEST SUCCESS
========================================= */

function showAcceptedPage(request) {

    $("request").innerHTML = `

        <div class="page-header">

            <div>

                <small>
                    SITE-64 // REQUEST SYSTEM
                </small>

                <h2>
                    TALEP GÖNDERİLDİ
                </h2>

            </div>

            <b>
                RECEIVED
            </b>

        </div>


        <div class="warning-box">

            <small>
                FOUNDATION DATABASE
            </small>

            <h3>
                TALEBİNİZ ALINDI
            </h3>

            <div class="warning-line"></div>

            <p>
                TALEBİNİZ O5 YÖNETİMİNE İLETİLDİ.
            </p>

            <div class="classified-data">

                <div>
                    REQUEST ID

                    <strong>
                        ${request.id}
                    </strong>
                </div>

                <div>
                    STATUS

                    <strong>
                        PENDING
                    </strong>
                </div>

                <div>
                    TIME

                    <strong>
                        ${request.time}
                    </strong>
                </div>

            </div>

            <button
                class="main-button"
                onclick="location.reload()">

                ANA SAYFAYA DÖN

                <span>→</span>

            </button>

        </div>

    `;

}


/* =========================================
   REQUEST DATABASE
========================================= */

async function loadRequests() {

    const container =
        $("myRequests");


    try {

        const response =
            await fetch(
                "/api/requests"
            );


        const data =
            await response.json();


        renderRequests(
            data.requests
        );


    }

    catch {

        renderRequests([]);

    }

}


function renderRequests(
    requests
) {

    const container =
        $("myRequests");


    if (
        !requests
        ||
        !requests.length
    ) {

        container.innerHTML = `

            <div class="empty-request">

                HENÜZ TALEP BULUNAMADI.

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    requests
        .slice()
        .reverse()
        .forEach(request => {

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


                ${
                    request.adminMessage
                    ?
                    `

                    <div class="admin-response">

                        <small>
                            O5 YÖNETİMİ
                        </small>

                        <p>
                            ${request.adminMessage}
                        </p>

                    </div>

                    `
                    :
                    ""
                }

            `;


            container.appendChild(
                card
            );

        });

}


/* =========================================
   START
========================================= */

renderRequestTypes();

renderTimes();

loadRequests();


setInterval(
    () => {

        const page =
            $("myrequests");


        if (
            page &&
            page.classList
                .contains("active")
        ) {

            loadRequests();

        }

    },
    5000
);