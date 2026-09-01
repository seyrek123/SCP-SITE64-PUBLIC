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

/*
    PUBLIC KLASÖRÜ ÖNCELİKLİ
    Böylece eski ana klasördeki index.html
    yanlışlıkla açılmaz.
*/
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

        const data =
            JSON.parse(
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
===================================================== */

function validateTime(time) {

    if (!time) {
        return false;
    }

    const match =
        /^([0-9]{1,2}):([0-9]{2})$/
            .exec(
                String(time)
            );

    if (!match) {
        return false;
    }

    const hour =
        Number(match[1]);

    const minute =
        Number(match[2]);

    if (
        hour < 1 ||
        hour > 22 ||
        minute !== 0
    ) {
        return false;
    }

    return true;
}


function getPeriod(time) {

    const hour =
        Number(
            String(time)
                .split(":")[0]
        );

    return hour <= 12
        ? "NIGHT"
        : "DAY";
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


            /* NAME */

            if (!name || !String(name).trim()) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "FULL NAME IS REQUIRED."
                    });
            }


            /* REQUEST TYPE */

            if (!type) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "REQUEST TYPE IS REQUIRED."
                    });
            }


            /* TIME */

            if (!validateTime(time)) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "INVALID TIME."
                    });
            }


            /*
                SADECE SCP DENETİMİ
                seçildiyse SCP zorunlu.
            */

            if (
                type === "scp" &&
                (!scp || !String(scp).trim())
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
                    type,

                typeName:
                    typeName ||
                    type.toUpperCase(),

                scp:
                    scp ||
                    null,

                time:
                    time,

                period:
                    getPeriod(time),

                message:
                    message ||
                    "",

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


        if (time) {

            if (!validateTime(time)) {

                return res
                    .status(400)
                    .json({
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
            "YOUR REQUEST HAS BEEN ACCEPTED.";


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
            req.body.message ||
            "YOUR REQUEST HAS BEEN REJECTED.";


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


        if (!validateTime(time)) {

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
            time;


        request.period =
            getPeriod(time);


        request.updatedAt =
            new Date().toISOString();


        saveDatabase(
            database
        );


        console.log(
            `[TIME CHANGED] ${request.id} -> ${time}`
        );


        res.json({
            success: true,
            request:
                request
        });
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


        res.json({

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


        /* HELP */

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


        /* STATUS */

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


        /* REQUESTS */

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


        /* SITES */

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


        /* ABOUT */

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


        /* CLEAR */

        if (command === "clear") {

            return res.json({
                output:
                    "__CLEAR__"
            });
        }


        /* UNKNOWN */

        return res.json({

            output:
                `COMMAND NOT FOUND: ${command}\nType "help" for available commands.`
        });
    }
);


/* =====================================================
   404 API
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