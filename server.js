const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 6464;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

function emptyDatabase() {
    return { requests: [] };
}

function saveDatabase(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const data = emptyDatabase();
            saveDatabase(data);
            return data;
        }

        const data = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        if (!Array.isArray(data.requests)) {
            data.requests = [];
            saveDatabase(data);
        }

        return data;

    } catch (error) {
        console.error("DATABASE ERROR:", error);

        const data = emptyDatabase();
        saveDatabase(data);

        return data;
    }
}

function generateId() {

    const database = readDatabase();

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
            request => request.id === id
        )
    );

    return id;
}


/* =====================================================
   TIME
===================================================== */

const TIME_REGEX =
    /^(12|[1-9]|1[0-1]):(00|30) (AM|PM)$/;


function normalizeTime(time) {

    if (!time) {
        return null;
    }

    const value =
        String(time)
            .trim()
            .toUpperCase();

    if (!TIME_REGEX.test(value)) {
        return null;
    }

    return value;
}


function getPeriod(time) {

    const normalized =
        normalizeTime(time);

    if (!normalized) {
        return null;
    }

    return normalized.endsWith("AM")
        ? "MORNING"
        : "NIGHT";
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
   REQUESTS
===================================================== */

app.get("/api/requests", (req, res) => {

    const database =
        readDatabase();

    res.json({
        success: true,
        requests: database.requests
    });
});


/* =====================================================
   CREATE REQUEST
===================================================== */

app.post("/api/requests", (req, res) => {

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


        const normalizedTime =
            normalizeTime(time);


        if (!normalizedTime) {

            return res.status(400).json({
                success: false,
                message:
                    "PLEASE SELECT A VALID TIME."
            });
        }


        if (
            type === "scp" &&
            (!scp ||
                !String(scp).trim())
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "SCP MUST BE SELECTED."
            });
        }


        const now =
            new Date().toISOString();


        const request = {

            id: generateId(),

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


        console.log(
            `[NEW REQUEST] ${request.id} ${request.time}`
        );


        return res.status(201).json({

            success: true,

            message:
                "REQUEST SUBMITTED SUCCESSFULLY.",

            request:
                request
        });


    } catch (error) {

        console.error(
            "CREATE REQUEST ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "SERVER ERROR."
        });
    }
});


/* =====================================================
   CHANGE TIME
===================================================== */

app.post(
    "/api/requests/:id/time",
    (req, res) => {

        try {

            const normalizedTime =
                normalizeTime(
                    req.body.time
                );


            if (!normalizedTime) {

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


            return res.json({

                success: true,

                message:
                    "TIME UPDATED.",

                request:
                    request
            });


        } catch (error) {

            console.error(
                "TIME ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "SERVER ERROR."
            });
        }
    }
);


/* =====================================================
   APPROVE
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

                return res.status(404).json({

                    success: false,

                    message:
                        "REQUEST NOT FOUND."
                });
            }


            if (req.body.time) {

                const time =
                    normalizeTime(
                        req.body.time
                    );


                if (!time) {

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
                req.body.message &&
                String(req.body.message).trim()
                    ? String(
                        req.body.message
                    ).trim()
                    : "YOUR REQUEST HAS BEEN ACCEPTED.";


            request.updatedAt =
                new Date().toISOString();


            saveDatabase(
                database
            );


            return res.json({

                success: true,

                request:
                    request
            });


        } catch (error) {

            console.error(
                "APPROVE ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "SERVER ERROR."
            });
        }
    }
);


/* =====================================================
   REJECT
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

                return res.status(404).json({

                    success: false,

                    message:
                        "REQUEST NOT FOUND."
                });
            }


            request.status =
                "REJECTED";


            request.adminMessage =
                req.body.message &&
                String(req.body.message).trim()
                    ? String(
                        req.body.message
                    ).trim()
                    : "YOUR REQUEST HAS BEEN REJECTED.";


            request.updatedAt =
                new Date().toISOString();


            saveDatabase(
                database
            );


            return res.json({

                success: true,

                request:
                    request
            });


        } catch (error) {

            console.error(
                "REJECT ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "SERVER ERROR."
            });
        }
    }
);


/* =====================================================
   STATUS
===================================================== */

app.get("/api/status", (req, res) => {

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


    res.json({

        success: true,

        server:
            "ONLINE",

        site:
            "SITE-64",

        database:
            "ONLINE",

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

        uptime:
            process.uptime()
    });
});


/* =====================================================
   TERMINAL
===================================================== */

app.post("/api/terminal", (req, res) => {

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
`SITE DATABASE
==============================
SITE-19   | OPERATIONAL
SITE-51   | CLASSIFIED
SITE-64   | ACTIVE
SITE-██   | REDACTED`
        });
    }


    if (command === "about") {

        return res.json({

            output:
`SECURE CONTAIN PROTECT
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
            `COMMAND NOT FOUND: ${command}`
    });
});


/* =====================================================
   API 404
===================================================== */

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API ENDPOINT NOT FOUND."
    });
});


/* =====================================================
   START
===================================================== */

readDatabase();


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "SECURE CONTAIN PROTECT // SITE-64"
        );

        console.log(
            "SERVER ONLINE"
        );

        console.log(
            `PORT: ${PORT}`
        );

        console.log(
            "========================================"
        );
    }
);