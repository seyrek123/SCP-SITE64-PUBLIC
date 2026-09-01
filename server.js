const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 6464;
const HOST = "0.0.0.0";

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");

/* =====================================================
   SCP ARCHITECT X API KEY
===================================================== */

const ROBLOX_API_KEY =
    process.env.ROBLOX_API_KEY ||
    "SCPARCHITECTX-64-SECRET-2026";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* =====================================================
   DATABASE
===================================================== */

function emptyDatabase() {
    return {
        requests: [],
        incidents: []
    };
}


function readDatabase() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(
                    emptyDatabase(),
                    null,
                    2
                ),
                "utf8"
            );
        }

        const data =
            JSON.parse(
                fs.readFileSync(
                    DATA_FILE,
                    "utf8"
                )
            );

        if (!Array.isArray(data.requests)) {
            data.requests = [];
        }

        if (!Array.isArray(data.incidents)) {
            data.incidents = [];
        }

        return data;

    } catch (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );

        return emptyDatabase();
    }
}


function saveDatabase(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}


/* =====================================================
   REQUEST ID
===================================================== */

function generateRequestId() {

    const database =
        readDatabase();

    let id;

    do {

        id =
            "SITE64-" +
            Math.floor(
                10000 +
                Math.random() * 90000
            );

    } while (
        database.requests.some(
            request =>
                request.id === id
        )
    );

    return id;
}


/* =====================================================
   TIME
===================================================== */

function isValidTime(time) {

    if (!time) {
        return false;
    }

    return /^(0[0-9]|1[0-9]|2[0-3]):(00|30)$/.test(
        String(time)
    );
}


function getPeriod(time) {

    const hour =
        Number(
            String(time).split(":")[0]
        );

    if (
        hour >= 6 &&
        hour < 18
    ) {

        return "DAY";
    }

    return "NIGHT";
}


/* =====================================================
   STATIC FILES
===================================================== */

app.use(
    express.static(
        PUBLIC_DIR
    )
);


/* =====================================================
   PAGES
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "index.html"
        )
    );
});


app.get("/admin", (req, res) => {

    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "admin.html"
        )
    );
});


app.get("/sites", (req, res) => {

    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "sites.html"
        )
    );
});


app.get("/term", (req, res) => {

    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "term.html"
        )
    );
});


/* =====================================================
   REQUEST SYSTEM
===================================================== */

app.get(
    "/api/requests",
    (req, res) => {

        const database =
            readDatabase();

        res.json({
            success: true,
            requests:
                database.requests
        });
    }
);


app.post(
    "/api/requests",
    (req, res) => {

        try {

            const {
                name,
                type,
                typeName,
                scp,
                time,
                message
            } = req.body;

            if (
                !name ||
                !String(name).trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "FULL NAME IS REQUIRED."
                });
            }

            if (!type) {

                return res.status(400).json({
                    success: false,
                    message:
                        "REQUEST TYPE IS REQUIRED."
                });
            }

            if (!isValidTime(time)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "INVALID TIME. SELECT A 30-MINUTE INTERVAL."
                });
            }

            if (
                type === "scp" &&
                (
                    !scp ||
                    !String(scp).trim()
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "SCP SELECTION IS REQUIRED."
                });
            }

            const now =
                new Date().toISOString();

            const request = {

                id:
                    generateRequestId(),

                name:
                    String(name).trim(),

                type:
                    String(type),

                typeName:
                    typeName ||
                    String(type).toUpperCase(),

                scp:
                    scp
                        ? String(scp).trim()
                        : null,

                time:
                    String(time),

                period:
                    getPeriod(time),

                message:
                    message
                        ? String(message).trim()
                        : "",

                status:
                    "PENDING",

                adminMessage:
                    "",

                createdAt:
                    now,

                updatedAt:
                    now
            };

            const database =
                readDatabase();

            database.requests.push(
                request
            );

            saveDatabase(
                database
            );

            console.log("");
            console.log(
                "========================================"
            );
            console.log(
                "        NEW SITE-64 REQUEST"
            );
            console.log(
                "========================================"
            );
            console.log(
                "REQUEST ID :",
                request.id
            );
            console.log(
                "NAME       :",
                request.name
            );
            console.log(
                "TYPE       :",
                request.typeName
            );
            console.log(
                "SCP        :",
                request.scp || "N/A"
            );
            console.log(
                "TIME       :",
                request.time
            );
            console.log(
                "PERIOD     :",
                request.period
            );
            console.log(
                "STATUS     :",
                request.status
            );
            console.log(
                "========================================"
            );
            console.log("");

            res.status(201).json({
                success: true,
                request
            });

        } catch (error) {

            console.error(
                "REQUEST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "SERVER ERROR."
            });
        }
    }
);


/* =====================================================
   APPROVE REQUEST
===================================================== */

app.post(
    "/api/requests/:id/approve",
    (req, res) => {

        const database =
            readDatabase();

        const request =
            database.requests.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!request) {

            return res.status(404).json({
                success: false,
                message:
                    "REQUEST NOT FOUND."
            });
        }

        const {
            message,
            time
        } = req.body;

        if (
            time !== undefined &&
            time !== ""
        ) {

            if (!isValidTime(time)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "INVALID TIME."
                });
            }

            request.time =
                time;

            request.period =
                getPeriod(time);
        }

        request.status =
            "APPROVED";

        request.adminMessage =
            message ||
            "YOUR REQUEST HAS BEEN APPROVED.";

        request.updatedAt =
            new Date().toISOString();

        saveDatabase(
            database
        );

        res.json({
            success: true,
            request
        });
    }
);


/* =====================================================
   REJECT REQUEST
===================================================== */

app.post(
    "/api/requests/:id/reject",
    (req, res) => {

        const database =
            readDatabase();

        const request =
            database.requests.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!request) {

            return res.status(404).json({
                success: false,
                message:
                    "REQUEST NOT FOUND."
            });
        }

        request.status =
            "REJECTED";

        request.adminMessage =
            req.body.message ||
            "YOUR REQUEST HAS BEEN REJECTED.";

        request.updatedAt =
            new Date().toISOString();

        saveDatabase(
            database
        );

        res.json({
            success: true,
            request
        });
    }
);


/* =====================================================
   CHANGE REQUEST TIME
===================================================== */

app.post(
    "/api/requests/:id/time",
    (req, res) => {

        const {
            time
        } = req.body;

        if (!isValidTime(time)) {

            return res.status(400).json({
                success: false,
                message:
                    "INVALID TIME."
            });
        }

        const database =
            readDatabase();

        const request =
            database.requests.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!request) {

            return res.status(404).json({
                success: false,
                message:
                    "REQUEST NOT FOUND."
            });
        }

        request.time =
            time;

        request.period =
            getPeriod(time);

        request.updatedAt =
            new Date().toISOString();

        saveDatabase(
            database
        );

        res.json({
            success: true,
            request
        });
    }
);


/* =====================================================
   SCP ARCHITECT X
   ROBLOX LIVE INCIDENT SYSTEM
===================================================== */


/* =====================================================
   ROBLOX AUTHENTICATION
===================================================== */

function checkRobloxKey(req, res) {

    const key =
        req.headers["x-roblox-key"];

    if (
        !key ||
        key !== ROBLOX_API_KEY
    ) {

        res.status(401).json({

            success: false,

            message:
                "UNAUTHORIZED ROBLOX REQUEST."
        });

        return false;
    }

    return true;
}


/* =====================================================
   GET LIVE INCIDENTS
===================================================== */

app.get(
    "/api/game/incidents",
    (req, res) => {

        const database =
            readDatabase();

        const activeIncidents =
            database.incidents.filter(
                incident =>
                    incident.status ===
                    "ACTIVE"
            );

        res.json({

            success: true,

            incidents:
                activeIncidents
        });
    }
);


/* =====================================================
   ROBLOX SERVER STATUS
===================================================== */

app.post(
    "/api/game/status",
    (req, res) => {

        if (
            !checkRobloxKey(
                req,
                res
            )
        ) {

            return;
        }

        const database =
            readDatabase();

        database.gameStatus = {

            online:
                true,

            game:
                "SCP Architect X",

            serverId:
                req.body.serverId ||
                "",

            players:
                Number(
                    req.body.playerCount ||
                    0
                ),

            updatedAt:
                new Date()
                    .toISOString()
        };

        saveDatabase(
            database
        );

        res.json({

            success: true,

            message:
                "GAME STATUS UPDATED."
        });
    }
);


/* =====================================================
   GET ROBLOX SERVER STATUS
===================================================== */

app.get(
    "/api/game/status",
    (req, res) => {

        const database =
            readDatabase();

        const status =
            database.gameStatus || {

                online:
                    false,

                game:
                    "SCP Architect X",

                serverId:
                    "",

                players:
                    0,

                updatedAt:
                    null
            };

        res.json({

            success: true,

            status
        });
    }
);


/* =====================================================
   CREATE / UPDATE LIVE INCIDENT
===================================================== */

app.post(
    "/api/game/incident",
    (req, res) => {

        if (
            !checkRobloxKey(
                req,
                res
            )
        ) {

            return;
        }

        try {

            const {

                event,

                site,

                status,

                title,

                description,

                serverId,

                playerCount

            } = req.body;


            if (!event) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "EVENT IS REQUIRED."
                });
            }


            const database =
                readDatabase();


            const normalizedEvent =
                String(
                    event
                )
                    .trim()
                    .toUpperCase();


            const normalizedSite =
                String(
                    site ||
                    "SITE-64"
                )
                    .trim()
                    .toUpperCase();


            const incidentKey =
                `${normalizedEvent}-${normalizedSite}`;


            let incident =
                database.incidents.find(
                    item =>
                        item.key ===
                        incidentKey
                );


            /* =================================================
               RESOLVE INCIDENT
            ================================================= */

            if (
                String(status)
                    .toUpperCase() ===
                "RESOLVED"
            ) {

                if (incident) {

                    incident.status =
                        "RESOLVED";

                    incident.updatedAt =
                        new Date()
                            .toISOString();

                    saveDatabase(
                        database
                    );

                    console.log(
                        "[SCP ARCHITECT X]",
                        normalizedEvent,
                        "RESOLVED"
                    );
                }

                return res.json({

                    success:
                        true,

                    message:
                        "INCIDENT RESOLVED.",

                    incident:
                        incident ||
                        null
                });
            }


            /* =================================================
               CREATE INCIDENT
            ================================================= */

            if (!incident) {

                const now =
                    new Date()
                        .toISOString();

                incident = {

                    id:
                        "INC-" +
                        Math.floor(
                            10000 +
                            Math.random() *
                            90000
                        ),

                    key:
                        incidentKey,

                    event:
                        normalizedEvent,

                    site:
                        normalizedSite,

                    status:
                        "ACTIVE",

                    title:
                        title ||
                        normalizedEvent
                            .replace(
                                /_/g,
                                " "
                            ),

                    description:
                        description ||
                        "",

                    serverId:
                        serverId ||
                        "",

                    playerCount:
                        Number(
                            playerCount ||
                            0
                        ),

                    createdAt:
                        now,

                    updatedAt:
                        now
                };

                database.incidents.push(
                    incident
                );

            } else {

                incident.status =
                    "ACTIVE";

                if (
                    title !==
                    undefined
                ) {

                    incident.title =
                        title;
                }

                if (
                    description !==
                    undefined
                ) {

                    incident.description =
                        description;
                }

                if (
                    serverId !==
                    undefined
                ) {

                    incident.serverId =
                        serverId;
                }

                if (
                    playerCount !==
                    undefined
                ) {

                    incident.playerCount =
                        Number(
                            playerCount
                        );
                }

                incident.updatedAt =
                    new Date()
                        .toISOString();
            }


            saveDatabase(
                database
            );


            console.log("");
            console.log(
                "========================================"
            );
            console.log(
                "      SCP ARCHITECT X // INCIDENT"
            );
            console.log(
                "========================================"
            );
            console.log(
                "EVENT   :",
                incident.event
            );
            console.log(
                "SITE    :",
                incident.site
            );
            console.log(
                "STATUS  :",
                incident.status
            );
            console.log(
                "PLAYERS :",
                incident.playerCount
            );
            console.log(
                "SERVER  :",
                incident.serverId
            );
            console.log(
                "========================================"
            );
            console.log("");


            res.json({

                success:
                    true,

                incident
            });

        } catch (error) {

            console.error(
                "INCIDENT ERROR:",
                error
            );

            res.status(500).json({

                success:
                    false,

                message:
                    "INCIDENT SERVER ERROR."
            });
        }
    }
);


/* =====================================================
   SERVER STATUS
===================================================== */

app.get(
    "/api/status",
    (req, res) => {

        const database =
            readDatabase();

        const pending =
            database.requests.filter(
                request =>
                    request.status ===
                    "PENDING"
            ).length;

        const approved =
            database.requests.filter(
                request =>
                    request.status ===
                    "APPROVED"
            ).length;

        const rejected =
            database.requests.filter(
                request =>
                    request.status ===
                    "REJECTED"
            ).length;

        const activeIncidents =
            database.incidents.filter(
                incident =>
                    incident.status ===
                    "ACTIVE"
            ).length;

        res.json({

            success:
                true,

            server:
                "ONLINE",

            database:
                "ONLINE",

            site:
                "SITE-64",

            requestSystem:
                "ONLINE",

            totalRequests:
                database.requests.length,

            pendingRequests:
                pending,

            approvedRequests:
                approved,

            rejectedRequests:
                rejected,

            activeIncidents:
                activeIncidents,

            uptime:
                process.uptime()
        });
    }
);


/* =====================================================
   TERMINAL API
===================================================== */

app.post(
    "/api/terminal",
    (req, res) => {

        const command =
            String(
                req.body.command ||
                ""
            )
                .trim()
                .toLowerCase();

        const database =
            readDatabase();


        if (!command) {

            return res.json({
                output:
                    ""
            });
        }


        if (
            command ===
            "clear"
        ) {

            return res.json({
                output:
                    "__CLEAR__"
            });
        }


        if (
            command ===
            "help"
        ) {

            return res.json({

                output:
`SITE-64 TERMINAL
==============================

AVAILABLE COMMANDS

help       Show available commands
status     Show system status
requests   Show request statistics
incidents  Show live incidents
game       Show SCP Architect X status
sites      Show registered sites
about      Show SITE-64 information
clear      Clear terminal`
            });
        }


        if (
            command ===
            "status"
        ) {

            const pending =
                database.requests.filter(
                    r =>
                        r.status ===
                        "PENDING"
                ).length;

            const incidents =
                database.incidents.filter(
                    i =>
                        i.status ===
                        "ACTIVE"
                ).length;

            return res.json({

                output:
`SYSTEM STATUS
==============================
SERVER       : ONLINE
DATABASE     : ONLINE
SITE         : SITE-64
REQUESTS     : ${database.requests.length}
PENDING      : ${pending}
INCIDENTS    : ${incidents}`
            });
        }


        if (
            command ===
            "requests"
        ) {

            const pending =
                database.requests.filter(
                    r =>
                        r.status ===
                        "PENDING"
                ).length;

            const approved =
                database.requests.filter(
                    r =>
                        r.status ===
                        "APPROVED"
                ).length;

            const rejected =
                database.requests.filter(
                    r =>
                        r.status ===
                        "REJECTED"
                ).length;

            return res.json({

                output:
`REQUEST DATABASE
==============================
TOTAL      : ${database.requests.length}
PENDING    : ${pending}
APPROVED   : ${approved}
REJECTED   : ${rejected}`
            });
        }


        if (
            command ===
            "incidents"
        ) {

            const active =
                database.incidents.filter(
                    i =>
                        i.status ===
                        "ACTIVE"
                );


            if (!active.length) {

                return res.json({

                    output:
`LIVE INCIDENTS
==============================
NO ACTIVE INCIDENTS.`
                });
            }


            const output =
                active
                    .map(
                        incident =>
`${incident.id}
EVENT      : ${incident.event}
SITE       : ${incident.site}
STATUS     : ${incident.status}
PLAYERS    : ${incident.playerCount}`
                    )
                    .join(
                        "\n\n"
                    );


            return res.json({

                output:
`LIVE INCIDENTS
==============================

${output}`
            });
        }


        if (
            command ===
            "game"
        ) {

            const game =
                database.gameStatus || {

                    online:
                        false,

                    game:
                        "SCP Architect X",

                    players:
                        0
                };


            return res.json({

                output:
`SCP ARCHITECT X
==============================
STATUS       : ${game.online ? "ONLINE" : "OFFLINE"}
PLAYERS      : ${game.players}
SERVER ID    : ${game.serverId || "N/A"}
LAST UPDATE  : ${game.updatedAt || "N/A"}`
            });
        }


        if (
            command ===
            "sites"
        ) {

            return res.json({

                output:
`SCP FOUNDATION SITES
==============================
SITE-19    | ACTIVE
SITE-51    | ACTIVE
SITE-64    | ACTIVE
SITE-██    | CLASSIFIED`
            });
        }


        if (
            command ===
            "about"
        ) {

            return res.json({

                output:
`SECURE CONTAIN PROTECT
SITE-64 ADMINISTRATION SYSTEM

CLASSIFICATION : O5
FACILITY        : SITE-64
STATUS          : OPERATIONAL
GAME            : SCP Architect X

Unauthorized access is prohibited.`
            });
        }


        return res.json({

            output:
`COMMAND NOT FOUND: ${command}
Type "help" for available commands.`
        });
    }
);


/* =====================================================
   API 404
===================================================== */

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success:
                false,

            message:
                "API ENDPOINT NOT FOUND."
        });
    }
);


/* =====================================================
   DATABASE INITIALIZATION
===================================================== */

if (
    !fs.existsSync(DATA_FILE)
) {

    saveDatabase(
        emptyDatabase()
    );
}


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    HOST,
    () => {

        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "     SECURE CONTAIN PROTECT // SITE-64"
        );

        console.log(
            "========================================"
        );

        console.log(
            "SERVER : ONLINE"
        );

        console.log(
            "PORT   :",
            PORT
        );

        console.log(
            "PUBLIC : /"
        );

        console.log(
            "ADMIN  : /admin"
        );

        console.log(
            "SITES  : /sites"
        );

        console.log(
            "TERM   : /term"
        );

        console.log(
            "ROBLOX : /api/game/incident"
        );

        console.log(
            "LIVE   : /api/game/incidents"
        );

        console.log(
            "========================================"
        );

        console.log("");
    }
);