
const express = require("express");
const router = express.Router();

const Queue = require("../datamodels/Queue");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sendEvent(res, type, data) {
    if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    }
}

function sendProgress(res, timeline, stage, message, extra = {}) {
    const event = {
        stage,
        message,
        timestamp: new Date().toISOString(),
        ...extra,
    };

    timeline.push(event);
    sendEvent(res, "progress", { event });
}

function beginStream(res) {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
}

async function generateUniqueToken() {
    for (let attempt = 0; attempt < 100; attempt++) {
        const token = `R-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await Queue.exists({ tokenNumber: token });

        if (!exists) {
            return token;
        }
    }

    throw new Error("Could not generate a unique test token.");
}

function customerDetails(customer, status) {
    return {
        name: customer.customerName,
        mobileNumber: customer.mobileNumber,
        token: customer.tokenNumber,
        tokenNumber: customer.tokenNumber,
        status,
    };
}

// FAILURE 1: DUPLICATE TOKEN FAILURE
router.post("/inject-chaos", async (req, res) => {
    const timeline = [];
    const testIds = new Set();

    let streamStarted = false;
    let customerA = null;
    let customerB = null;
    let duplicateRejected = false;
    let duplicateError = null;
    let replacementToken = null;

    const stages = {
        failureInjected: false,
        failureDetected: false,
        recoveryCompleted: false,
        customerNotified: false,
        verificationPassed: false,
        cleanupSucceeded: false,
    };

    try {
        beginStream(res);
        streamStarted = true;

        sendProgress(
            res,
            timeline,
            "injecting",
            "Starting the controlled duplicate-token test."
        );

        await wait(400);

        const originalToken = await generateUniqueToken();

        // Step 1: Create Customer A.
        customerA = await Queue.create({
            customerName: "Resilio Test Customer A",
            mobileNumber: "9999900001",
            partySize: 2,
            arrivalType: "onsite",
            tokenNumber: originalToken,
            status: "Waiting",
            estimatedWaitMinutes: 0,
        });

        testIds.add(String(customerA._id));

        const attemptedCustomerB = {
            name: "Resilio Test Customer B",
            mobileNumber: "9999900002",
            token: originalToken,
            tokenNumber: originalToken,
            status: "Duplicate token attempt",
        };

        stages.failureInjected = true;

        sendProgress(
            res,
            timeline,
            "injected",
            "Failure injected: both customers are shown attempting to use the same token.",
            {
                customers: {
                    customerA: customerDetails(
                        customerA,
                        "Original token assigned"
                    ),
                    customerB: attemptedCustomerB,
                },
                tokenNumber: originalToken,
            }
        );

        await wait(700);

        // Step 2: Detect the duplicate-token failure.
        sendProgress(
            res,
            timeline,
            "detected",
            "Checking whether the database rejects Customer B's duplicate token.",
            {
                customers: {
                    customerA: customerDetails(
                        customerA,
                        "Original token assigned"
                    ),
                    customerB: attemptedCustomerB,
                },
            }
        );

        try {
            customerB = await Queue.create({
                customerName: "Resilio Test Customer B",
                mobileNumber: "9999900002",
                partySize: 2,
                arrivalType: "onsite",
                tokenNumber: originalToken,
                status: "Waiting",
                estimatedWaitMinutes: 0,
            });

            testIds.add(String(customerB._id));
        } catch (error) {
            if (error.code === 11000) {
                duplicateRejected = true;
                duplicateError =
                    "The database rejected the duplicate token.";
            } else {
                throw error;
            }
        }

        stages.failureDetected = true;

        sendProgress(
            res,
            timeline,
            "recovery_started",
            duplicateRejected
                ? "Duplicate detected and rejected. Assigning Customer B a replacement token."
                : "The database accepted the duplicate. Repairing Customer B's token.",
            {
                duplicateRejected,
                customers: {
                    customerA: customerDetails(
                        customerA,
                        "Original token retained"
                    ),
                    customerB: attemptedCustomerB,
                },
            }
        );

        await wait(700);

        // Step 3: Recover by assigning a unique token.
        replacementToken = await generateUniqueToken();

        if (customerB) {
            customerB.tokenNumber = replacementToken;
            await customerB.save();
        } else {
            customerB = await Queue.create({
                customerName: "Resilio Test Customer B",
                mobileNumber: "9999900002",
                partySize: 2,
                arrivalType: "onsite",
                tokenNumber: replacementToken,
                status: "Waiting",
                estimatedWaitMinutes: 0,
            });

            testIds.add(String(customerB._id));
        }

        stages.recoveryCompleted = true;

        sendProgress(
            res,
            timeline,
            "replacement_assigned",
            "Recovery action completed: Customer B received a unique replacement token.",
            {
                customers: {
                    customerA: customerDetails(
                        customerA,
                        "Original token retained"
                    ),
                    customerB: customerDetails(
                        customerB,
                        "Replacement token assigned"
                    ),
                },
                originalToken,
                replacementToken,
            }
        );

        await wait(400);

        // Step 4: Show the simulated customer notification AFTER recovery.
        const notification = {
            customerName: customerB.customerName,
            mobileNumber: customerB.mobileNumber,
            oldToken: originalToken,
            newToken: customerB.tokenNumber,
            message: `Your queue token has been updated to ${customerB.tokenNumber}. Please use your new token to track your queue.`,
            type: "in-app",
            status: "demo",
        };

        sendProgress(
            res,
            timeline,
            "customer_notified",
            `Test notification displayed for ${customerB.customerName}: ${notification.message}`,
            { notification }
        );

        stages.customerNotified = true;

        await wait(500);

        // Step 5: Verify both database records.
        sendProgress(
            res,
            timeline,
            "verification_started",
            "Verifying both customer records and checking token uniqueness."
        );

        const savedCustomerA = await Queue.findById(customerA._id).lean();
        const savedCustomerB = await Queue.findById(customerB._id).lean();

        const bothCustomersExist = Boolean(
            savedCustomerA && savedCustomerB
        );

        const tokensAreDifferent = Boolean(
            bothCustomersExist &&
            savedCustomerA.tokenNumber &&
            savedCustomerB.tokenNumber &&
            savedCustomerA.tokenNumber !== savedCustomerB.tokenNumber
        );

        const bothTestCustomersVerified =
            bothCustomersExist && tokensAreDifferent;

        stages.verificationPassed =
            duplicateRejected && bothTestCustomersVerified;

        sendProgress(
            res,
            timeline,
            tokensAreDifferent ? "recovered" : "recovery_failed",
            stages.verificationPassed
                ? "Recovery verified: the database rejected the duplicate and both customers now have different tokens."
                : tokensAreDifferent
                    ? "Tokens are now different, but the complete protection test did not pass. Check whether the database has a unique token index."
                    : "Verification failed: both customer records do not have different tokens.",
            {
                duplicateRejected,
                tokensAreDifferent,
                bothTestCustomersVerified,
                customers: {
                    customerA: savedCustomerA
                        ? customerDetails(savedCustomerA, "Verified")
                        : {
                            name: "Resilio Test Customer A",
                            token: originalToken,
                            status: "Record not found",
                        },
                    customerB: savedCustomerB
                        ? customerDetails(savedCustomerB, "Verified")
                        : {
                            name: "Resilio Test Customer B",
                            token: replacementToken,
                            status: "Record not found",
                        },
                },
            }
        );

        // Step 6: Remove temporary test records.
        sendProgress(
            res,
            timeline,
            "cleanup",
            "Removing temporary test customers."
        );

        await Queue.deleteMany({
            _id: { $in: [...testIds] },
        });

        const remainingTestRecords = await Queue.countDocuments({
            _id: { $in: [...testIds] },
        });

        stages.cleanupSucceeded = remainingTestRecords === 0;

        const success =
            stages.verificationPassed && stages.cleanupSucceeded;

        const result = {
            success,
            recovered: stages.recoveryCompleted && tokensAreDifferent,
            completed: true,
            failureType: "duplicate-token",
            message: success
                ? "Duplicate-token failure detected, recovered, verified, and cleaned up successfully."
                : !duplicateRejected
                    ? "Recovery changed the tokens, but the database accepted a duplicate. Configure a unique index on tokenNumber to pass the full test."
                    : "The test did not pass all recovery, verification, or cleanup checks.",
            durationMs: Date.now() - new Date(
                timeline[0].timestamp
            ).getTime(),
            timeline,
            testResults: {
                customerA: {
                    name: "Resilio Test Customer A",
                    token: originalToken,
                    tokenNumber: originalToken,
                },
                customerB: {
                    name: "Resilio Test Customer B",
                    attemptedToken: originalToken,
                    token: replacementToken,
                    tokenNumber: replacementToken,
                },
                duplicateRejected,
                duplicateError,
                bothTestCustomersVerified,
                notification,
            },
            verification: {
                duplicateRejected,
                bothTestCustomersVerified,
                tokensAreDifferent,
                cleanupSucceeded: stages.cleanupSucceeded,
            },
            stages,
        };

        sendEvent(res, "result", { result });
        res.end();
    } catch (error) {
        console.error("Duplicate-token test failed:", error);

        try {
            if (testIds.size > 0) {
                await Queue.deleteMany({
                    _id: { $in: [...testIds] },
                });

                const remaining = await Queue.countDocuments({
                    _id: { $in: [...testIds] },
                });

                stages.cleanupSucceeded = remaining === 0;
            } else {
                stages.cleanupSucceeded = true;
            }
        } catch (cleanupError) {
            console.error("Test cleanup failed:", cleanupError);
        }

        if (streamStarted && !res.writableEnded) {
            sendProgress(
                res,
                timeline,
                "recovery_failed",
                `Duplicate-token test failed: ${error.message}`
            );

            sendEvent(res, "result", {
                result: {
                    success: false,
                    recovered: false,
                    completed: false,
                    failureType: "duplicate-token",
                    message: error.message,
                    timeline,
                    stages,
                    verification: {
                        duplicateRejected,
                        tokensAreDifferent: false,
                        cleanupSucceeded: stages.cleanupSucceeded,
                    },
                },
            });

            res.end();
        } else if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
});



















/* FAILURE 2: QUEUE STATUS SYNCHRONIZATION FAILURE */

router.post("/synchronization-failure", async (req, res) => {
    const timeline = [];
    const testIds = new Set();
    let streamStarted = false;
    let testQueue = null;
    let token = null;
    let displayedStatus = null;
    let actualStatus = null;
    let mismatchDetected = false;
    let synchronized = false;

    const stages = {
        failureInjected: false,
        failureDetected: false,
        recoveryCompleted: false,
        verificationPassed: false,
        cleanupSucceeded: false,
    };

    const customer = {
        name: "Resilio Sync Test Customer",
        mobileNumber: "9999900003",
    };

    function customerEvent(statusDescription) {
        return {
            customers: {
                customerA: {
                    name: customer.name,
                    mobileNumber: customer.mobileNumber,
                    token,
                    status: statusDescription,
                },
            },
        };
    }

    try {
        beginStream(res);
        streamStarted = true;

        sendProgress(
            res,
            timeline,
            "injecting",
            "Starting the controlled queue status synchronization test."
        );

        await wait(400);

        // Create a temporary test customer in the database.
        token = await generateUniqueToken();

        testQueue = await Queue.create({
            customerName: customer.name,
            mobileNumber: customer.mobileNumber,
            partySize: 2,
            arrivalType: "onsite",
            tokenNumber: token,
            status: "Completed",
            estimatedWaitMinutes: 0,
        });

        testIds.add(String(testQueue._id));

        // Simulate an incorrect displayed status.
        displayedStatus = "Seated";
        actualStatus = testQueue.status;

        stages.failureInjected = true;

        sendProgress(
            res,
            timeline,
            "injected",
            `Failure injected: the displayed status is "${displayedStatus}", while the saved database status is "${actualStatus}".`,
            {
                displayedStatus,
                actualStatus,
                tokenNumber: token,
                ...customerEvent(
                    `Displayed status: ${displayedStatus}. Database status: ${actualStatus}.`
                ),
            }
        );

        await wait(600);

        // Detect the mismatch using the saved database record.
        const savedRecord = await Queue.findById(
            testQueue._id
        ).lean();

        if (!savedRecord) {
            throw new Error(
                "The temporary queue record could not be found."
            );
        }

        actualStatus = savedRecord.status;
        mismatchDetected = displayedStatus !== actualStatus;

        if (!mismatchDetected) {
            throw new Error(
                "The test could not reproduce the status mismatch."
            );
        }

        stages.failureDetected = true;

        sendProgress(
            res,
            timeline,
            "detected",
            `Status mismatch detected for ${customer.name}. Displayed: "${displayedStatus}"; database: "${actualStatus}".`,
            {
                displayedStatus,
                actualStatus,
                tokenNumber: token,
                ...customerEvent(
                    `Mismatch detected. Displayed: ${displayedStatus}. Saved: ${actualStatus}.`
                ),
            }
        );

        await wait(600);

        // Begin recovery.
        sendProgress(
            res,
            timeline,
            "recovery_started",
            "Recovery started: synchronizing the simulated queue display with the latest saved database status.",
            {
                displayedStatus,
                actualStatus,
                tokenNumber: token,
                ...customerEvent(
                    `Recovery in progress. Updating the displayed status from ${displayedStatus} to ${actualStatus}.`
                ),
            }
        );

        // Correct the simulated display using the saved status.
        displayedStatus = savedRecord.status;
        stages.recoveryCompleted = true;

        await wait(400);

        // Verify the corrected status against the database again.
        const verifiedRecord = await Queue.findById(
            testQueue._id
        ).lean();

        synchronized =
            Boolean(verifiedRecord) &&
            displayedStatus === verifiedRecord.status;

        if (verifiedRecord) {
            actualStatus = verifiedRecord.status;
        }

        stages.verificationPassed = synchronized;

        sendProgress(
            res,
            timeline,
            synchronized ? "recovered" : "recovery_failed",
            synchronized
                ? `Recovery verified: the displayed status and database status both equal "${actualStatus}".`
                : "Recovery verification failed: the displayed status does not match the saved database status.",
            {
                displayedStatus,
                actualStatus,
                synchronized,
                tokenNumber: token,
                ...customerEvent(
                    synchronized
                        ? `Verified. Displayed status: ${displayedStatus}. Database status: ${actualStatus}.`
                        : `Verification failed. Displayed: ${displayedStatus}. Database: ${actualStatus}.`
                ),
            }
        );

        // Clean up only the temporary record created by this test.
        sendProgress(
            res,
            timeline,
            "cleanup",
            "Removing the temporary synchronization test customer.",
            {
                tokenNumber: token,
                ...customerEvent(
                    "Temporary test record scheduled for cleanup."
                ),
            }
        );

        await Queue.deleteMany({
            _id: { $in: [...testIds] },
        });

        const remaining = await Queue.countDocuments({
            _id: { $in: [...testIds] },
        });

        stages.cleanupSucceeded = remaining === 0;

        const success =
            stages.failureInjected &&
            stages.failureDetected &&
            stages.recoveryCompleted &&
            stages.verificationPassed &&
            stages.cleanupSucceeded;

        const result = {
            success,
            recovered:
                stages.recoveryCompleted &&
                stages.verificationPassed,
            completed: true,
            failureType: "synchronization-failure",
            message: success
                ? "Queue status synchronization failure detected, recovered, verified, and cleaned up successfully."
                : "The synchronization test did not pass all verification and cleanup checks.",
            timeline,
            durationMs:
                Date.now() -
                new Date(timeline[0].timestamp).getTime(),
           testResults: {
    customerA: {
        name: customer.name,
        token,
        status: displayedStatus,
    },
    tokenNumber: token,
    staleStatus: "Seated",
    correctedStatus: displayedStatus,
},
            verification: {
                mismatchDetected,
                synchronized,
                cleanupSucceeded: stages.cleanupSucceeded,
            },
            stages,
        };

        sendEvent(res, "result", { result });
        res.end();
    } catch (error) {
        console.error(
            "Synchronization test failed:",
            error
        );

        try {
            if (testIds.size > 0) {
                await Queue.deleteMany({
                    _id: { $in: [...testIds] },
                });

                const remaining = await Queue.countDocuments({
                    _id: { $in: [...testIds] },
                });

                stages.cleanupSucceeded = remaining === 0;
            } else {
                stages.cleanupSucceeded = true;
            }
        } catch (cleanupError) {
            console.error(
                "Synchronization test cleanup failed:",
                cleanupError
            );
        }

        if (streamStarted && !res.writableEnded) {
            sendProgress(
                res,
                timeline,
                "recovery_failed",
                `Synchronization test failed: ${error.message}`,
                {
                    displayedStatus,
                    actualStatus,
                    tokenNumber: token,
                    ...(token
                        ? customerEvent(
                            "The synchronization test encountered an error."
                        )
                        : {}),
                }
            );

            sendEvent(res, "result", {
                result: {
                    success: false,
                    recovered: false,
                    completed: false,
                    failureType: "synchronization-failure",
                    message: error.message,
                    timeline,
                    stages,
                    verification: {
                        mismatchDetected,
                        synchronized,
                        cleanupSucceeded: stages.cleanupSucceeded,
                    },
                },
            });

            res.end();
        } else if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
});


module.exports = router;
