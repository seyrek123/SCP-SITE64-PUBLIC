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

function defaultDatabase() {

    return {

        requests: [],

        sites: {

            "SITE-19": {
                id: "SITE-19",
                name: "MAIN CONTAINMENT FACILITY",
                description:
                    "One of the Foundation's largest containment and research facilities.",
                status: "ACTIVE",
                security: "LEVEL 4",
                personnel: 1284,
                containment: "STABLE",
                incidents: 0,
                updatedAt: new Date().toISOString()
            },

            "SITE-51": {
                id: "SITE-51",
                name: "CARLSON FACILITY",
                description:
                    "A classified Foundation facility under restricted observation.",
                status: "ACTIVE",
                security: "LEVEL 5",
                personnel: 436,
                containment: "MONITORED",
                incidents: 1,
                updatedAt: new Date().toISOString()
            },

            "SITE-64": {
                id: "SITE-64",
                name: "UNKNOWN FACILITY",
                description:
                    "The exact location and operational purpose of this facility remain restricted.",
                status: "ACTIVE",
                security: "LEVEL 5",
                personnel: 64,
                containment: "STABLE",
                incidents: 0,
                updatedAt: new Date().toISOString()
            }

        },

        siteActivity: [],

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

            const initial =
                defaultDatabase();

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(
                    initial,
                    null,
                    2
                ),
                "utf8"
            );

            return initial;
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


        if (
            !data.sites ||
            typeof data.sites !== "object" ||
            Array.isArray(data.sites)
        ) {

            data.sites =
                defaultDatabase().sites;

        }


        if (!Array.isArray(data.siteActivity)) {
            data.siteActivity = [];
        }


        if (!data.warhead) {

            data.warhead = {
                active: false,
                type: null,
                site: null,
                status: "STANDBY",
                message: "",
                activatedAt: null
            };

        }


        return data;


    } catch (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );

        return defaultDatabase();

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
   DATABASE REPAIR
===================================================== */

function initializeDatabase() {

    const database =
        readDatabase();

    const defaults =
        defaultDatabase().sites;

    let changed = false;


    for (
        const [siteId, site]
        of Object.entries(defaults)
    ) {

        if (!database.sites[siteId]) {

            database.sites[siteId] = {
                ...site
            };

            changed = true;

        }

    }


    if (!Array.isArray(database.siteActivity)) {

        database.siteActivity = [];

        changed = true;

    }


    if (!database.warhead) {

        database.warhead = {
            active: false,
            type: null,
            site: null,
            status: "STANDBY",
            message: "",
            activatedAt: null
        };

        changed = true;

    }


    if (changed) {

        saveDatabase(database);

    }


    return database;

}


/* =====================================================
   REQUEST SYSTEM
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


function isValidTime(time) {

    if (!time) {
        return false;
    }

    return /^(0[0-9]|1[0-9]|2[0-3]):(00|30)$/
        .test(
            String(time)
        );

}


function getPeriod(time) {

    const hour =
        Number(
            String(time)
                .split(":")[0]
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
   MAIN PAGES
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


app.get("/warhead", (req, res) => {

    res.sendFile(
        path.join(
            PUBLIC_DIR,
            "warhead.html"
        )
    );

});


/* =====================================================
   REQUESTS
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
   SITE CONTROL
===================================================== */

const VALID_SITE_STATUSES = [
    "ACTIVE",
    "LOCKDOWN",
    "OFFLINE"
];


const VALID_SECURITY = [
    "LEVEL 1",
    "LEVEL 2",
    "LEVEL 3",
    "LEVEL 4",
    "LEVEL 5"
];


const VALID_CONTAINMENT = [
    "STABLE",
    "MONITORED",
    "UNSTABLE",
    "CRITICAL"
];


function addSiteActivity(
    database,
    siteId,
    type,
    message
) {

    if (
        !Array.isArray(
            database.siteActivity
        )
    ) {

        database.siteActivity = [];

    }


    database.siteActivity.unshift({

        siteId,

        type,

        message,

        createdAt:
            new Date().toISOString()

    });


    database.siteActivity =
        database.siteActivity.slice(
            0,
            100
        );

}


/* =====================================================
   GET ALL SITES
===================================================== */

app.get(
    "/api/sites",
    (req, res) => {

        try {

            const database =
                initializeDatabase();


            res.json({

                success: true,

                sites:
                    Object.values(
                        database.sites
                    ),

                activity:
                    database.siteActivity
                        .slice(0, 50)

            });


        } catch (error) {

            console.error(
                "SITE GET ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "SITE DATABASE ERROR."

            });

        }

    }
);


/* =====================================================
   SITE SUMMARY
===================================================== */

app.get(
    "/api/sites/status/summary",
    (req, res) => {

        try {

            const database =
                initializeDatabase();


            const sites =
                Object.values(
                    database.sites
                );


            const active =
                sites.filter(
                    site =>
                        site.status ===
                        "ACTIVE"
                ).length;


            const lockdown =
                sites.filter(
                    site =>
                        site.status ===
                        "LOCKDOWN"
                ).length;


            const offline =
                sites.filter(
                    site =>
                        site.status ===
                        "OFFLINE"
                ).length;


            const incidents =
                sites.reduce(
                    (
                        total,
                        site
                    ) =>
                        total +
                        Number(
                            site.incidents ||
                            0
                        ),
                    0
                );


            const personnel =
                sites.reduce(
                    (
                        total,
                        site
                    ) =>
                        total +
                        Number(
                            site.personnel ||
                            0
                        ),
                    0
                );


            res.json({

                success: true,

                summary: {

                    totalSites:
                        sites.length,

                    active,

                    lockdown,

                    offline,

                    totalIncidents:
                        incidents,

                    totalPersonnel:
                        personnel

                }

            });


        } catch (error) {

            console.error(
                "SITE SUMMARY ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "SITE SUMMARY ERROR."

            });

        }

    }
);


/* =====================================================
   GET SINGLE SITE
===================================================== */

app.get(
    "/api/sites/:id",
    (req, res) => {

        try {

            const siteId =
                String(
                    req.params.id
                )
                .trim()
                .toUpperCase();


            const database =
                initializeDatabase();


            const site =
                database.sites[
                    siteId
                ];


            if (!site) {

                return res.status(404).json({

                    success: false,

                    message:
                        "SITE NOT FOUND."

                });

            }


            res.json({

                success: true,

                site

            });


        } catch (error) {

            console.error(
                "SITE DETAIL ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "SITE DATABASE ERROR."

            });

        }

    }
);


/* =====================================================
   UPDATE SITE
===================================================== */

app.put(
    "/api/sites/:id",
    (req, res) => {

        try {

            const siteId =
                String(
                    req.params.id
                )
                .trim()
                .toUpperCase();


            const database =
                initializeDatabase();


            const site =
                database.sites[
                    siteId
                ];


            if (!site) {

                return res.status(404).json({

                    success: false,

                    message:
                        "SITE NOT FOUND."

                });

            }


            const {
                status,
                security,
                personnel,
                containment,
                incidents,
                description
            } = req.body;


            if (
                status !== undefined &&
                !VALID_SITE_STATUSES.includes(
                    String(status).toUpperCase()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "INVALID SITE STATUS."

                });

            }


            if (
                security !== undefined &&
                !VALID_SECURITY.includes(
                    String(security).toUpperCase()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "INVALID SECURITY LEVEL."

                });

            }


            if (
                containment !== undefined &&
                !VALID_CONTAINMENT.includes(
                    String(containment).toUpperCase()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "INVALID CONTAINMENT STATUS."

                });

            }


            if (
                personnel !== undefined &&
                (
                    !Number.isFinite(
                        Number(personnel)
                    ) ||
                    Number(personnel) < 0
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "INVALID PERSONNEL COUNT."

                });

            }


            if (
                incidents !== undefined &&
                (
                    !Number.isFinite(
                        Number(incidents)
                    ) ||
                    Number(incidents) < 0
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "INVALID INCIDENT COUNT."

                });

            }


            const oldStatus =
                site.status;

            const oldSecurity =
                site.security;

            const oldContainment =
                site.containment;


            if (status !== undefined) {

                site.status =
                    String(status)
                        .toUpperCase();

            }


            if (security !== undefined) {

                site.security =
                    String(security)
                        .toUpperCase();

            }


            if (personnel !== undefined) {

                site.personnel =
                    Math.floor(
                        Number(personnel)
                    );

            }


            if (containment !== undefined) {

                site.containment =
                    String(containment)
                        .toUpperCase();

            }


            if (incidents !== undefined) {

                site.incidents =
                    Math.floor(
                        Number(incidents)
                    );

            }


            if (description !== undefined) {

                site.description =
                    String(description)
                        .trim()
                        .slice(
                            0,
                            2000
                        );

            }


            site.updatedAt =
                new Date().toISOString();


            if (
                oldStatus !==
                site.status
            ) {

                addSiteActivity(

                    database,

                    siteId,

                    "STATUS",

                    `${siteId} STATUS CHANGED: ${oldStatus} -> ${site.status}`

                );

            }


            if (
                oldSecurity !==
                site.security
            ) {

                addSiteActivity(

                    database,

                    siteId,

                    "SECURITY",

                    `${siteId} SECURITY LEVEL CHANGED: ${oldSecurity} -> ${site.security}`

                );

            }


            if (
                oldContainment !==
                site.containment
            ) {

                addSiteActivity(

                    database,

                    siteId,

                    "CONTAINMENT",

                    `${siteId} CONTAINMENT STATUS CHANGED: ${oldContainment} -> ${site.containment}`

                );

            }


            if (
                site.status ===
                "LOCKDOWN" &&
                oldStatus !==
                "LOCKDOWN"
            ) {

                addSiteActivity(

                    database,

                    siteId,

                    "ALERT",

                    `${siteId} LOCKDOWN ACTIVATED`

                );

            }


            if (
                oldStatus ===
                "LOCKDOWN" &&
                site.status !==
                "LOCKDOWN"
            ) {

                addSiteActivity(

                    database,

                    siteId,

                    "ALERT",

                    `${siteId} LOCKDOWN DEACTIVATED`

                );

            }


            addSiteActivity(

                database,

                siteId,

                "UPDATE",

                `${siteId} FACILITY CONFIGURATION UPDATED`

            );


            saveDatabase(
                database
            );


            res.json({

                success: true,

                message:
                    "SITE CONFIGURATION UPDATED.",

                site,

                activity:
                    database.siteActivity
                        .slice(0, 50)

            });


        } catch (error) {

            console.error(
                "SITE UPDATE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "SITE UPDATE FAILED."

            });

        }

    }
);


/* =====================================================
   SITE ACTIVITY
===================================================== */

app.get(
    "/api/sites/:id/activity",
    (req, res) => {

        try {

            const siteId =
                String(
                    req.params.id
                )
                .trim()
                .toUpperCase();


            const database =
                initializeDatabase();


            const activity =
                database.siteActivity
                    .filter(
                        item =>
                            item.siteId ===
                            siteId
                    )
                    .slice(
                        0,
                        50
                    );


            res.json({

                success: true,

                siteId,

                activity

            });


        } catch (error) {

            console.error(
                "SITE ACTIVITY ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "SITE ACTIVITY ERROR."

            });

        }

    }
);


/* =====================================================
   WARHEAD SYSTEM
===================================================== */

const WARHEAD_TYPES = {

    GAMMA: {

        name:
            "GAMMA",

        effect:
            "GLOBAL TERMINATION",

        description:
            "TOTAL GLOBAL DESTRUCTION.",

        requiresSite:
            false

    },

    DELTA: {

        name:
            "DELTA",

        effect:
            "DEATH RAY",

        description:
            "HIGH-ENERGY DEATH RAY TARGETING THE SELECTED FACILITY.",

        requiresSite:
            true

    },

    ALPHA: {

        name:
            "ALPHA",

        effect:
            "FACILITY TERMINATION",

        description:
            "DESTRUCTION OF THE SELECTED FACILITY.",

        requiresSite:
            true

    },

    BETA: {

        name:
            "BETA",

        effect:
            "RADIATION BOMB",

        description:
            "EXTREME RADIATION BOMB TARGETING THE SELECTED FACILITY.",

        requiresSite:
            true

    }

};


const WARHEAD_SITES = [
    "SITE-19",
    "SITE-51",
    "SITE-64"
];


/* =====================================================
   GET WARHEAD STATUS
===================================================== */

app.get(
    "/api/warhead",
    (req, res) => {

        const database =
            initializeDatabase();


        res.json({

            success: true,

            warhead:
                database.warhead,

            types:
                WARHEAD_TYPES,

            sites:
                WARHEAD_SITES

        });

    }
);


/* =====================================================
   ACTIVATE WARHEAD
===================================================== */

app.post(
    "/api/warhead/activate",
    (req, res) => {

        try {

            const {
                type,
                site
            } = req.body;


            const selectedType =
                String(
                    type || ""
                )
                .trim()
                .toUpperCase();


            if (
                !WARHEAD_TYPES[
                    selectedType
                ]
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "INVALID WARHEAD TYPE."

                });

            }


            const warheadType =
                WARHEAD_TYPES[
                    selectedType
                ];


            if (
                warheadType.requiresSite
            ) {

                if (
                    !WARHEAD_SITES.includes(
                        String(site)
                            .toUpperCase()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "VALID TARGET SITE IS REQUIRED."

                    });

                }

            }


            const database =
                initializeDatabase();


            database.warhead = {

                active:
                    true,

                type:
                    selectedType,

                site:
                    warheadType.requiresSite
                        ? String(site).toUpperCase()
                        : null,

                status:
                    "FIRING",

                message:
                    `${selectedType} WARHEAD ACTIVATED.`,

                activatedAt:
                    new Date().toISOString()

            };


            addSiteActivity(

                database,

                warheadType.requiresSite
                    ? String(site).toUpperCase()
                    : "GLOBAL",

                "WARHEAD",

                warheadType.requiresSite

                    ? `${selectedType} WARHEAD ACTIVATED AGAINST ${String(site).toUpperCase()}`

                    : `${selectedType} WARHEAD ACTIVATED - GLOBAL TERMINATION`

            );


            saveDatabase(
                database
            );


            res.json({

                success: true,

                warhead:
                    database.warhead

            });


        } catch (error) {

            console.error(
                "WARHEAD ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "WARHEAD ACTIVATION FAILED."

            });

        }

    }
);


/* =====================================================
   RESET WARHEAD
===================================================== */

app.post(
    "/api/warhead/reset",
    (req, res) => {

        try {

            const database =
                initializeDatabase();


            database.warhead = {

                active:
                    false,

                type:
                    null,

                site:
                    null,

                status:
                    "STANDBY",

                message:
                    "",

                activatedAt:
                    null

            };


            saveDatabase(
                database
            );


            res.json({

                success: true,

                warhead:
                    database.warhead

            });


        } catch (error) {

            console.error(
                "WARHEAD RESET ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "WARHEAD RESET FAILED."

            });

        }

    }
);


/* =====================================================
   SYSTEM STATUS
===================================================== */

app.get(
    "/api/status",
    (req, res) => {

        const database =
            initializeDatabase();


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


        const sites =
            Object.values(
                database.sites
            );


        const activeSites =
            sites.filter(
                site =>
                    site.status ===
                    "ACTIVE"
            ).length;


        const lockdownSites =
            sites.filter(
                site =>
                    site.status ===
                    "LOCKDOWN"
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

            totalSites:
                sites.length,

            activeSites,

            lockdownSites,

            warhead:
                database.warhead.active
                    ? "ACTIVE"
                    : "STANDBY",

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
                req.body.command ||
                ""
            )
            .trim()
            .toLowerCase();


        const database =
            initializeDatabase();


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
sites      Show registered sites
warhead    Show warhead status
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
                    request =>
                        request.status ===
                        "PENDING"
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
SITES        : ${Object.keys(database.sites).length}
WARHEAD      : ${database.warhead.active ? "ACTIVE" : "STANDBY"}`

            });

        }


        if (
            command ===
            "requests"
        ) {

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
            "sites"
        ) {

            const sites =
                Object.values(
                    database.sites
                );


            return res.json({

                output:
`SCP FOUNDATION SITES
==============================
${sites
    .map(
        site =>
            `${site.id.padEnd(10)} | ${site.status}`
    )
    .join("\n")}`

            });

        }


        if (
            command ===
            "warhead"
        ) {

            const warhead =
                database.warhead;


            return res.json({

                output:
`WARHEAD CONTROL SYSTEM
==============================
STATUS      : ${warhead.active ? "ACTIVE" : "STANDBY"}
TYPE        : ${warhead.type || "NONE"}
TARGET      : ${warhead.site || "GLOBAL"}
STATE       : ${warhead.status}`

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
   ERROR HANDLER
===================================================== */

app.use(
    (error, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        if (res.headersSent) {

            return next(
                error
            );

        }


        res.status(500).json({

            success:
                false,

            message:
                "INTERNAL SERVER ERROR."

        });

    }
);


/* =====================================================
   START SERVER
===================================================== */

initializeDatabase();


app.listen(
    PORT,
    HOST,
    () => {

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
            "WARHEAD: /warhead"
        );

        console.log(
            "========================================"
        );

    }
);