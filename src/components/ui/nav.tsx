import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import {
  BrainCircuit,
  MessageCircle,
  Settings,
  ClipboardListIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import { randomUUID } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  addNavigateListener,
  addonTaskRecordChangeListener,
} from "@/code/client-code-executer";
import { useAppContext } from "@/state/app.state";
import { AppCollapse } from "./app-collapse";
import { CodeFunctions } from "@/code/client-code-functions";
import { TaskRecord } from "@/modules/task/task-recorder";

function Nav() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const [isRecordTracking, setIsTrackRecording] = useState<boolean>(false);

  useEffect(() => {
    addNavigateListener((url) => {
      navigate(url);
    });

    addonTaskRecordChangeListener((isRecording) => {
      setIsTrackRecording(isRecording);
    });
  }, []);

  function Content() {
    return (
      <Menubar>
        <MenubarMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenubarTrigger>
                  <Link to={"/interact?convoId=" + randomUUID()}>
                    <MessageCircle className="h-4 w-4 text-primary " />
                  </Link>
                </MenubarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Interaction</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenubarTrigger>
                  <Link to="/brain">
                    <BrainCircuit className="h-4 w-4 opacity-50 hover:opacity-90" />
                  </Link>
                </MenubarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Knowledge</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenubarTrigger>
                  <Link to="/tasks">
                    <ClipboardListIcon className="h-4 w-4 opacity-50 hover:opacity-90" />
                  </Link>
                </MenubarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Worflows</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenubarTrigger>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 opacity-50 hover:opacity-90" />
                  </Link>
                </MenubarTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
            <div className="dragger"></div>
          </TooltipProvider>
          <MenubarTrigger
            className="pr-0"
            style={{ cursor: "pointer", background: "transparent" }}
          >
            {!isRecordTracking && <AppCollapse />}
            {isRecordTracking && (
              <TaskRecord
                stopTaskRecording={() => {
                  CodeFunctions.stopTaskRecording();
                }}
              />
            )}
          </MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    );
  }
  return (
    <>
      {isVisible && (
        <div className="w-full ">
          <Content />
        </div>
      )}
    </>
  );
}

export default Nav;
