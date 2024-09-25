import {
  EditIcon,
  ExternalLink,
  EyeIcon,
  KeyIcon,
  Keyboard,
  MouseIcon,
  PlayIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { appState, changeState } from "@/state/app.state";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { TinyPreviewIcon } from "@/modules/interaction/tiny-preview-icon";
import { saveStateElectron, toBase64 } from "@/lib/utils";
import { EventStore, MimicStore } from "./taskflow.model";
import { Textarea } from "@/components/ui/textarea";
import { DialogClose } from "@radix-ui/react-dialog";
import { learnTask } from "@/automation/learnTask";

export function RecordedTasksList() {
  const [tasksList, setTasksList] = useState<MimicStore[]>([]);
  const [selectedTask, setSelectedTask] = useState<MimicStore | null>(null);
  const [editableDescription, setEditableDescription] = useState<string>("");
  const dialogTriggerRef = useRef<HTMLButtonElement>(null); // Ref to trigger the dialog

  useEffect(() => {
    const tasks = appState?.taskFlows ?? [];
    setTasksList(tasks);
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setEditableDescription(selectedTask.description || "");
    }
  }, [selectedTask]);

  const record = () => {
    learnTask(selectedTask);
  };

  const deleteTask = (task: MimicStore) => {
    const newTasks = tasksList.filter((item) => item.id !== task.id);
    setTasksList(newTasks);
    changeState({ ...appState, taskFlows: newTasks });
    saveStateElectron();
  };

  const saveTask = () => {
    if (selectedTask) {
      const updatedTask = { ...selectedTask, description: editableDescription };
      const updatedTasks = tasksList.map((task) =>
        task.id === selectedTask.id ? updatedTask : task
      );
      setTasksList(updatedTasks);
      changeState({ ...appState, taskFlows: updatedTasks });
      saveStateElectron();
      setSelectedTask(null); // Close dialog after save
    }
  };

  const playTask = (task: MimicStore) => {
    console.log("playTask", task);
  };

  const EventPanel = ({ event }: { event: EventStore }) => {
    let eventText = "";
    let explainationText = event.explain?.replace("undefined", "") ?? undefined;
    let action = explainationText ? (
      <EyeIcon className="w-4 h-4 mr-2" />
    ) : undefined;
    let icon;
    let tinyImage;

    if (event.isMouseClick) {
      eventText = "Browse";
      icon = <MouseIcon className="w-4 h-4 mr-2"></MouseIcon>;
      tinyImage = (
        <TinyPreviewIcon
          src={toBase64(Buffer.from(event.mouse_area_screenshot))}
        />
      );
    }

    if (event.keyboardText) {
      eventText += `Text type: "${event.keyboardText}"`;

      if (event.keyboardTextReason) {
        eventText += ` (${event.keyboardTextReason})`;
      }

      icon = <Keyboard className="w-4 h-4 mr-2"></Keyboard>;
    }

    if (event.isOpenApp) {
      eventText += `Open app: "${event.app_path.split("\\").pop()}"`;
      icon = <ExternalLink className="w-4 h-4 mr-2"></ExternalLink>;
    }

    if (event.isKeyboardEnter) {
      const addition = eventText ? " and " : "";
      eventText += addition + "Key press : Enter";
      icon = <Keyboard className="w-4 h-4 mr-2"></Keyboard>;
    }

    return (
      <>
        {eventText && (
          <li>
            <div className="py-2 text-xs">
              <div className="flex">
                {icon}
                <span dangerouslySetInnerHTML={{ __html: eventText }}></span>
                {tinyImage}
              </div>
            </div>
          </li>
        )}
        {explainationText && (
          <li>
            <div className="flex text-xs py-2">
              {action}
              {explainationText}
            </div>
          </li>
        )}
      </>
    );
  };

  const addNewFlow = () => {
    const newFlow: MimicStore = {
      id: Math.random().toString(),
      description: "",
      events: [],
    };

    setTasksList([...tasksList, newFlow]);
    changeState({ ...appState, taskFlows: [...tasksList, newFlow] });
    saveStateElectron();

    setSelectedTask(newFlow); // Set the new task as selected

    // Trigger the dialog to open after setting the new task as selected
    setTimeout(() => {
      if (dialogTriggerRef.current) {
        dialogTriggerRef.current.click();
      }
    }, 0);
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <Table className="">
            <TableBody>
              {tasksList.map((item: MimicStore) => (
                <TableRow key={item.id}>
                  <Dialog>
                    <DialogTrigger
                      ref={dialogTriggerRef}
                      className="w-full"
                      onClick={(ev) => {
                        setSelectedTask(item);
                      }}
                    >
                      <TableCell className="p-4 w-full text-left">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <PlayIcon
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            playTask(item);
                          }}
                          className="w-4 h-4 mr-2 cursor-pointer hover:text-primary no-drag"
                          id={item.id}
                        ></PlayIcon>
                      </TableCell>
                    </DialogTrigger>

                    <DialogContent
                      className="no-drag"
                      style={{ maxHeight: "90vh", overflow: "auto" }}
                    >
                      <div>
                        {selectedTask && (
                          <>
                            <div className="mb-2">
                              Description{" "}
                              <span className="text-sm text-muted-foreground">
                                (Important)
                              </span>
                              <Textarea
                                placeholder="Describe the flow... (e.g. 'Adding a new item to the order list')"
                                className="w-full border rounded p-2 text-sm"
                                value={editableDescription}
                                onChange={(e) =>
                                  setEditableDescription(e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <ol className="list-decimal">
                                {selectedTask.events.map((event) => (
                                  <EventPanel key={event.index} event={event} />
                                ))}
                              </ol>
                            </div>
                            <Button variant="default" onClick={record}>
                              <PlayIcon className="w-4 h-4 mr-2"></PlayIcon>
                              Record workflow
                            </Button>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => deleteTask(item)}
                        >
                          Delete flow
                        </Button>
                        <DialogClose asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={saveTask}
                          >
                            Save
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex border-t py-2 items-center px-2">
          <Button variant="default" onClick={addNewFlow}>
            + New Flow
          </Button>
        </div>
      </div>
    </>
  );
}
