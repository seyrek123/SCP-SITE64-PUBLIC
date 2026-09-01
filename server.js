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
        requests: []
    };
}

function readDatabase() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(emptyDatabase(), null, 2),
                "utf8"
            );
        }

        const data = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        if (!Array.isArray(data.requests)) {
            data.requests = [];
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

function generateRequestId() {
    const database = readDatabase();

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
   12:00 AM - 11:30 PM
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
   GET ALL REQUESTS
===================================================== */

app.get("/api/requests", (req, res) => {
    const database = readDatabase();

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

        const now = new Date().toISOString();

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

/* =====================================================
   APPROVE REQUEST
===================================================== */

app.post("/api/requests/:id/approve", (req, res) => {
    const database = readDatabase();

    const request = database.requests.find(
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

/* =====================================================
   REJECT REQUEST
===================================================== */

app.post("/api/requests/:id/reject", (req, res) => {
    const database = readDatabase();

    const request = database.requests.find(
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

/* =====================================================
   CHANGE REQUEST TIME
===================================================== */

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

    const request = database.requests.find(
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
   SERVER STATUS
===================================================== */

app.get("/api/status", (req, res) => {
    const database = readDatabase();

    const pending = database.requests.filter(
        request =>
            request.status === "PENDING"
    ).length;

    const approved = database.requests.filter(
        request =>
            request.status === "APPROVED"
    ).length;

    const rejected = database.requests.filter(
        request =>
            request.status === "REJECTED"
    ).length;

    res.json({
        success: true,

        server: "ONLINE",

        database: "ONLINE",

        site: "SITE-64",

        requestSystem: "ONLINE",

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
   TERMINAL API
===================================================== */

app.post("/api/terminal", (req, res) => {
    const command = String(
        req.body.command || ""
    )
        .trim()
        .toLowerCase();

    const database = readDatabase();

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
about      Show SITE-64 information
clear      Clear terminal`
        });
    }

    if (command === "status") {
        const pending =
            database.requests.filter(
                r => r.status === "PENDING"
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
                r => r.status === "PENDING"
            ).length;

        const approved =
            database.requests.filter(
                r => r.status === "APPROVED"
            ).length;

        const rejected =
            database.requests.filter(
                r => r.status === "REJECTED"
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
`SCP FOUNDATION SITES
==============================
SITE-19    | ACTIVE
SITE-51    | ACTIVE
SITE-64    | ACTIVE
SITE-██    | CLASSIFIED`
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
});

/* =====================================================
   API 404
===================================================== */

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API ENDPOINT NOT FOUND."
    });
});

/* =====================================================
   START SERVER
===================================================== */

if (!fs.existsSync(DATA_FILE)) {
    saveDatabase(emptyDatabase());
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
        console.log("========================================");
        console.log("");
    }
);