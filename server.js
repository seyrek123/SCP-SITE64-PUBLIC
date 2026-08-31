const express = require("express");
const fs = require("fs");
const path = require("path");


const app =
    express();


const PORT =
    6464;


const DATA_FILE =
    path.join(
        __dirname,
        "data.json"
    );


app.use(
    express.json()
);


app.use(
    express.static(
        __dirname
    )
);


/* =========================================
   DATABASE
========================================= */

function ensureDatabase() {

    if (
        !fs.existsSync(
            DATA_FILE
        )
    ) {

        fs.writeFileSync(
            DATA_FILE,

            JSON.stringify(
                {
                    requests: []
                },
                null,
                4
            )
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

    }

    catch {

        return {
            requests: []
        };

    }

}


function saveDatabase(
    database
) {

    fs.writeFileSync(
        DATA_FILE,

        JSON.stringify(
            database,
            null,
            4
        )
    );

}


/* =========================================
   ID
========================================= */

function generateId() {

    const number =
        Math.floor(
            10000 +
            Math.random() * 90000
        );


    return (
        "SITE64-" +
        number
    );

}


/* =========================================
   PAGES
========================================= */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


app.get(
    "/admin",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );

    }
);


/* =========================================
   GET REQUESTS
========================================= */

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


/* =========================================
   CREATE REQUEST
========================================= */

app.post(
    "/api/requests",
    (req, res) => {

        try {

            const {
                type,
                typeName,
                scp,
                time,
                period
            } = req.body;


            if (!type) {

                return res
                    .status(400)
                    .json({
                        message:
                            "TALEP TÜRÜ GEREKLİ."
                    });

            }


            if (!time) {

                return res
                    .status(400)
                    .json({
                        message:
                            "SAAT GEREKLİ."
                    });

            }


            if (
                type === "scp"
                &&
                !scp
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "SCP SEÇİLMELİ."
                    });

            }


            const hour =
                parseInt(
                    time.split(":")[0],
                    10
                );


            if (
                Number.isNaN(hour)
                ||
                hour < 1
                ||
                hour > 22
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "GEÇERSİZ SAAT."
                    });

            }


            const correctPeriod =
                hour <= 12
                    ? "NIGHT"
                    : "DAY";


            const database =
                readDatabase();


            const request = {

                id:
                    generateId(),

                type:
                    type,

                typeName:
                    typeName || type,

                scp:
                    scp || null,

                time:
                    time,

                period:
                    correctPeriod,

                status:
                    "PENDING",

                adminMessage:
                    "",

                createdAt:
                    new Date()
                    .toISOString(),

                updatedAt:
                    new Date()
                    .toISOString()

            };


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
                "       YENİ SITE-64 TALEBİ"
            );

            console.log(
                "========================================"
            );

            console.log(
                "ID      :",
                request.id
            );

            console.log(
                "TÜR     :",
                request.typeName
            );

            console.log(
                "SCP     :",
                request.scp || "N/A"
            );

            console.log(
                "SAAT    :",
                request.time
            );

            console.log(
                "DÖNEM   :",
                request.period
            );

            console.log(
                "DURUM   :",
                request.status
            );

            console.log(
                "========================================"
            );

            console.log("");


            res.status(201)
                .json({

                    success:
                        true,

                    request:
                        request

                });


        }

        catch (error) {

            console.error(
                error
            );


            res.status(500)
                .json({

                    message:
                        "SERVER ERROR."

                });

        }

    }
);


/* =========================================
   APPROVE
========================================= */

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
                    message:
                        "TALEP BULUNAMADI."
                });

        }


        const {
            message,
            time
        } = req.body;


        if (time) {

            const hour =
                parseInt(
                    time.split(":")[0],
                    10
                );


            if (
                Number.isNaN(hour)
                ||
                hour < 1
                ||
                hour > 22
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "GEÇERSİZ SAAT."
                    });

            }


            request.time =
                time;


            request.period =
                hour <= 12
                    ? "NIGHT"
                    : "DAY";

        }


        request.status =
            "APPROVED";


        request.adminMessage =
            message ||
            "TALEBİNİZ KABUL EDİLDİ.";


        request.updatedAt =
            new Date()
            .toISOString();


        saveDatabase(
            database
        );


        console.log(
            `[APPROVED] ${request.id}`
        );


        res.json({

            success:
                true,

            request:
                request

        });

    }
);


/* =========================================
   REJECT
========================================= */

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
                    message:
                        "TALEP BULUNAMADI."
                });

        }


        request.status =
            "REJECTED";


        request.adminMessage =
            req.body.message ||
            "TALEBİNİZ REDDEDİLDİ.";


        request.updatedAt =
            new Date()
            .toISOString();


        saveDatabase(
            database
        );


        console.log(
            `[REJECTED] ${request.id}`
        );


        res.json({

            success:
                true,

            request:
                request

        });

    }
);


/* =========================================
   CHANGE TIME
========================================= */

app.post(
    "/api/requests/:id/time",
    (req, res) => {

        const {
            time
        } = req.body;


        if (!time) {

            return res
                .status(400)
                .json({
                    message:
                        "SAAT GEREKLİ."
                });

        }


        const hour =
            parseInt(
                time.split(":")[0],
                10
            );


        if (
            Number.isNaN(hour)
            ||
            hour < 1
            ||
            hour > 22
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "GEÇERSİZ SAAT."
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
                    message:
                        "TALEP BULUNAMADI."
                });

        }


        request.time =
            time;


        request.period =
            hour <= 12
                ? "NIGHT"
                : "DAY";


        request.updatedAt =
            new Date()
            .toISOString();


        saveDatabase(
            database
        );


        console.log(
            `[TIME CHANGED] ${request.id} -> ${time}`
        );


        res.json({

            success:
                true,

            request:
                request

        });

    }
);


/* =========================================
   START
========================================= */

ensureDatabase();


app.listen(
    PORT,
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
            "SITE   : http://localhost:" +
            PORT
        );

        console.log(
            "ADMIN  : http://localhost:" +
            PORT +
            "/admin"
        );

        console.log(
            "========================================"
        );

        console.log("");

    }
);