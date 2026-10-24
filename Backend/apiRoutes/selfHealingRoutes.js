const express = require("express");
const router = express.Router();

const Queue = require("../datamodels/Queue");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

// --------------------------------------------------
// SSE HELPERS: SEND LIVE RECOVERY EVENTS
// --------------------------------------------------

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --------------------------------------------------
// FAILURE 2: QUEUE WAITING-TIME DESYNCHRONIZATION
// --------------------------------------------------

router.post("/inject-queue-desync", async (req, res) => {
    const timeline = [];
    const testIds = [];
    let streamStarted = false;
    let failureInjected = false;
    let failureDetected = false;
    let recoveryCompleted = false;
    let verificationPassed = false;
    let cleanupCompleted = false;
    let notificationSent = false;

    try {
        beginStream(res);
        streamStarted = true;

        sendProgress(
            res,
            timeline,
            "injecting",
            "Starting the queue waiting-time self-healing test."
        );

        await wait(500);

        // Create temporary test customers.
        const testCustomers = await Queue.create([
            {
                customerName: "Resilio Queue Test A",
                mobileNumber: "9999900001",
                partySize: 2,
                arrivalType: "onsite",
                tokenNumber: `RTEST-A-${Date.now()}`,
                status: "Waiting",
                estimatedWaitMinutes: 0,
            },
            {
                customerName: "Resilio Queue Test B",
                mobileNumber: "9999900002",
                partySize: 2,
                arrivalType: "onsite",
                tokenNumber: `RTEST-B-${Date.now()}`,
                status: "Waiting",
                estimatedWaitMinutes: 10,
            },
            {
                customerName: "Resilio Queue Test C",
                mobileNumber: "9999900003",
                partySize: 2,
                arrivalType: "onsite",
                tokenNumber: `RTEST-C-${Date.now()}`,
                status: "Waiting",
                estimatedWaitMinutes: 20,
            },
        ]);

        testIds.push(...testCustomers.map((customer) => customer._id));

        // STEP 1: Inject the incorrect waiting time.
        const corruption = await Queue.updateOne(
            { _id: testIds[1] },
            { $set: { estimatedWaitMinutes: 999 } }
        );

        if (corruption.matchedCount !== 1) {
            throw new Error("Could not inject the queue waiting-time failure.");
        }

        failureInjected = true;

        sendProgress(
            res,
            timeline,
            "injected",
            "Failure injected: Test B waiting time changed to 999 minutes.",
            {
                failureType: "queue-desynchronization",
                customerName: "Resilio Queue Test B",
                incorrectValue: 999,
            }
        );

        await wait(500);

        // STEP 2: Detect incorrect waiting times.
        const beforeRecovery = [];

        for (let index = 0; index < testIds.length; index++) {
            const customer = await Queue.findById(testIds[index]).lean();

            if (!customer) {
                throw new Error(`Test customer ${index + 1} could not be found.`);
            }

            const expectedWaitMinutes = index * 10;

            beforeRecovery.push({
                customerName: customer.customerName,
                tokenNumber: customer.tokenNumber,
                storedWaitMinutes: customer.estimatedWaitMinutes,
                expectedWaitMinutes,
                mismatch:
                    customer.estimatedWaitMinutes !== expectedWaitMinutes,
            });
        }

        const detectedProblems = beforeRecovery.filter(
            (customer) => customer.mismatch
        );

        if (detectedProblems.length === 0) {
            throw new Error("The injected queue failure was not detected.");
        }

        failureDetected = true;

        sendProgress(
            res,
            timeline,
            "detected",
            `Failure detected: ${detectedProblems.length} incorrect waiting-time value(s) found.`,
            {
                beforeRecovery,
                detectedProblems,
            }
        );

        await wait(700);

        // STEP 3: Automatically repair the incorrect values.
        sendProgress(
            res,
            timeline,
            "recovery_started",
            "Automatic recovery started. Recalculating waiting times."
        );

        const repairOperations = testIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: {
                    $set: {
                        estimatedWaitMinutes: index * 10,
                    },
                },
            },
        }));

        await Queue.bulkWrite(repairOperations);

        await wait(500);

        // STEP 4: Verify the repaired values.
        const afterRecovery = [];

        for (let index = 0; index < testIds.length; index++) {
            const customer = await Queue.findById(testIds[index]).lean();

            if (!customer) {
                throw new Error(
                    `Test customer ${index + 1} disappeared before verification.`
                );
            }

            const expectedWaitMinutes = index * 10;

            afterRecovery.push({
                customerName: customer.customerName,
                tokenNumber: customer.tokenNumber,
                queuePosition: index + 1,
                estimatedWaitMinutes: customer.estimatedWaitMinutes,
                expectedWaitMinutes,
                correct:
                    customer.estimatedWaitMinutes === expectedWaitMinutes,
            });
        }

        verificationPassed = afterRecovery.every(
            (customer) => customer.correct
        );

        if (!verificationPassed) {
            throw new Error(
                "Recovery ran, but waiting-time verification failed."
            );
        }

        recoveryCompleted = true;

        sendProgress(
            res,
            timeline,
            "recovered",
            "Recovery successful: all waiting times have been verified.",
            {
                afterRecovery,
                verificationPassed: true,
            }
        );

        await wait(400);

        // STEP 5: Remove temporary test records.
        await Queue.deleteMany({
            _id: { $in: testIds },
        });

        const remainingTestCustomers = await Queue.countDocuments({
            _id: { $in: testIds },
        });

        if (remainingTestCustomers !== 0) {
            throw new Error("Temporary test data cleanup failed.");
        }

        cleanupCompleted = true;

        sendProgress(
            res,
            timeline,
            "cleanup",
            "Temporary test customers removed. Real queue records were not targeted."
        );

        await wait(300);

        // STEP 6: Record the recovery notification.
        const notificationMessage =
            "Queue desynchronization was detected and repaired successfully.";

        notificationSent = true;

        sendProgress(
            res,
            timeline,
            "notification",
            notificationMessage,
            {
                notificationType: "recovery-success",
                notificationStatus: "recorded",
            }
        );

        // Final result returned to the frontend.
        const result = {
            success: true,
            recovered: true,
            completed: true,
            failureType: "queue-desynchronization",
            message: notificationMessage,
            timeline,
            beforeRecovery,
            afterRecovery,
            notification: {
                message: notificationMessage,
                status: "recorded",
            },
            stages: {
                failureInjected,
                failureDetected,
                recoveryCompleted,
                verificationPassed,
                cleanupCompleted,
                notificationSent,
            },
        };

        sendEvent(res, "result", { result });
        res.end();
    } catch (error) {
        console.error("Queue desynchronization recovery failed:", error);

        // Attempt to remove temporary test data after a failure.
        if (testIds.length > 0) {
            try {
                await Queue.deleteMany({
                    _id: { $in: testIds },
                });

                const remaining = await Queue.countDocuments({
                    _id: { $in: testIds },
                });

                cleanupCompleted = remaining === 0;
            } catch (cleanupError) {
                console.error(
                    "Temporary test cleanup failed:",
                    cleanupError
                );
            }
        }

        if (streamStarted && !res.writableEnded) {
            sendProgress(
                res,
                timeline,
                "recovery_failed",
                `Self-healing test failed: ${error.message}`
            );

            const failureResult = {
                success: false,
                recovered: false,
                completed: false,
                failureType: "queue-desynchronization",
                message: error.message,
                timeline,
                stages: {
                    failureInjected,
                    failureDetected,
                    recoveryCompleted,
                    verificationPassed,
                    cleanupCompleted,
                    notificationSent,
                },
            };

            sendEvent(res, "result", { result: failureResult });
            res.end();
        } else if (!res.headersSent) {
            res.status(500).json({
                success: false,
                recovered: false,
                completed: false,
                message: error.message,
            });
        }
    }
});

module.exports = router;
