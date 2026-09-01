const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 6464;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(PUBLIC_DIR));


/* =====================================================
   DATABASE
===================================================== */

function createEmptyDatabase() {
    return {
        requests: []
    };
}

function ensureDatabase() {

    if (!fs.existsSync(DATA_FILE)) {

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                createEmptyDatabase(),
                null,
                4
            ),
            "utf8"
        );

        return;
    }

    try {

        const data = JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

        let changed = false;

        if (!Array.isArray(data.requests)) {
            data.requests = [];
            changed = true;
        }

        if (changed) {
            saveDatabase(data);
        }

    } catch (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                createEmptyDatabase(),
                null,
                4
            ),
            "utf8"
        );
    }
}

function readDatabase() {

    ensureDatabase();

    try {

        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "DATABASE READ ERROR:",
            error
        );

        return createEmptyDatabase();
    }
}

function saveDatabase(database) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            database,
            null,
            4
        ),
        "utf8"
    );
}


/* =====================================================
   ID
===================================================== */

function generateId() {

    let id;

    do {

        id =
            "SITE64-" +
            Math.floor(
                10000 +
                Math.random() * 90000
            );

    } while (
        readDatabase()
            .requests
            .some(
                request =>
                    request.id === id
            )
    );

    return id;
}


/* =====================================================
   TIME
   12:00 PM -> 12:00 AM
===================================================== */

function validateTime(time) {

    if (!time) {
        return false;
    }

    const value =
        String(time)
            .trim()
            .toUpperCase();

    return /^(12|1[0-2]|[1-9]):(00|30) (AM|PM)$/.test(
        value
    );
}


function normalizeTime(time) {

    if (!time) {
        return null;
    }

    const value =
        String(time)
            .trim()
            .toUpperCase();

    if (!validateTime(value)) {
        return null;
    }

    return value;
}


function getPeriod(time) {

    const value =
        normalizeTime(time);

    if (!value) {
        return null;
    }

    const parts =
        value.split(" ");

    const hour =
        Number(
            parts[0].split(":")[0]
        );

    const meridiem =
        parts[1];

    /*
        12 AM - 11:30 AM = MORNING
        12 PM - 11:30 PM = NIGHT
    */

    if (meridiem === "AM") {
        return "MORNING";
    }

    return "NIGHT";
}


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
   GET REQUESTS
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


/* =====================================================
   CREATE REQUEST
===================================================== */

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

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "FULL NAME IS REQUIRED."
                    });
            }


            if (!type) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "REQUEST TYPE IS REQUIRED."
                    });
            }


            const normalizedTime =
                normalizeTime(time);


            if (!normalizedTime) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "INVALID TIME. USE AM/PM WITH 00 OR 30 MINUTES."
                    });
            }


            if (
                type === "scp" &&
                (!scp ||
                    !String(scp).trim())
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "SCP MUST BE SELECTED."
                    });
            }


            const now =
                new Date().toISOString();


            const request = {

                id:
                    generateId(),

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
                    normalizedTime,

                period:
                    getPeriod(
                        normalizedTime
                    ),

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
                "       NEW SITE-64 REQUEST"
            );
            console.log(
                "========================================"
            );
            console.log(
                "ID      :",
                request.id
            );
            console.log(
                "NAME    :",
                request.name
            );
            console.log(
                "TYPE    :",
                request.typeName
            );
            console.log(
                "SCP     :",
                request.scp || "N/A"
            );
            console.log(
                "TIME    :",
                request.time
            );
            console.log(
                "PERIOD  :",
                request.period
            );
            console.log(
                "STATUS  :",
                request.status
            );
            console.log(
                "========================================"
            );
            console.log("");


            res
                .status(201)
                .json({
                    success: true,
                    request:
                        request
                });

        } catch (error) {

            console.error(
                "REQUEST ERROR:",
                error
            );

            res
                .status(500)
                .json({
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

        try {

            const database =
                readDatabase();


            const request =
                database.requests.find(
                    item =>
                        item.id ===
                        req.params.id
                );


            if (!request) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "REQUEST NOT FOUND."
                    });
            }


            const {
                message,
                time
            } = req.body;


            if (time !== undefined) {

                const normalizedTime =
                    normalizeTime(time);

                if (!normalizedTime) {

                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "INVALID TIME."
                        });
                }

                request.time =
                    normalizedTime;

                request.period =
                    getPeriod(
                        normalizedTime
                    );
            }


            request.status =
                "APPROVED";


            request.adminMessage =
                message
                    ? String(message).trim()
                    : "YOUR REQUEST HAS BEEN ACCEPTED.";


            request.updatedAt =
                new Date().toISOString();


            saveDatabase(
                database
            );


            console.log(
                `[APPROVED] ${request.id} @ ${request.time}`
            );


            res.json({
                success: true,
                request:
                    request
            });

        } catch (error) {

            console.error(
                "APPROVE ERROR:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "SERVER ERROR."
                });
        }
    }
);


/* =====================================================
   REJECT REQUEST
===================================================== */

app.post(
    "/api/requests/:id/reject",
    (req, res) => {

        try {

            const database =
                readDatabase();


            const request =
                database.requests.find(
                    item =>
                        item.id ===
                        req.params.id
                );


            if (!request) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "REQUEST NOT FOUND."
                    });
            }


            request.status =
                "REJECTED";


            request.adminMessage =
                req.body.message
                    ? String(
                        req.body.message
                    ).trim()
                    : "YOUR REQUEST HAS BEEN REJECTED.";


            request.updatedAt =
                new Date().toISOString();


            saveDatabase(
                database
            );


            console.log(
                `[REJECTED] ${request.id}`
            );


            res.json({
                success: true,
                request:
                    request
            });

        } catch (error) {

            console.error(
                "REJECT ERROR:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "SERVER ERROR."
                });
        }
    }
);


/* =====================================================
   CHANGE REQUEST TIME
===================================================== */

app.post(
    "/api/requests/:id/time",
    (req, res) => {

        try {

            const {
                time
            } = req.body;


            const normalizedTime =
                normalizeTime(time);


            if (!normalizedTime) {

                return res
                    .status(400)
                    .json({
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

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "REQUEST NOT FOUND."
                    });
            }


            request.time =
                normalizedTime;


            request.period =
                getPeriod(
                    normalizedTime
                );


            request.updatedAt =
                new Date().toISOString();


            saveDatabase(
                database
            );


            console.log(
                `[TIME CHANGED] ${request.id} -> ${request.time}`
            );


            res.json({
                success: true,
                message:
                    "REQUEST TIME UPDATED.",
                request:
                    request
            });

        } catch (error) {

            console.error(
                "TIME CHANGE ERROR:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "SERVER ERROR."
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

        try {

            const database =
                readDatabase();


            const pending =
                database.requests.filter(
                    request =>
                        request.status ===
                        "PENDING"
                ).length;


            res.json({

                success:
                    true,

                server:
                    "ONLINE",

                site:
                    "SITE-64",

                database:
                    "ONLINE",

                requestSystem:
                    "ONLINE",

                pendingRequests:
                    pending,

                totalRequests:
                    database.requests.length,

                uptime:
                    process.uptime()
            });

        } catch (error) {

            res
                .status(500)
                .json({
                    success: false,
                    server: "ONLINE",
                    database: "ERROR"
                });
        }
    }
);


/* =====================================================
   TERMINAL
===================================================== */

app.post(
    "/api/terminal",
    (req, res) => {

        const command =
            String(
                req.body.command || ""
            )
                .trim()
                .toLowerCase();


        const database =
            readDatabase();


        if (!command) {

            return res.json({
                output: ""
            });
        }


        if (command === "help") {

            return res.json({

                output:
`SITE-64 TERMINAL
==============================

AVAILABLE COMMANDS

help       Show available commands
status     Show system status
requests   Show request statistics
sites      Show registered sites
clear      Clear terminal
about      Show SITE-64 information`
            });
        }


        if (command === "status") {

            const pending =
                database.requests.filter(
                    r =>
                        r.status ===
                        "PENDING"
                ).length;


            return res.json({

                output:
`SYSTEM STATUS
==============================
SERVER       : ONLINE
DATABASE     : ONLINE
SITE-64      : OPERATIONAL
REQUESTS     : ${database.requests.length}
PENDING      : ${pending}`
            });
        }


        if (command === "requests") {

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


        if (command === "sites") {

            return res.json({

                output:
`SITE-64
==============================
SITE-19   | OPERATIONAL
SITE-51   | CLASSIFIED
SITE-64   | UNKNOWN
SITE-██   | REDACTED`
            });
        }


        if (command === "about") {

            return res.json({

                output:
`SECURECONTAINPROTECT
SITE-64 ADMINISTRATION SYSTEM

CLASSIFICATION: O5
ACCESS LEVEL: ADMIN

Unauthorized access is prohibited.`
            });
        }


        if (command === "clear") {

            return res.json({
                output:
                    "__CLEAR__"
            });
        }


        return res.json({

            output:
                `COMMAND NOT FOUND: ${command}\nType "help" for available commands.`
        });
    }
);


/* =====================================================
   API 404
===================================================== */

app.use(
    "/api",
    (req, res) => {

        res
            .status(404)
            .json({
                success: false,
                message:
                    "API ENDPOINT NOT FOUND."
            });
    }
);


/* =====================================================
   START
===================================================== */

ensureDatabase();


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "     SECURECONTAINPROTECT // SITE-64"
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
            "========================================"
        );
        console.log("");
    }
);