const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 6464;
const HOST = "0.0.0.0";

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");

const ADMIN_CODE =
    process.env.ADMIN_CODE || "SCP64-O5-ADMIN";

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));


// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_DATABASE = {

    requests: [],

    councilRequests: [],

    auditLog: [],

    siteActivity: [],

    sites: [

        // ====================================================
        // SITE-19
        // ====================================================

        {
            id: "SITE-19",
            name: "SITE-19",
            status: "ACTIVE",
            security: "LEVEL 3",
            personnel: "CLASSIFIED",
            incidents: "0",
            containment: "STABLE",
            satelliteMaterials: "AVAILABLE",
            location: "UNKNOWN",
            description:
                "STANDARD FOUNDATION CONTAINMENT FACILITY.",
            lore:
                "SITE-19 is a standard Foundation containment facility."
        },


        // ====================================================
        // SITE-51
        // ====================================================

        {
            id: "SITE-51",
            name: "SITE-51",
            status: "ACTIVE",
            security: "LEVEL 4",
            personnel: "CLASSIFIED",
            incidents: "0",
            containment: "MONITORED",
            satelliteMaterials: "AVAILABLE",
            location: "UNKNOWN",
            description:
                "HIGH SECURITY FOUNDATION FACILITY.",
            lore:
                "SITE-51 is a high-security Foundation facility."
        },


        // ====================================================
        // SITE-O5
        // ====================================================

        {
            id: "SITE-O5",
            name: "SITE-O5",
            status: "ACTIVE",
            security: "LEVEL 4",
            personnel: "257",
            incidents: "UNKNOWN",
            containment: "STABLE",
            satelliteMaterials: "UNKNOWN",
            location: "Montana, USA",

            description:
                "FOUNDATION LEVEL 4 FACILITY SPECIALIZING IN ANOMALOUS OBJECT CONTAINMENT, FIELD INVESTIGATIONS, AND THE STUDY OF UNEXPLAINED UNDERGROUND STRUCTURES.",

            lore:
`SITE-O5 was established in 1986 following a series of unexplained disappearances in the remote mountain regions of Montana.

Foundation reconnaissance teams initially believed the incidents were caused by an unidentified anomalous entity. However, investigations revealed that the missing individuals had all visited the same abandoned mining settlement approximately two weeks before disappearing.

The settlement was subsequently designated AREA-O5 and placed under Foundation control.

During the construction of SITE-O5, workers discovered a network of tunnels beneath the original mining facilities. The tunnels contained several abandoned rooms, outdated electrical equipment, and hundreds of handwritten records belonging to an unknown organization.

No records contained the name of the organization.

In 1991, a sealed door located deep within the underground tunnel network opened by itself for exactly 43 seconds.

Nothing emerged from the chamber.

However, every active radio inside SITE-O5 simultaneously transmitted the same unidentified signal.

The signal lasted exactly 43 seconds and has never been reproduced.

Following the incident, the lower tunnel network was sealed and classified as SUBLEVEL-O5.

SITE-O5 was subsequently converted into a permanent Level 4 Foundation facility specializing in anomalous object containment, field investigations, and the study of unexplained underground structures.

The original mining settlement remains under Foundation control.

Officially, SITE-O5 has no connection to the O5 Council. The designation "O5" was retained because it was the original identification assigned to the mining operation during the Foundation's first investigation.

CURRENT FOUNDATION RECORD

Personnel: 257
Contained Anomalies: CLASSIFIED
Sublevel Access: LEVEL 4 AUTHORIZATION REQUIRED
SUBLEVEL-O5: RESTRICTED
AREA-O5: FOUNDATION CONTROLLED

FOUNDATION NOTE:

"The door has remained closed since 1991. Personnel are reminded that the absence of activity does not constitute proof of containment."`
        },


        // ====================================================
        // SITE-64
        // ====================================================

        {
            id: "SITE-64",
            name: "UNKNOWN",
            status: "UNKNOWN",
            security: "UNKNOWN",
            personnel: "UNKNOWN",
            incidents: "UNKNOWN",
            containment: "UNKNOWN",
            satelliteMaterials: "UNKNOWN",
            location: "UNKNOWN",
            description: "UNKNOWN",
            lore: "UNKNOWN"
        }

    ],


    // ========================================================
    // SATELLITE
    // ========================================================

    satellite: {

        status: "STANDBY",
        progress: 0,
        materials: "UNKNOWN",
        deployment: "UNKNOWN",
        location: "UNKNOWN",
        purpose: "UNKNOWN"

    },


    // ========================================================
    // WARHEAD
    // ========================================================

    warhead: {

        active: false,

        type: null,

        site: null,

        target: null,

        status: "STANDBY",

        message: "",

        armedAt: null,

        activatedAt: null,

        firedAt: null,

        lastFire: null

    }

};


// ============================================================
// DATABASE
// ============================================================

function readDatabase() {

    try {

        if (!fs.existsSync(DATA_FILE)) {

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(
                    DEFAULT_DATABASE,
                    null,
                    4
                )
            );

            return structuredClone(
                DEFAULT_DATABASE
            );

        }

        const raw =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        const database =
            JSON.parse(raw);

        return database;

    } catch (error) {

        console.error(
            "DATABASE READ ERROR:",
            error
        );

        return structuredClone(
            DEFAULT_DATABASE
        );

    }

}


function saveDatabase(database) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            database,
            null,
            4
        )
    );

}


// ============================================================
// DATABASE MIGRATION / SITE INITIALIZATION
// ============================================================

function initializeSites(database) {

    if (!Array.isArray(database.sites)) {

        database.sites = [];

    }


    for (
        const defaultSite
        of DEFAULT_DATABASE.sites
    ) {

        const existing =
            database.sites.find(
                site =>
                    site.id === defaultSite.id
            );


        if (!existing) {

            database.sites.push(
                structuredClone(
                    defaultSite
                )
            );

        } else {

            // Eksik yeni alanları ekle
            if (
                existing.location === undefined
            ) {

                existing.location =
                    defaultSite.location;

            }

            if (
                existing.lore === undefined
            ) {

                existing.lore =
                    defaultSite.lore;

            }

        }

    }


    // ========================================================
    // SITE-19
    // ========================================================

    const site19 =
        database.sites.find(
            site =>
                site.id === "SITE-19"
        );


    if (site19) {

        site19.name = "SITE-19";
        site19.security = "LEVEL 3";

    }


    // ========================================================
    // SITE-51
    // ========================================================

    const site51 =
        database.sites.find(
            site =>
                site.id === "SITE-51"
        );


    if (site51) {

        site51.name = "SITE-51";
        site51.security = "LEVEL 4";

    }


    // ========================================================
    // SITE-O5
    // ========================================================

    const siteO5 =
        database.sites.find(
            site =>
                site.id === "SITE-O5"
        );


    if (siteO5) {

        siteO5.id = "SITE-O5";
        siteO5.name = "SITE-O5";

        siteO5.status = "ACTIVE";

        siteO5.security = "LEVEL 4";

        siteO5.personnel = "257";

        siteO5.containment = "STABLE";

        siteO5.location =
            "Montana, USA";

        siteO5.satelliteMaterials =
            siteO5.satelliteMaterials ||
            "UNKNOWN";

        siteO5.incidents =
            siteO5.incidents ||
            "UNKNOWN";

        siteO5.description =
            "FOUNDATION LEVEL 4 FACILITY SPECIALIZING IN ANOMALOUS OBJECT CONTAINMENT, FIELD INVESTIGATIONS, AND THE STUDY OF UNEXPLAINED UNDERGROUND STRUCTURES.";

        siteO5.lore =
`SITE-O5 was established in 1986 following a series of unexplained disappearances in the remote mountain regions of Montana.

Foundation reconnaissance teams initially believed the incidents were caused by an unidentified anomalous entity. However, investigations revealed that the missing individuals had all visited the same abandoned mining settlement approximately two weeks before disappearing.

The settlement was subsequently designated AREA-O5 and placed under Foundation control.

During the construction of SITE-O5, workers discovered a network of tunnels beneath the original mining facilities. The tunnels contained several abandoned rooms, outdated electrical equipment, and hundreds of handwritten records belonging to an unknown organization.

No records contained the name of the organization.

In 1991, a sealed door located deep within the underground tunnel network opened by itself for exactly 43 seconds.

Nothing emerged from the chamber.

However, every active radio inside SITE-O5 simultaneously transmitted the same unidentified signal.

The signal lasted exactly 43 seconds and has never been reproduced.

Following the incident, the lower tunnel network was sealed and classified as SUBLEVEL-O5.

SITE-O5 was subsequently converted into a permanent Level 4 Foundation facility specializing in anomalous object containment, field investigations, and the study of unexplained underground structures.

The original mining settlement remains under Foundation control.

Officially, SITE-O5 has no connection to the O5 Council. The designation "O5" was retained because it was the original identification assigned to the mining operation during the Foundation's first investigation.

CURRENT FOUNDATION RECORD

Personnel: 257
Contained Anomalies: CLASSIFIED
Sublevel Access: LEVEL 4 AUTHORIZATION REQUIRED
SUBLEVEL-O5: RESTRICTED
AREA-O5: FOUNDATION CONTROLLED

FOUNDATION NOTE:

"The door has remained closed since 1991. Personnel are reminded that the absence of activity does not constitute proof of containment."`;

    }


    // ========================================================
    // SITE-64
    // ========================================================

    const site64 =
        database.sites.find(
            site =>
                site.id === "SITE-64"
        );


    if (site64) {

        site64.name = "UNKNOWN";

        site64.status = "UNKNOWN";

        site64.security = "UNKNOWN";

        site64.personnel = "UNKNOWN";

        site64.incidents = "UNKNOWN";

        site64.containment = "UNKNOWN";

        site64.satelliteMaterials =
            "UNKNOWN";

        site64.location =
            "UNKNOWN";

        site64.description =
            "UNKNOWN";

        site64.lore =
            "UNKNOWN";

    }

}


// ============================================================
// DATABASE INITIALIZATION
// ============================================================

function initializeDatabase() {

    const database =
        readDatabase();


    if (
        !Array.isArray(
            database.requests
        )
    ) {

        database.requests = [];

    }


    if (
        !Array.isArray(
            database.councilRequests
        )
    ) {

        database.councilRequests = [];

    }


    if (
        !Array.isArray(
            database.auditLog
        )
    ) {

        database.auditLog = [];

    }


    if (
        !Array.isArray(
            database.siteActivity
        )
    ) {

        database.siteActivity = [];

    }


    if (
        !database.satellite ||
        typeof database.satellite !== "object"
    ) {

        database.satellite =
            structuredClone(
                DEFAULT_DATABASE.satellite
            );

    }


    if (
        !database.warhead ||
        typeof database.warhead !== "object"
    ) {

        database.warhead =
            structuredClone(
                DEFAULT_DATABASE.warhead
            );

    }


    initializeSites(
        database
    );


    saveDatabase(
        database
    );

}


// ============================================================
// HELPERS
// ============================================================

function getActor(
    req,
    fallback = "SYSTEM"
) {

    const actor =
        req.body?.actor ||
        req.headers["x-admin-user"] ||
        req.query?.actor;


    if (
        actor &&
        String(actor).trim()
    ) {

        return String(actor)
            .trim()
            .slice(0, 100);

    }


    return fallback;

}


function addAuditLog(
    database,
    category,
    action,
    message,
    details = {},
    actor = "SYSTEM"
) {

    if (
        !Array.isArray(
            database.auditLog
        )
    ) {

        database.auditLog = [];

    }


    const entry = {

        id:
            "AUDIT-" +
            Date.now() +
            "-" +
            Math.floor(
                Math.random() * 1000
            ),

        actor:
            String(
                actor || "SYSTEM"
            )
                .trim()
                .slice(0, 100),

        category:
            String(
                category || "SYSTEM"
            ).toUpperCase(),

        action:
            String(
                action || "UNKNOWN"
            ).toUpperCase(),

        message:
            String(
                message || ""
            ).slice(0, 2000),

        details:
            details &&
            typeof details === "object"
                ? details
                : {},

        createdAt:
            new Date().toISOString()

    };


    database.auditLog.unshift(
        entry
    );


    database.auditLog =
        database.auditLog.slice(
            0,
            500
        );


    return entry;

}


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


function generateCouncilRequestId() {

    const database =
        readDatabase();

    let id;


    do {

        id =
            "O5-" +
            Math.floor(
                10000 +
                Math.random() * 90000
            );

    } while (
        database.councilRequests.some(
            request =>
                request.id === id
        )
    );


    return id;

}


function addSiteActivity(
    database,
    siteId,
    action,
    message,
    actor = "SYSTEM"
) {

    if (
        !Array.isArray(
            database.siteActivity
        )
    ) {

        database.siteActivity = [];

    }


    database.siteActivity.unshift({

        id:
            "ACT-" +
            Date.now(),

        siteId,

        action,

        message,

        actor,

        createdAt:
            new Date().toISOString()

    });


    database.siteActivity =
        database.siteActivity.slice(
            0,
            500
        );

}


// ============================================================
// ADMIN LOGIN
// ============================================================

app.post(
    "/api/admin/login",
    (req, res) => {

        const code =
            String(
                req.body?.code || ""
            ).trim();


        if (!code) {

            return res.status(400).json({

                success: false,

                message:
                    "ADMIN CODE REQUIRED"

            });

        }


        if (code !== ADMIN_CODE) {

            const database =
                readDatabase();


            addAuditLog(
                database,
                "ADMIN",
                "LOGIN_FAILED",
                "Failed administrative authentication attempt.",
                {
                    ip: req.ip
                },
                "UNKNOWN"
            );


            saveDatabase(
                database
            );


            return res.status(401).json({

                success: false,

                message:
                    "INVALID ADMIN CODE"

            });

        }


        const database =
            readDatabase();


        addAuditLog(
            database,
            "ADMIN",
            "LOGIN",
            "Administrative access authenticated.",
            {},
            "O5 ADMINISTRATOR"
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            message:
                "ACCESS GRANTED",

            access:
                "O5 ADMINISTRATOR"

        });

    }
);


// ============================================================
// SYSTEM STATUS
// ============================================================

app.get(
    "/api/status",
    (req, res) => {

        const database =
            readDatabase();


        initializeSites(
            database
        );


        res.json({

            success: true,

            requests: {

                total:
                    database.requests.length,

                pending:
                    database.requests.filter(
                        r =>
                            r.status ===
                            "PENDING"
                    ).length,

                approved:
                    database.requests.filter(
                        r =>
                            r.status ===
                            "APPROVED"
                    ).length,

                rejected:
                    database.requests.filter(
                        r =>
                            r.status ===
                            "REJECTED"
                    ).length

            },


            council: {

                total:
                    database.councilRequests.length,

                pending:
                    database.councilRequests.filter(
                        r =>
                            r.status ===
                            "PENDING"
                    ).length

            },


            sites: {

                total:
                    database.sites.length,

                active:
                    database.sites.filter(
                        s =>
                            s.status ===
                            "ACTIVE"
                    ).length,

                lockdown:
                    database.sites.filter(
                        s =>
                            s.status ===
                            "LOCKDOWN"
                    ).length

            },


            warhead: {

                active:
                    database.warhead.active,

                status:
                    database.warhead.status,

                type:
                    database.warhead.type,

                target:
                    database.warhead.target

            },


            satellite:
                database.satellite,

            auditCount:
                database.auditLog.length,

            uptime:
                process.uptime()

        });

    }
);


// ============================================================
// NORMAL REQUESTS
// ============================================================

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

        const database =
            readDatabase();


        const name =
            String(
                req.body?.name || ""
            ).trim();


        const type =
            String(
                req.body?.type || ""
            )
                .trim()
                .toLowerCase();


        const typeName =
            String(
                req.body?.typeName || ""
            ).trim();


        const scp =
            String(
                req.body?.scp || ""
            ).trim();


        const message =
            String(
                req.body?.message || ""
            ).trim();


        if (!name) {

            return res.status(400).json({

                success: false,

                message:
                    "NAME REQUIRED"

            });

        }


        if (!type) {

            return res.status(400).json({

                success: false,

                message:
                    "REQUEST TYPE REQUIRED"

            });

        }


        if (!message) {

            return res.status(400).json({

                success: false,

                message:
                    "MESSAGE REQUIRED"

            });

        }


        if (
            type === "scp" &&
            !scp
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "SCP ID REQUIRED"

            });

        }


        const now =
            new Date().toISOString();


        const request = {

            id:
                generateRequestId(),

            name:
                name.slice(0, 200),

            type:
                type.slice(0, 50),

            typeName:
                typeName.slice(0, 100),

            scp:
                type === "scp"
                    ? scp.slice(0, 100)
                    : null,

            time: null,

            period: null,

            message:
                message.slice(0, 3000),

            status:
                "PENDING",

            adminMessage:
                "",

            createdAt:
                now,

            updatedAt:
                now

        };


        database.requests.unshift(
            request
        );


        addAuditLog(
            database,
            "REQUEST",
            "CREATE",
            `New request created: ${request.id}`,
            {
                requestId:
                    request.id,

                type:
                    request.type

            },
            request.name
        );


        saveDatabase(
            database
        );


        res.status(201).json({

            success: true,

            request

        });

    }
);


// ============================================================
// REQUEST APPROVE
// ============================================================

app.post(
    "/api/requests/:id/approve",
    (req, res) => {

        const database =
            readDatabase();


        const request =
            database.requests.find(
                r =>
                    r.id ===
                    req.params.id
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "REQUEST NOT FOUND"

            });

        }


        const message =
            String(
                req.body?.message || ""
            ).trim();


        request.status =
            "APPROVED";


        request.adminMessage =
            message.slice(
                0,
                3000
            );


        request.updatedAt =
            new Date().toISOString();


        addAuditLog(
            database,
            "REQUEST",
            "APPROVE",
            `Request approved: ${request.id}`,
            {
                requestId:
                    request.id
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            request

        });

    }
);


// ============================================================
// REQUEST REJECT
// ============================================================

app.post(
    "/api/requests/:id/reject",
    (req, res) => {

        const database =
            readDatabase();


        const request =
            database.requests.find(
                r =>
                    r.id ===
                    req.params.id
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "REQUEST NOT FOUND"

            });

        }


        const message =
            String(
                req.body?.message || ""
            ).trim();


        request.status =
            "REJECTED";


        request.adminMessage =
            message.slice(
                0,
                3000
            );


        request.updatedAt =
            new Date().toISOString();


        addAuditLog(
            database,
            "REQUEST",
            "REJECT",
            `Request rejected: ${request.id}`,
            {
                requestId:
                    request.id
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            request

        });

    }
);


// ============================================================
// O5 COUNCIL
// ============================================================

app.get(
    "/api/council/departure",
    (req, res) => {

        const database =
            readDatabase();


        res.json({

            success: true,

            requests:
                database.councilRequests

        });

    }
);


app.post(
    "/api/council/departure",
    (req, res) => {

        const database =
            readDatabase();


        const name =
            String(
                req.body?.name || ""
            ).trim();


        const rank =
            String(
                req.body?.rank || ""
            ).trim();


        const councilId =
            String(
                req.body?.councilId || ""
            ).trim();


        const reason =
            String(
                req.body?.reason || ""
            ).trim();


        const acknowledgement =
            req.body?.acknowledgement;


        if (
            !name ||
            !rank ||
            !councilId ||
            !reason
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "ALL O5 REQUEST FIELDS REQUIRED"

            });

        }


        if (
            acknowledgement !== true &&
            acknowledgement !== "true"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "ACKNOWLEDGEMENT REQUIRED"

            });

        }


        const now =
            new Date().toISOString();


        const request = {

            id:
                generateCouncilRequestId(),

            name:
                name.slice(0, 200),

            rank:
                rank.slice(0, 100),

            councilId:
                councilId.slice(0, 100),

            reason:
                reason.slice(0, 3000),

            acknowledgement:
                true,

            status:
                "PENDING",

            adminMessage:
                "",

            createdAt:
                now,

            updatedAt:
                now

        };


        database.councilRequests.unshift(
            request
        );


        addAuditLog(
            database,
            "O5",
            "CREATE",
            `New O5 Council request created: ${request.id}`,
            {
                requestId:
                    request.id,

                councilId:
                    request.councilId
            },
            request.name
        );


        saveDatabase(
            database
        );


        res.status(201).json({

            success: true,

            request

        });

    }
);


app.post(
    "/api/council/departure/:id/approve",
    (req, res) => {

        const database =
            readDatabase();


        const request =
            database.councilRequests.find(
                r =>
                    r.id ===
                    req.params.id
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "O5 REQUEST NOT FOUND"

            });

        }


        request.status =
            "APPROVED";


        request.adminMessage =
            String(
                req.body?.message || ""
            )
                .trim()
                .slice(0, 3000);


        request.updatedAt =
            new Date().toISOString();


        addAuditLog(
            database,
            "O5",
            "APPROVE",
            `O5 request approved: ${request.id}`,
            {
                requestId:
                    request.id
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            request

        });

    }
);


app.post(
    "/api/council/departure/:id/reject",
    (req, res) => {

        const database =
            readDatabase();


        const request =
            database.councilRequests.find(
                r =>
                    r.id ===
                    req.params.id
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "O5 REQUEST NOT FOUND"

            });

        }


        request.status =
            "REJECTED";


        request.adminMessage =
            String(
                req.body?.message || ""
            )
                .trim()
                .slice(0, 3000);


        request.updatedAt =
            new Date().toISOString();


        addAuditLog(
            database,
            "O5",
            "REJECT",
            `O5 request rejected: ${request.id}`,
            {
                requestId:
                    request.id
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            request

        });

    }
);


// ============================================================
// SITES
// ============================================================

app.get(
    "/api/sites",
    (req, res) => {

        const database =
            readDatabase();


        initializeSites(
            database
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            sites:
                database.sites

        });

    }
);


app.get(
    "/api/sites/:id",
    (req, res) => {

        const database =
            readDatabase();


        initializeSites(
            database
        );


        const site =
            database.sites.find(
                s =>
                    s.id.toUpperCase() ===
                    String(
                        req.params.id
                    ).toUpperCase()
            );


        if (!site) {

            return res.status(404).json({

                success: false,

                message:
                    "SITE NOT FOUND"

            });

        }


        res.json({

            success: true,

            site

        });

    }
);


app.get(
    "/api/sites/:id/activity",
    (req, res) => {

        const database =
            readDatabase();


        const id =
            String(
                req.params.id
            ).toUpperCase();


        const activity =
            database.siteActivity
                .filter(
                    item =>
                        String(
                            item.siteId
                        ).toUpperCase() ===
                        id
                );


        res.json({

            success: true,

            activity

        });

    }
);


app.put(
    "/api/sites/:id",
    (req, res) => {

        const database =
            readDatabase();


        initializeSites(
            database
        );


        const siteId =
            String(
                req.params.id || ""
            )
                .trim()
                .toUpperCase();


        const site =
            database.sites.find(
                item =>
                    String(
                        item.id
                    ).toUpperCase() ===
                    siteId
            );


        if (!site) {

            return res.status(404).json({

                success: false,

                message:
                    "SITE NOT FOUND"

            });

        }


        // ====================================================
        // SITE-64 FULL UNKNOWN
        // ====================================================

        if (
            siteId === "SITE-64"
        ) {

            Object.assign(
                site,
                {
                    name: "UNKNOWN",
                    status: "UNKNOWN",
                    security: "UNKNOWN",
                    personnel: "UNKNOWN",
                    incidents: "UNKNOWN",
                    containment: "UNKNOWN",
                    satelliteMaterials: "UNKNOWN",
                    location: "UNKNOWN",
                    description: "UNKNOWN",
                    lore: "UNKNOWN"
                }
            );


            saveDatabase(
                database
            );


            return res.json({

                success: true,

                site

            });

        }


        // ====================================================
        // ALLOWED VALUES
        // ====================================================

        const statuses = [
            "ACTIVE",
            "LOCKDOWN",
            "OFFLINE"
        ];


        const securityLevels = [
            "LEVEL 1",
            "LEVEL 2",
            "LEVEL 3",
            "LEVEL 4",
            "LEVEL 5",
            "UNKNOWN"
        ];


        const containmentLevels = [
            "STABLE",
            "MONITORED",
            "UNSTABLE",
            "CRITICAL",
            "UNKNOWN"
        ];


        // ====================================================
        // STATUS
        // ====================================================

        if (
            req.body.status &&
            statuses.includes(
                String(
                    req.body.status
                ).toUpperCase()
            )
        ) {

            site.status =
                String(
                    req.body.status
                ).toUpperCase();

        }


        // ====================================================
        // SECURITY
        // ====================================================

        if (
            req.body.security &&
            securityLevels.includes(
                String(
                    req.body.security
                ).toUpperCase()
            )
        ) {

            site.security =
                String(
                    req.body.security
                ).toUpperCase();

        }


        // ====================================================
        // CONTAINMENT
        // ====================================================

        if (
            req.body.containment &&
            containmentLevels.includes(
                String(
                    req.body.containment
                ).toUpperCase()
            )
        ) {

            site.containment =
                String(
                    req.body.containment
                ).toUpperCase();

        }


        // ====================================================
        // TEXT FIELDS
        // ====================================================

        const fields = [
            "personnel",
            "incidents",
            "satelliteMaterials",
            "description",
            "location",
            "lore"
        ];


        for (
            const field
            of fields
        ) {

            if (
                req.body[field] !==
                undefined
            ) {

                site[field] =
                    String(
                        req.body[field]
                    )
                        .trim()
                        .slice(
                            0,
                            field === "lore"
                                ? 10000
                                : field === "description"
                                    ? 2000
                                    : 500
                        );

            }

        }


        addSiteActivity(
            database,
            siteId,
            "CONFIGURATION",
            `Configuration updated for ${siteId}.`,
            getActor(req)
        );


        addAuditLog(
            database,
            "SITE",
            "UPDATE",
            `Site configuration updated: ${siteId}`,
            {
                siteId
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            site

        });

    }
);


// ============================================================
// SATELLITE
// ============================================================

app.get(
    "/api/satellite",
    (req, res) => {

        const database =
            readDatabase();


        res.json({

            success: true,

            satellite:
                database.satellite

        });

    }
);


app.put(
    "/api/satellite",
    (req, res) => {

        const database =
            readDatabase();


        const allowed = [
            "status",
            "progress",
            "materials",
            "deployment",
            "location",
            "purpose"
        ];


        for (
            const field
            of allowed
        ) {

            if (
                req.body[field] !==
                undefined
            ) {

                database.satellite[field] =
                    req.body[field];

            }

        }


        addAuditLog(
            database,
            "SATELLITE",
            "UPDATE",
            "Satellite configuration updated.",
            {},
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            satellite:
                database.satellite

        });

    }
);


// ============================================================
// WARHEAD
// ============================================================

app.get(
    "/api/warhead",
    (req, res) => {

        const database =
            readDatabase();


        res.json({

            success: true,

            warhead:
                database.warhead

        });

    }
);


app.post(
    "/api/warhead/arm",
    (req, res) => {

        const database =
            readDatabase();


        const type =
            String(
                req.body?.type || ""
            )
                .trim()
                .toUpperCase();


        const site =
            String(
                req.body?.site || ""
            )
                .trim()
                .toUpperCase();


        const validTypes = [
            "GAMMA",
            "DELTA",
            "ALPHA",
            "BETA"
        ];


        if (
            !validTypes.includes(
                type
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "INVALID WARHEAD TYPE"

            });

        }


        const now =
            new Date().toISOString();


        database.warhead = {

            ...database.warhead,

            active: true,

            type,

            site:
                type === "GAMMA"
                    ? "GLOBAL"
                    : site || "UNKNOWN",

            target:
                site || "GLOBAL",

            status:
                "ARMED",

            message:
                "WARHEAD ARMED",

            armedAt:
                now,

            activatedAt:
                null,

            firedAt:
                null

        };


        addAuditLog(
            database,
            "WARHEAD",
            "ARM",
            `Warhead armed: ${type}`,
            {
                type,
                site
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            warhead:
                database.warhead

        });

    }
);


// ============================================================
// WARHEAD FIRE
// ============================================================

app.post(
    "/api/warhead/fire",
    (req, res) => {

        const database =
            readDatabase();


        if (
            !database.warhead.active
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "NO WARHEAD ARMED"

            });

        }


        const now =
            new Date().toISOString();


        database.warhead.status =
            "FIRED";


        database.warhead.message =
            "WARHEAD FIRED";


        database.warhead.firedAt =
            now;


        database.warhead.lastFire =
            now;


        addAuditLog(
            database,
            "WARHEAD",
            "FIRE",
            "WARHEAD FIRED.",
            {
                type:
                    database.warhead.type,

                site:
                    database.warhead.site,

                target:
                    database.warhead.target
            },
            getActor(req)
        );


        addSiteActivity(
            database,
            database.warhead.site ||
                "GLOBAL",
            "WARHEAD",
            "WARHEAD FIRED.",
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            warhead:
                database.warhead

        });

    }
);


// ============================================================
// WARHEAD RESET
// ============================================================

app.post(
    "/api/warhead/reset",
    (req, res) => {

        const database =
            readDatabase();


        addAuditLog(
            database,
            "WARHEAD",
            "RESET",
            "Warhead system reset.",
            {},
            getActor(req)
        );


        database.warhead = {

            active: false,

            type: null,

            site: null,

            target: null,

            status: "STANDBY",

            message: "",

            armedAt: null,

            activatedAt: null,

            firedAt: null,

            lastFire:
                database.warhead.lastFire ||
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

    }
);


// ============================================================
// AUDIT LOG
// ============================================================

app.get(
    "/api/audit",
    (req, res) => {

        const database =
            readDatabase();


        let audit =
            database.auditLog;


        const category =
            String(
                req.query.category ||
                ""
            )
                .trim()
                .toUpperCase();


        const action =
            String(
                req.query.action ||
                ""
            )
                .trim()
                .toUpperCase();


        const actor =
            String(
                req.query.actor ||
                ""
            )
                .trim()
                .toLowerCase();


        if (category) {

            audit =
                audit.filter(
                    item =>
                        item.category ===
                        category
                );

        }


        if (action) {

            audit =
                audit.filter(
                    item =>
                        item.action ===
                        action
                );

        }


        if (actor) {

            audit =
                audit.filter(
                    item =>
                        item.actor
                            .toLowerCase()
                            .includes(actor)
                );

        }


        const limit =
            Math.min(
                Math.max(
                    Number(
                        req.query.limit
                    ) || 100,
                    1
                ),
                500
            );


        audit =
            audit.slice(
                0,
                limit
            );


        res.json({

            success: true,

            total:
                audit.length,

            audit

        });

    }
);


// ============================================================
// TERMINAL
// ============================================================

app.post(
    "/api/terminal",
    (req, res) => {

        const command =
            String(
                req.body?.command || ""
            )
                .trim();


        if (!command) {

            return res.json({

                success: true,

                output: ""

            });

        }


        const database =
            readDatabase();


        const lower =
            command.toLowerCase();


        let output = "";


        // ====================================================
        // CLEAR
        // ====================================================

        if (
            lower === "clear"
        ) {

            return res.json({

                success: true,

                output:
                    "__CLEAR__"

            });

        }


        // ====================================================
        // EXIT
        // ====================================================

        if (
            lower === "exit" ||
            lower === "close"
        ) {

            addAuditLog(
                database,
                "TERMINAL",
                "EXIT",
                "Terminal session closed.",
                {},
                getActor(req)
            );


            saveDatabase(
                database
            );


            return res.json({

                success: true,

                output:
                    "__EXIT__"

            });

        }


        // ====================================================
        // HELP
        // ====================================================

        if (
            lower === "help"
        ) {

            output =
`AVAILABLE COMMANDS

help
status
requests
council
sites
satellite
warhead
audit
activity
about
clear
exit`;

        }


        // ====================================================
        // STATUS
        // ====================================================

        else if (
            lower === "status"
        ) {

            output =
`SYSTEM STATUS

REQUESTS: ${database.requests.length}
O5 REQUESTS: ${database.councilRequests.length}
SITES: ${database.sites.length}
AUDIT ENTRIES: ${database.auditLog.length}

WARHEAD:
${database.warhead.status}

SATELLITE:
${database.satellite.status}`;

        }


        // ====================================================
        // REQUESTS
        // ====================================================

        else if (
            lower === "requests"
        ) {

            if (
                !database.requests.length
            ) {

                output =
                    "NO REQUESTS.";

            } else {

                output =
                    database.requests
                        .slice(0, 20)
                        .map(
                            r =>
`${r.id} | ${r.status} | ${r.name}`
                        )
                        .join("\n");

            }

        }


        // ====================================================
        // COUNCIL
        // ====================================================

        else if (
            lower === "council"
        ) {

            if (
                !database.councilRequests.length
            ) {

                output =
                    "NO O5 REQUESTS.";

            } else {

                output =
                    database.councilRequests
                        .slice(0, 20)
                        .map(
                            r =>
`${r.id} | ${r.status} | ${r.name}`
                        )
                        .join("\n");

            }

        }


        // ====================================================
        // SITES
        // ====================================================

        else if (
            lower === "sites"
        ) {

            initializeSites(
                database
            );


            output =
                database.sites
                    .map(
                        site =>
`${site.id} | ${site.name} | ${site.status} | ${site.security}`
                    )
                    .join("\n");

        }


        // ====================================================
        // SATELLITE
        // ====================================================

        else if (
            lower === "satellite"
        ) {

            output =
`STATUS: ${database.satellite.status}
PROGRESS: ${database.satellite.progress}%
MATERIALS: ${database.satellite.materials}
DEPLOYMENT: ${database.satellite.deployment}
LOCATION: ${database.satellite.location}
PURPOSE: ${database.satellite.purpose}`;

        }


        // ====================================================
        // WARHEAD
        // ====================================================

        else if (
            lower === "warhead"
        ) {

            output =
`WARHEAD STATUS

STATUS: ${database.warhead.status}
TYPE: ${database.warhead.type || "NONE"}
SITE: ${database.warhead.site || "NONE"}
TARGET: ${database.warhead.target || "NONE"}
MESSAGE: ${database.warhead.message || "NONE"}`;

        }


        // ====================================================
        // AUDIT
        // ====================================================

        else if (
            lower === "audit"
        ) {

            output =
                database.auditLog
                    .slice(0, 20)
                    .map(
                        item =>
`${item.category} | ${item.action} | ${item.actor} | ${item.message}`
                    )
                    .join("\n");

        }


        // ====================================================
        // ACTIVITY
        // ====================================================

        else if (
            lower === "activity"
        ) {

            output =
                database.siteActivity
                    .slice(0, 20)
                    .map(
                        item =>
`${item.siteId} | ${item.action} | ${item.message}`
                    )
                    .join("\n");

        }


        // ====================================================
        // ABOUT
        // ====================================================

        else if (
            lower === "about"
        ) {

            output =
`SCP-SITE64 FOUNDATION TERMINAL

SECURE FOUNDATION NETWORK
ACCESS LEVEL: CLASSIFIED
SYSTEM STATUS: ONLINE`;

        }


        // ====================================================
        // UNKNOWN
        // ====================================================

        else {

            output =
                `UNKNOWN COMMAND: ${command}`;

        }


        addAuditLog(
            database,
            "TERMINAL",
            "COMMAND",
            `Terminal command executed: ${command}`,
            {
                command
            },
            getActor(req)
        );


        saveDatabase(
            database
        );


        res.json({

            success: true,

            output

        });

    }
);


// ============================================================
// PAGE ROUTES
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "index.html"
            )
        );

    }
);


app.get(
    "/req",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "req.html"
            )
        );

    }
);


app.get(
    "/admin",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "admin.html"
            )
        );

    }
);


app.get(
    "/sites",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "sites.html"
            )
        );

    }
);


app.get(
    "/term",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "term.html"
            )
        );

    }
);


app.get(
    "/warhead",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "warhead.html"
            )
        );

    }
);


// ============================================================
// API 404
// ============================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API ENDPOINT NOT FOUND"

        });

    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "INTERNAL SERVER ERROR"

        });

    }
);


// ============================================================
// START
// ============================================================

initializeDatabase();


app.listen(
    PORT,
    HOST,
    () => {

        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "       SCP-SITE64 FOUNDATION"
        );

        console.log(
            "========================================"
        );

        console.log(
            `SERVER: http://localhost:${PORT}`
        );

        console.log(
            `ADMIN:  http://localhost:${PORT}/admin`
        );

        console.log(
            `SITES:  http://localhost:${PORT}/sites`
        );

        console.log(
            `TERM:   http://localhost:${PORT}/term`
        );

        console.log(
            `WARHEAD:http://localhost:${PORT}/warhead`
        );

        console.log(
            "========================================"
        );

        console.log("");

    }
);