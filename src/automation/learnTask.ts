import lepik from "lepikjs";
import { Observable, Subject, catchError, from, map, of, switchMap, takeUntil, tap } from "rxjs";
import { CodeFunctions } from "@/code/client-code-functions";
import { createNewEventStore, EventStore, MimicStore, MouseClickData, parseMimicStore } from "@/modules/task/taskflow.model";
import { analyzeEvents } from "./analyze";
import { getNearestText } from "./automation.utils";
import { getWindowData } from "./window-data.utils";
import { newConversation } from "@/lib/utils";

export async function learnTask(mimicStore: MimicStore) {
    try {
        // Step 1: describe the flow
        await newConversation();
        await new Promise((resolve) => setTimeout(resolve, 500));
        const streaming = CodeFunctions.isStreaming();
        if (!streaming) {
            CodeFunctions.startStream();
        }

        if (!mimicStore.description) {
            await CodeFunctions.fakeStreamText("What is the flow about?");
            CodeFunctions.endStream();
            const input = await CodeFunctions.waitForInput();
            mimicStore.description = input;
        }

        // Step 2: apply reccuring listeners
        CodeFunctions.displayCursorContent(`<div class="text-xs opacity-75 flex gap-2 text-orange-300"><i class="animate-spin w-4 h-4" data-feather="aperture"></i> Watching your steps</div>`);

        const cancelPromise = CodeFunctions.startTaskRecording();
        const finalEvents = await startEventListener(mimicStore.events, cancelPromise);
        mimicStore.events = finalEvents;
        CodeFunctions.hideCursorContent();

        // Step 3: analyze the flow
        const newEvents = await startAnalysis(mimicStore);
        mimicStore.events = newEvents;

        // Step 4: save
        CodeFunctions.addNewTaskFlow(mimicStore);
    } catch (e) {
        console.log("ERROR: ", e);
        CodeFunctions.pushContentToStream("An error occured, the flow seems to be broken somehow.");
    } finally {
        CodeFunctions.endStream();
    }
}

async function startAnalysis(mimicStore: MimicStore) {
    try {
        const parsedCorrect = parseMimicStore(mimicStore);
        CodeFunctions.startStream();
        return await analyzeEvents({ ...mimicStore, events: parsedCorrect.events });
    } catch (e) {
        console.log("ERROR analysis: ", e);
        throw e;
    }
}

async function startEventListener(events: EventStore[], cancelPromise: Promise<void>): Promise<EventStore[]> {
    return new Promise((resolve) => {
        applyEventListener(events.length, cancelPromise, (event) => {
            events.push(event);

            if (event.isExit) {
                resolve(events);
            }
        });
    });
}

export async function assignUnderliningText(item: EventStore) {
    const textResult = CodeFunctions.extractTextFromImage(item.window_screenshot);
    const nearestText = getNearestText(textResult, item.mouse_position, item.scaleFactor);
    item.underlyingText = nearestText?.text;
}

function applyEventListener(startIndex: number, cancelPromise: Promise<void>, callback: (event: EventStore) => void) {
    const eventSubject = new Subject<EventStore>();
    let event = createNewEventStore(startIndex);
    let isAtNonRecordingApp = false;

    async function checkIfAtNonRecordingApp() {
        const winTitle = await CodeFunctions.getActiveWindow();
        isAtNonRecordingApp = winTitle?.title?.toLowerCase().includes("rawen");1
    }

    async function resolveEvent(resolvedEvent: EventStore) {
        eventSubject.next({ ...resolvedEvent });
    }

    eventSubject.pipe(
        switchMap((eventObject) => {
            return from(getWindowData()).pipe(
                map((data) => ({ ...eventObject, ...data })),
                tap((newEvent) => {
                    callback(newEvent as EventStore);

                    if (!newEvent.isExit) {
                        event = createNewEventStore(newEvent.index + 1);
                    }
                }),
                catchError((err) => {
                    console.log("Error getting window data: ", err);
                    return of({ eventObject }); // Return an empty object or the event with an error state
                })
            );
        })
    ).subscribe();

    from(cancelPromise).pipe(
        tap(() => resolveEvent({ ...event, isExit: true }))
    ).subscribe();

    lepik.on("mouseClick", (data: MouseClickData) => {
        checkIfAtNonRecordingApp();
        if (!isAtNonRecordingApp) {
            event.isMouseClick = true;
            resolveEvent(event);
        }
    })

    lepik.on("keyPress", (data: any | "enter") => {
        if (data == undefined || data == "umschalt" || isAtNonRecordingApp) return;

        if (data === "enter") {
            event.isKeyboardEnter = true;
            resolveEvent(event);
            return;
        }

        if (data === "Strg" || data === "Alt" || data === "Shift") {
            event.keyboardEvents.push(data);
            return;
        }

        if (data === "backspace") {
            if (event.keyboardText.length === 0) return;
            event.keyboardText = event.keyboardText.slice(0, -1);
            return;
        }

        if (data === "space") {
            event.keyboardText += " ";
            return;
        }

        event.keyboardText += data;
    })
}
