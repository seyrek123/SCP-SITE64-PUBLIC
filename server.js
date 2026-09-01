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
app.use(express.static(PUBLIC_DIR));


/* =====================================================
   DATABASE
===================================================== */

function emptyDatabase() {
    return {
        requests: [],
        incidents: [],
        warhead: {
            active: false,
            type: null,
            site: null,
            status: "STANDBY",
            message: "",
            activatedAt: null
        }
    };
}


function readDatabase() {

    try {

        if (!fs.existsSync(DATA_FILE)) {
            const fresh = emptyDatabase();

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(fresh, null, 2),
                "utf8"
            );

            return fresh;
        }

        const data = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        if (!Array.isArray(data.requests)) {
            data.requests = [];
        }

        if (!Array.isArray(data.incidents)) {
            data.incidents = [];
        }

        if (!data.warhead) {
            data.warhead = emptyDatabase().warhead;
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
   IDS
===================================================== */

function generateRequestId() {

    const database = readDatabase();

    let id;

    do {
        id =
            "SITE64-" +
            Math.floor(
                10000 + Math.random() * 90000
            );
    }
    while (
        database.requests.some(
            request => request.id === id
        )
    );

    return id;
}


function generateIncidentId() {

    const database = readDatabase();

    let id;

    do {
        id =
            "INC-" +
            Math.floor(
                10000 + Math.random() * 90000
            );
    }
    while (
        database.incidents.some(
            incident => incident.id === id
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

    return hour >= 6 && hour < 18
        ? "DAY"
        : "NIGHT";
}


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


app.get("/warhead", (req, res) => {
    res.sendFile(
        path.join(PUBLIC_DIR, "warhead.html")
    );
});


/* =====================================================
   REQUEST SYSTEM
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

        if (
            !name ||
            !String(name).trim()
        ) {
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
                message: "INVALID TIME."
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
                message: "SCP SELECTION IS REQUIRED."
            });
        }

        const now =
            new Date().toISOString();

        const request = {
            id: generateRequestId(),
            name: String(name).trim(),
            type: String(type),
            typeName:
                typeName ||
                String(type).toUpperCase(),
            scp:
                scp
                    ? String(scp).trim()
                    : null,
            time: String(time),
            period: getPeriod(time),
            message:
                message
                    ? String(message).trim()
                    : "",
            status: "PENDING",
            adminMessage: "",
            createdAt: now,
            updatedAt: now
        };

        const database = readDatabase();

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

        console.error("REQUEST ERROR:", error);

        res.status(500).json({
            success: false,
            message: "SERVER ERROR."
        });
    }
});


app.post("/api/requests/:id/approve", (req, res) => {

    const database = readDatabase();

    const request =
        database.requests.find(
            item => item.id === req.params.id
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

    if (time !== undefined && time !== "") {

        if (!isValidTime(time)) {
            return res.status(400).json({
                success: false,
                message: "INVALID TIME."
            });
        }

        request.time = time;
        request.period = getPeriod(time);
    }

    request.status = "APPROVED";

    request.adminMessage =
        message ||
        "YOUR REQUEST HAS BEEN APPROVED.";

    request.updatedAt =
        new Date().toISOString();

    saveDatabase(database);

    res.json({
        success: true,
        request
    });
});


app.post("/api/requests/:id/reject", (req, res) => {

    const database = readDatabase();

    const request =
        database.requests.find(
            item => item.id === req.params.id
        );

    if (!request) {
        return res.status(404).json({
            success: false,
            message: "REQUEST NOT FOUND."
        });
    }

    request.status = "REJECTED";

    request.adminMessage =
        req.body.message ||
        "YOUR REQUEST HAS BEEN REJECTED.";

    request.updatedAt =
        new Date().toISOString();

    saveDatabase(database);

    res.json({
        success: true,
        request
    });
});


app.post("/api/requests/:id/time", (req, res) => {

    const {
        time
    } = req.body;

    if (!isValidTime(time)) {
        return res.status(400).json({
            success: false,
            message: "INVALID TIME."
        });
    }

    const database = readDatabase();

    const request =
        database.requests.find(
            item => item.id === req.params.id
        );

    if (!request) {
        return res.status(404).json({
            success: false,
            message: "REQUEST NOT FOUND."
        });
    }

    request.time = time;
    request.period = getPeriod(time);
    request.updatedAt =
        new Date().toISOString();

    saveDatabase(database);

    res.json({
        success: true,
        request
    });
});


/* =====================================================
   INCIDENT SYSTEM
===================================================== */

const ALLOWED_SITES = [
    "SITE-19",
    "SITE-51",
    "SITE-64"
];


app.get("/api/incidents", (req, res) => {

    const database = readDatabase();

    res.json({
        success: true,
        incidents: database.incidents
    });
});


app.post("/api/incidents", (req, res) => {

    try {

        const {
            site,
            type,
            message
        } = req.body;

        if (
            !ALLOWED_SITES.includes(
                String(site)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "INVALID SITE."
            });
        }

        if (
            !type ||
            !String(type).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "INCIDENT TYPE IS REQUIRED."
            });
        }

        const database = readDatabase();

        const incident = {

            id: generateIncidentId(),

            site: String(site),

            type:
                String(type)
                    .trim()
                    .toUpperCase(),

            message:
                message
                    ? String(message).trim()
                    : "",

            createdAt:
                new Date().toISOString(),

            active: true
        };

        database.incidents.push(incident);

        saveDatabase(database);

        res.status(201).json({
            success: true,
            incident
        });

    } catch (error) {

        console.error(
            "INCIDENT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "SERVER ERROR."
        });
    }
});


app.post(
    "/api/incidents/:id/resolve",
    (req, res) => {

        const database = readDatabase();

        const incident =
            database.incidents.find(
                item =>
                    item.id === req.params.id
            );

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "INCIDENT NOT FOUND."
            });
        }

        incident.active = false;

        incident.resolvedAt =
            new Date().toISOString();

        saveDatabase(database);

        res.json({
            success: true,
            incident
        });
    }
);


/* =====================================================
   SITES
===================================================== */

app.get("/api/sites", (req, res) => {

    const database = readDatabase();

    const sites = {

        "SITE-19": {
            status: "NORMAL",
            message: "",
            updatedAt: null
        },

        "SITE-51": {
            status: "NORMAL",
            message: "",
            updatedAt: null
        },

        "SITE-64": {
            status: "NORMAL",
            message: "",
            updatedAt: null
        }

    };

    database.incidents
        .filter(
            incident =>
                incident.active === true
        )
        .forEach(incident => {

            if (sites[incident.site]) {

                sites[incident.site] = {

                    status: incident.type,

                    message:
                        incident.message,

                    updatedAt:
                        incident.createdAt
                };
            }

        });

    res.json({
        success: true,
        sites
    });
});


/* =====================================================
   WARHEAD SIMULATION
===================================================== */

const WARHEAD_TYPES = {

    GAMMA: {
        name: "GAMMA",
        effect: "GLOBAL SIMULATION",
        description:
            "GLOBAL TERMINATION SCENARIO SIMULATION."
    },

    DELTA: {
        name: "DELTA",
        effect: "FACILITY SIMULATION",
        description:
            "SELECTED FACILITY TERMINATION SCENARIO."
    },

    ALPHA: {
        name: "ALPHA",
        effect: "FACILITY SIMULATION",
        description:
            "SELECTED FACILITY TERMINATION SCENARIO."
    },

    BETA: {
        name: "BETA",
        effect: "FACILITY SIMULATION",
        description:
            "SELECTED FACILITY TERMINATION SCENARIO."
    }

};


app.get("/api/warhead", (req, res) => {

    const database = readDatabase();

    res.json({

        success: true,

        warhead:
            database.warhead,

        types:
            WARHEAD_TYPES

    });
});


app.post("/api/warhead/activate", (req, res) => {

    const {
        type,
        site
    } = req.body;

    const selectedType =
        String(type || "")
            .trim()
            .toUpperCase();

    const selectedSite =
        String(site || "")
            .trim()
            .toUpperCase();

    if (!WARHEAD_TYPES[selectedType]) {

        return res.status(400).json({
            success: false,
            message: "INVALID WARHEAD TYPE."
        });
    }

    if (
        selectedType !== "GAMMA" &&
        !ALLOWED_SITES.includes(selectedSite)
    ) {

        return res.status(400).json({
            success: false,
            message: "INVALID TARGET SITE."
        });
    }

    const database = readDatabase();

    if (database.warhead.active) {

        return res.status(400).json({
            success: false,
            message:
                "A SIMULATION IS ALREADY ACTIVE."
        });
    }

    const now =
        new Date().toISOString();

    database.warhead = {

        active: true,

        type: selectedType,

        site:
            selectedType === "GAMMA"
                ? "GLOBAL"
                : selectedSite,

        status: "ARMED",

        message:
            WARHEAD_TYPES[selectedType]
                .description,

        activatedAt: now

    };

    saveDatabase(database);

    res.json({

        success: true,

        warhead:
            database.warhead

    });
});


app.post("/api/warhead/deactivate", (req, res) => {

    const database = readDatabase();

    database.warhead = {

        active: false,

        type: null,

        site: null,

        status: "STANDBY",

        message: "",

        activatedAt: null

    };

    saveDatabase(database);

    res.json({

        success: true,

        warhead:
            database.warhead

    });
});


/* =====================================================
   SERVER STATUS
===================================================== */

app.get("/api/status", (req, res) => {

    const database = readDatabase();

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

    const activeIncidents =
        database.incidents.filter(
            incident =>
                incident.active === true
        ).length;

    res.json({

        success: true,

        server: "ONLINE",

        database: "ONLINE",

        site: "SITE-64",

        requestSystem: "ONLINE",

        incidentSystem: "ONLINE",

        warheadSystem: "ONLINE",

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

        warhead:
            database.warhead,

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

help       Show commands
status     System status
requests   Request statistics
incidents  Active incidents
sites      Site status
warhead    Simulation status
about      Site information
clear      Clear terminal`

        });
    }

    if (command === "status") {

        const pending =
            database.requests.filter(
                r =>
                    r.status === "PENDING"
            ).length;

        const activeIncidents =
            database.incidents.filter(
                r =>
                    r.active === true
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
INCIDENTS    : ${activeIncidents}
WARHEAD      : ${database.warhead.status}`

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

    if (command === "incidents") {

        const active =
            database.incidents.filter(
                incident =>
                    incident.active === true
            );

        if (!active.length) {

            return res.json({

                output:
`ACTIVE INCIDENTS
==============================
NONE`

            });
        }

        return res.json({

            output:
`ACTIVE INCIDENTS
==============================
${
    active
        .map(
            incident =>
                `${incident.site} | ${incident.type}`
        )
        .join("\n")
}`

        });
    }

    if (command === "sites") {

        return res.json({

            output:
`SCP FOUNDATION SITES
==============================
SITE-19    | ${siteStatus(database, "SITE-19")}
SITE-51    | ${siteStatus(database, "SITE-51")}
SITE-64    | ${siteStatus(database, "SITE-64")}`

        });
    }

    if (command === "warhead") {

        const warhead =
            database.warhead;

        return res.json({

            output:
`WARHEAD SIMULATION
==============================
STATUS     : ${warhead.status}
TYPE       : ${warhead.type || "NONE"}
TARGET     : ${warhead.site || "NONE"}
ACTIVATED  : ${warhead.activatedAt || "N/A"}
MESSAGE    : ${warhead.message || "NONE"}`

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
`COMMAND NOT FOUND: ${command}
Type "help" for available commands.`

    });
});


function siteStatus(database, site) {

    const incident =
        database.incidents.find(
            item =>
                item.site === site &&
                item.active === true
        );

    return incident
        ? incident.type
        : "NORMAL";
}


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

if (!fs.existsSync(DATA_FILE)) {

    saveDatabase(
        emptyDatabase()
    );
}


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
        console.log("WARHEAD: /warhead");
        console.log("========================================");
        console.log("");

    }
);