import { Routes, Route, Navigate } from "react-router-dom";
import Knowledege from "./knowledge/knowledege";
import Interaction from "./interaction/interaction";
import Settings from "./setttings/settings";
import { randomUUID } from "@/lib/utils";
import { useAppContext } from "@/state/app.state";
export const Routing = () => {
  const { state } = useAppContext();

  return (
    <>
      {state != undefined && (
        <Routes>
          <Route
            path="/"
            element={<Navigate to={"/interact?convoId=" + randomUUID()} />}
          />
          <Route path="/interact" element={<Interaction />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/brain" element={<Knowledege />} />
        </Routes>
      )}
      {state == undefined && (
        <>
          <div className="app-loading-wrap">
            <div className="Loader">
              <img
                src="mainlogo.png"
                alt="agentlia"
                width="156px"
                height="156px"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};
