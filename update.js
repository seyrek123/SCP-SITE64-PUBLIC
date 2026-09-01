const fs = require("fs");
const path = require("path");
const https = require("https");

const OWNER = "seyrek123";
const REPO = "SCP-SITE64-PUBLIC";
const BRANCH = "main";

const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
    console.error("ERROR: GITHUB_TOKEN NOT FOUND.");
    process.exit(1);
}

const ROOT = __dirname;

const FILES = [
    "server.js",
    "public/index.html",
    "public/admin.html",
    "public/sites.html",
    "public/term.html",
    "public/warhead.html"
];

function githubRequest(method, apiPath, body = null) {

    return new Promise((resolve, reject) => {

        const data =
            body
                ? JSON.stringify(body)
                : null;

        const options = {

            hostname: "api.github.com",

            path: apiPath,

            method,

            headers: {

                "User-Agent":
                    "SCP-SITE64-Updater",

                "Authorization":
                    `Bearer ${TOKEN}`,

                "Accept":
                    "application/vnd.github+json",

                "X-GitHub-Api-Version":
                    "2022-11-28"
            }
        };

        if (data) {

            options.headers[
                "Content-Type"
            ] = "application/json";

            options.headers[
                "Content-Length"
            ] = Buffer.byteLength(data);
        }

        const request =
            https.request(
                options,
                response => {

                    let output = "";

                    response.on(
                        "data",
                        chunk => {
                            output += chunk;
                        }
                    );

                    response.on(
                        "end",
                        () => {

                            let parsed;

                            try {
                                parsed =
                                    JSON.parse(
                                        output
                                    );
                            } catch {

                                parsed = {
                                    raw: output
                                };
                            }

                            if (
                                response.statusCode >= 200 &&
                                response.statusCode < 300
                            ) {

                                resolve(parsed);

                            } else {

                                reject(
                                    new Error(
                                        `GitHub API ${response.statusCode}: ${
                                            parsed.message ||
                                            output
                                        }`
                                    )
                                );
                            }
                        }
                    );
                }
            );

        request.on(
            "error",
            reject
        );

        if (data) {
            request.write(data);
        }

        request.end();
    });
}


async function getFile(file) {

    try {

        return await githubRequest(
            "GET",
            `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(file)}?ref=${BRANCH}`
        );

    } catch (error) {

        if (
            error.message.includes(
                "GitHub API 404"
            )
        ) {

            return null;
        }

        throw error;
    }
}


async function uploadFile(file) {

    const localPath =
        path.join(
            ROOT,
            file
        );

    if (
        !fs.existsSync(localPath)
    ) {

        console.log(
            `SKIPPED: ${file}`
        );

        return;
    }

    const content =
        fs.readFileSync(
            localPath
        );

    const base64 =
        content.toString(
            "base64"
        );

    const existing =
        await getFile(file);

    const body = {

        message:
            `Update ${file}`,

        content:
            base64,

        branch:
            BRANCH
    };

    if (
        existing &&
        existing.sha
    ) {

        body.sha =
            existing.sha;
    }

    console.log(
        `UPLOADING: ${file}`
    );

    await githubRequest(
        "PUT",
        `/repos/${OWNER}/${REPO}/contents/${file}`,
        body
    );

    console.log(
        `UPDATED: ${file}`
    );
}


async function main() {

    console.log("");
    console.log(
        "========================================"
    );
    console.log(
        "       SCP-SITE64 GITHUB UPDATER"
    );
    console.log(
        "========================================"
    );

    console.log(
        `REPOSITORY : ${OWNER}/${REPO}`
    );

    console.log(
        `BRANCH     : ${BRANCH}`
    );

    console.log("");

    for (
        const file of FILES
    ) {

        try {

            await uploadFile(
                file
            );

        } catch (error) {

            console.error(
                `FAILED: ${file}`
            );

            console.error(
                error.message
            );

            process.exit(1);
        }
    }

    console.log("");
    console.log(
        "========================================"
    );
    console.log(
        "ALL FILES UPDATED SUCCESSFULLY."
    );
    console.log(
        "RENDER SHOULD START A NEW DEPLOY."
    );
    console.log(
        "========================================"
    );
    console.log("");
}


main();