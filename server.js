const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 6464;
const HOST = "0.0.0.0";

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   DATABASE
===================================================== */

function emptyDatabase() {
    return {
        requests: [],
        sites: {
            "SITE-19": {
                status: "NORMAL",
                message: ""
            },
            "SITE-51": {
                status: "NORMAL",
                message: ""
            },
            "SITE-64": {
                status: "NORMAL",
                message: ""
            }
        },
        personnel: []
    };
}

function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const database = emptyDatabase();

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(database, null, 2),
                "utf8"
            );

            return database;
        }

        const data = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        if (!Array.isArray(data.requests)) {
            data.requests = [];
        }

        if (!data.sites || typeof data.sites !== "object") {
            data.sites = {};
        }

        for (const site of ["SITE-19", "SITE-51", "SITE-64"]) {
            if (!data.sites[site]) {
                data.sites[site] = {
                    status: "NORMAL",
                    message: ""
                };
            }

            if (!data.sites[site].status) {
                data.sites[site].status = "NORMAL";
            }

            if (typeof data.sites[site].message !== "string") {
                data.sites[site].message = "";
            }
        }

        if (!Array.isArray(data.personnel)) {
            data.personnel = [];
        }

        return data;

    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return emptyDatabase();
    }
}

function saveDatabase(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

/* =====================================================
   REQUEST ID
===================================================== */

function generateRequestId(database) {

    let id;

    do {
        id =
            "SITE64-" +
            Math.floor(10000 + Math.random() * 90000);

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

function isValidTime(time) {

    if (!time) {
        return false;
    }

    return /^(0[0-9]|1[0-9]|2[0-3]):(00|30)$/.test(
        String(time)
    );
}

function getPeriod(time) {

    const hour = Number(
        String(time).split(":")[0]
    );

    if (hour >= 6 && hour < 18) {
        return "DAY";
    }

    return "NIGHT";
}

/* =====================================================
   SITE SECURITY
===================================================== */

const VALID_SITE_STATUSES = [
    "NORMAL",
    "ELEVATED",
    "HIGH",
    "CRITICAL",
    "LOCKDOWN"
];

function isValidSite(site) {
    return [
        "SITE-19",
        "SITE-51",
        "SITE-64"
    ].includes(site);
}

function isValidSiteStatus(status) {
    return VALID_SITE_STATUSES.includes(
        String(status).toUpperCase()
    );
}

/* =====================================================
   PERSONNEL
===================================================== */

const VALID_PERSONNEL_DEPARTMENTS = [
    "O5 COUNCIL",
    "SITE DIRECTOR",
    "RESEARCH",
    "SECURITY",
    "MTF",
    "MEDICAL",
    "D-CLASS"
];

/* =====================================================
   STATIC FILES
===================================================== */

app.use(express.static(PUBLIC_DIR));

/* =====================================================
   PAGES
===================================================== */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(PUBLIC_DIR, "index.html")
    );
});

app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(PUBLIC_DIR, "admin.html")
    );
});

app.get("/sites", (req, res) => {
    res.sendFile(
        path.join(PUBLIC_DIR, "sites.html")
    );
});

app.get("/term", (req, res) => {
    res.sendFile(
        path.join(PUBLIC_DIR, "term.html")
    );
});

/* =====================================================
   REQUESTS
===================================================== */

app.get("/api/requests", (req, res) => {

    const database = readDatabase();

    res.json({
        success: true,
        requests: database.requests
    });
});


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

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "FULL NAME IS REQUIRED."
            });
        }

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "REQUEST TYPE IS REQUIRED."
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
            (!scp || !String(scp).trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "SCP SELECTION IS REQUIRED."
            });
        }

        const database = readDatabase();

        const now =
            new Date().toISOString();

        const request = {

            id:
                generateRequestId(database),

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

        database.requests.push(request);

        saveDatabase(database);

        console.log("");
        console.log("========================================");
        console.log("        NEW SITE-64 REQUEST");
        console.log("========================================");
        console.log("REQUEST ID :", request.id);
        console.log("NAME       :", request.name);
        console.log("TYPE       :", request.typeName);
        console.log("SCP        :", request.scp || "N/A");
        console.log("TIME       :", request.time);
        console.log("PERIOD     :", request.period);
        console.log("STATUS     :", request.status);
        console.log("========================================");
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
            message: "SERVER ERROR."
        });
    }
});


/* =====================================================
   APPROVE
===================================================== */

app.post(
    "/api/requests/:id/approve",
    (req, res) => {

        const database =
            readDatabase();

        const request =
            database.requests.find(
                item =>
                    item.id === req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "REQUEST NOT FOUND."
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
                    message: "INVALID TIME."
                });
            }

            request.time =
                String(time);

            request.period =
                getPeriod(time);
        }

        request.status =
            "APPROVED";

        request.adminMessage =
            message
                ? String(message).trim()
                : "YOUR REQUEST HAS BEEN APPROVED.";

        request.updatedAt =
            new Date().toISOString();

        saveDatabase(database);

        res.json({
            success: true,
            request
        });
    }
);


/* =====================================================
   REJECT
===================================================== */

app.post(
    "/api/requests/:id/reject",
    (req, res) => {

        const database =
            readDatabase();

        const request =
            database.requests.find(
                item =>
                    item.id === req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "REQUEST NOT FOUND."
            });
        }

        request.status =
            "REJECTED";

        request.adminMessage =
            req.body.message
                ? String(req.body.message).trim()
                : "YOUR REQUEST HAS BEEN REJECTED.";

        request.updatedAt =
            new Date().toISOString();

        saveDatabase(database);

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
                message: "INVALID TIME."
            });
        }

        const database =
            readDatabase();

        const request =
            database.requests.find(
                item =>
                    item.id === req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "REQUEST NOT FOUND."
            });
        }

        request.time =
            String(time);

        request.period =
            getPeriod(time);

        request.updatedAt =
            new Date().toISOString();

        saveDatabase(database);

        res.json({
            success: true,
            request
        });
    }
);


/* =====================================================
   SITE CONTROL - GET
===================================================== */

app.get(
    "/api/sites",
    (req, res) => {

        const database =
            readDatabase();

        res.json({
            success: true,
            sites: database.sites
        });
    }
);


/* =====================================================
   SITE CONTROL - UPDATE
===================================================== */

app.post(
    "/api/sites/:site",
    (req, res) => {

        const site =
            String(
                req.params.site
            ).toUpperCase();

        if (!isValidSite(site)) {
            return res.status(400).json({
                success: false,
                message: "INVALID SITE."
            });
        }

        const status =
            String(
                req.body.status || ""
            ).toUpperCase();

        if (!isValidSiteStatus(status)) {
            return res.status(400).json({
                success: false,
                message: "INVALID SECURITY STATUS."
            });
        }

        const database =
            readDatabase();

        database.sites[site] = {

            status,

            message:
                req.body.message
                    ? String(
                        req.body.message
                    ).trim()
                    : "",

            updatedAt:
                new Date().toISOString()
        };

        saveDatabase(database);

        console.log(
            `[SITE CONTROL] ${site} -> ${status}`
        );

        res.json({
            success: true,
            site,
            data:
                database.sites[site]
        });
    }
);


/* =====================================================
   PERSONNEL - GET
===================================================== */

app.get(
    "/api/personnel",
    (req, res) => {

        const database =
            readDatabase();

        res.json({
            success: true,
            personnel:
                database.personnel
        });
    }
);


/* =====================================================
   PERSONNEL - CREATE
===================================================== */

app.post(
    "/api/personnel",
    (req, res) => {

        const {
            name,
            rank,
            department,
            site,
            clearance,
            status
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "NAME IS REQUIRED."
            });
        }

        if (!rank || !String(rank).trim()) {
            return res.status(400).json({
                success: false,
                message: "RANK IS REQUIRED."
            });
        }

        if (
            department &&
            !VALID_PERSONNEL_DEPARTMENTS.includes(
                String(department).toUpperCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "INVALID DEPARTMENT."
            });
        }

        const database =
            readDatabase();

        const id =
            "P-" +
            Math.floor(
                10000 +
                Math.random() * 90000
            );

        const person = {

            id,

            name:
                String(name).trim(),

            rank:
                String(rank).trim(),

            department:
                department
                    ? String(
                        department
                    ).toUpperCase()
                    : "RESEARCH",

            site:
                site
                    ? String(site).toUpperCase()
                    : "SITE-64",

            clearance:
                clearance
                    ? String(clearance).toUpperCase()
                    : "LEVEL 2",

            status:
                status
                    ? String(status).toUpperCase()
                    : "ACTIVE",

            createdAt:
                new Date().toISOString()
        };

        database.personnel.push(person);

        saveDatabase(database);

        res.status(201).json({
            success: true,
            personnel: person
        });
    }
);


/* =====================================================
   PERSONNEL - DELETE
===================================================== */

app.delete(
    "/api/personnel/:id",
    (req, res) => {

        const database =
            readDatabase();

        const before =
            database.personnel.length;

        database.personnel =
            database.personnel.filter(
                person =>
                    person.id !== req.params.id
            );

        if (
            database.personnel.length ===
            before
        ) {
            return res.status(404).json({
                success: false,
                message: "PERSONNEL NOT FOUND."
            });
        }

        saveDatabase(database);

        res.json({
            success: true
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
                    request.status === "PENDING"
            ).length;

        const approved =
            database.requests.filter(
                request =>
                    request.status === "APPROVED"
            ).length;

        const rejected =
            database.requests.filter(
                request =>
                    request.status === "REJECTED"
            ).length;

        res.json({

            success: true,

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

            sites:
                database.sites,

            personnel:
                database.personnel.length,

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

        if (command === "clear") {
            return res.json({
                output: "__CLEAR__"
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
personnel  Show personnel count
about      Show SITE-64 information
clear      Clear terminal`
            });
        }

        if (command === "status") {

            const pending =
                database.requests.filter(
                    r =>
                        r.status === "PENDING"
                ).length;

            return res.json({
                output:
`SYSTEM STATUS
==============================
SERVER       : ONLINE
DATABASE     : ONLINE
SITE         : SITE-64
REQUESTS     : ${database.requests.length}
PENDING      : ${pending}`
            });
        }

        if (command === "requests") {

            const pending =
                database.requests.filter(
                    r =>
                        r.status === "PENDING"
                ).length;

            const approved =
                database.requests.filter(
                    r =>
                        r.status === "APPROVED"
                ).length;

            const rejected =
                database.requests.filter(
                    r =>
                        r.status === "REJECTED"
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

            const site19 =
                database.sites["SITE-19"];

            const site51 =
                database.sites["SITE-51"];

            const site64 =
                database.sites["SITE-64"];

            return res.json({
                output:
`SCP FOUNDATION SITES
==============================
SITE-19    | ${site19.status}
SITE-51    | ${site51.status}
SITE-64    | ${site64.status}
SITE-██    | CLASSIFIED`
            });
        }

        if (command === "personnel") {

            return res.json({
                output:
`PERSONNEL DATABASE
==============================
TOTAL PERSONNEL : ${database.personnel.length}
DATABASE STATUS : ONLINE`
            });
        }

        if (command === "about") {

            return res.json({
                output:
`SECURE CONTAIN PROTECT
SITE-64 ADMINISTRATION SYSTEM

CLASSIFICATION : O5
FACILITY        : SITE-64
STATUS          : OPERATIONAL

Unauthorized access is prohibited.`
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

        res.status(404).json({
            success: false,
            message: "API ENDPOINT NOT FOUND."
        });
    }
);


/* =====================================================
   DATABASE INIT
===================================================== */

if (!fs.existsSync(DATA_FILE)) {
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
        console.log("========================================");
        console.log("     SECURE CONTAIN PROTECT // SITE-64");
        console.log("========================================");
        console.log("SERVER : ONLINE");
        console.log("PORT   :", PORT);
        console.log("PUBLIC : /");
        console.log("ADMIN  : /admin");
        console.log("SITES  : /sites");
        console.log("TERM   : /term");
        console.log("========================================");
        console.log("");
    }
);
